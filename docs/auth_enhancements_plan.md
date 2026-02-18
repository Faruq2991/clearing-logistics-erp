# Auth & Registration Enhancements Implementation Plan

This document outlines the plan for implementing several enhancements to the authentication and user registration system.

## 1. Default Role for New Sign-ups to be 'admin'

### Backend

*   **Modify `POST /api/auth/register` endpoint:**
    *   In `backend/app/api/endpoints/auth.py`, locate the `register` function.
    *   Change the default role assignment for new users from `'guest'` to `'admin'`.
    *   Ensure that the `role` parameter is still validated against the allowed roles (`admin`, `staff`, `guest`).

### Frontend

*   **Modify `RegisterPage.tsx`:**
    *   In `frontend/src/pages/RegisterPage.tsx`, in the `onSubmit` function, change the hardcoded `role` from `'guest'` to `'admin'`.

## 2. Admin Ability to Create 'staff' Users

### Backend

*   **Create a new endpoint `POST /api/users/`:**
    *   In `backend/app/api/endpoints/users.py`, create a new endpoint for creating users.
    *   This endpoint should be protected and only accessible by users with the `'admin'` role.
    *   The endpoint should accept `email`, `password`, and `role` in the request body.
    *   The service layer (`user_service.py`) should handle the creation of the new user.

### Frontend

*   **Modify `CreateUserPage.tsx`:**
    *   In `frontend/src/pages/CreateUserPage.tsx`, ensure the form includes a field for `role`.
    *   A dropdown menu would be suitable for the `role` field, allowing the admin to select between `'staff'` and other potential roles.
    *   The form submission should send a `POST` request to the new `/api/users/` endpoint with the user's details.

## 3. Auto-Login After Registration

### Frontend

*   **Modify `RegisterPage.tsx`:**
    *   In `frontend/src/pages/RegisterPage.tsx`, after a successful registration, instead of redirecting to the login page, call the `login` function from the `AuthContext`.
    *   The `login` function will require the user's `email` and `password` from the registration form.
    *   After successful login, the user will be automatically redirected to the dashboard.

## 4. Data Segmentation for Each User Account

This is a more complex feature that requires changes across the application. The goal is to ensure that users can only see data associated with their account.

### Backend

*   **Introduce `owner_id` to relevant models:**
    *   Add an `owner_id` field to the `Vehicle` model and other relevant models (e.g., `Financials`, `Documents`). This field will be a foreign key to the `User` model.
    *   Create Alembic migrations to apply these changes to the database schema.
*   **Update API endpoints to filter by `owner_id`:**
    *   Modify the service layer functions to filter data based on the `owner_id` of the currently authenticated user.
    *   For example, in `vehicle_service.py`, the `get_all_vehicles` function should be updated to return only the vehicles where `owner_id` matches the current user's ID.
*   **Update create endpoints to set `owner_id`:**
    *   When a new resource (e.g., a vehicle) is created, the `owner_id` should be automatically set to the ID of the currently authenticated user.

### Frontend

*   **No major changes are expected on the frontend** for this feature, as the backend will be responsible for returning the correct data. The existing UI should display the data returned by the API.

This plan is a high-level overview. I will await your review and approval before starting the implementation.
