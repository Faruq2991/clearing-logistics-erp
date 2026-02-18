# Multi-Tenancy Implementation Plan

This document outlines the detailed steps for converting the application into a multi-tenant system, where each tenant has its own isolated data and users.

## Phase 1: Backend Schema and Authentication

### 1. Create `Tenant` Model
- **File:** `backend/app/models/tenant.py` (new file)
- **Action:** Define a `Tenant` model with `id`, `name`, `created_at`, and any other relevant fields.

### 2. Add `tenant_id` to `User` Model
- **File:** `backend/app/models/user.py`
- **Action:** Add a `tenant_id` column as a foreign key to the `tenants` table. This field should be non-nullable.

### 3. Add `tenant_id` to Data Models
- **File:** `backend/app/models/main.py`
- **Action:** Add a `tenant_id` foreign key to the `Vehicle`, `Financials`, `Document`, and `Payment` models. This will ensure that all core data is associated with a tenant.

### 4. Create Alembic Migrations
- **Action:**
    - Run `alembic revision --autogenerate -m "add multi-tenancy tables and columns"` to create the migration script.
    - Review the generated script to ensure it correctly adds the new table and columns.
    - Run `alembic upgrade head` to apply the changes to the database.

### 5. Update Authentication
- **File:** `backend/app/services/auth_service.py`
- **Action:** In `create_access_token_for_user`, include the `tenant_id` in the JWT payload: `auth_utils.create_access_token(data={"sub": user.email, "role": user.role.value, "tenant_id": user.tenant_id})`.

- **File:** `backend/app/core/security.py`
- **Action:** In `get_current_user`, decode the `tenant_id` from the JWT. Modify the database query to fetch the user based on both `email` and `tenant_id`. This is a critical step to ensure that the user is correctly scoped to their tenant from the very beginning of the request.

## Phase 2: Backend Data Access Layer

The guiding principle for this phase is to replace all instances of role-based access control with tenant-based access control.

### 1. Refactor `vehicle_service.py`
- **Action:**
    - Remove the logic that checks for `UserRole.ADMIN` or `UserRole.STAFF` to grant access to all vehicles.
    - In `get_vehicles_list`, `get_vehicle_by_id`, etc., add a `tenant_id` filter to all database queries to ensure that only data from the current user's tenant is returned.

### 2. Refactor `financial_service.py`
- **Action:**
    - Apply the same `tenant_id` filtering to all data access functions, such as `get_financial_summary_for_vehicle` and `list_all_financial_records`.
    - Remove the `_get_vehicle_with_access` helper function's reliance on user roles and base it on tenant ownership.

### 3. Refactor `document_service.py`
- **Action:**
    - Apply the same `tenant_id` filtering to all data access functions, including `list_documents_for_vehicle` and `get_document_metadata`.

## Phase 3: Tenant and User Management

### 1. Tenant Creation
- **File:** `backend/app/services/auth_service.py`
- **Action:**
    - Update the `register_new_user` function.
    - When a new user registers, a new `Tenant` should be created for them.
    - The new user is then associated with this new tenant, and their role is set to `admin`.

## Phase 4: Frontend (Minimal Changes)

- **No core logic changes are needed** in the frontend for the initial implementation of data isolation, as the backend will handle it based on the JWT.
- **Future UI:**
    - A new section in the UI will be required for tenant admins to manage their tenant (e.g., change tenant name).
    - A user management section will be needed for admins to invite and manage staff users within their tenant.

## Phase 5: Fixing Data Segmentation Gaps

### 1. Fix Dashboard Data Leak
- **File:** `backend/app/services/dashboard_service.py`
- **Action:**
    - Review all functions in the dashboard service.
    - Add a `user_id` or `owner_id` filter to all database queries to ensure that dashboard metrics are calculated only for the currently authenticated user's data.

### 2. Fix Global VIN Uniqueness
- **File:** `backend/app/models/main.py`
- **Action:**
    - Remove the `unique=True` constraint from the `vin` column in the `Vehicle` model.
    - Add a `UniqueConstraint('vin', 'owner_id', name='uq_vin_owner')` to the `__table_args__` of the `Vehicle` model. This will ensure that a VIN is unique per user.

- **Action:**
    - Generate a new Alembic migration to apply this schema change.
    - Run `alembic revision --autogenerate -m "add composite unique constraint on vin and owner_id"` to create the migration script.
    - Review and apply the migration.

- **File:** `backend/app/services/vehicle_service.py`
- **Action:**
    - In the `create_new_vehicle` function, update the query that checks for an existing vehicle to filter by both `vin` and `owner_id`.
