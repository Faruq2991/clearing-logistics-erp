# Feature Proposal: Conditional Vehicle Clearance Types (Revised)

**Date:** February 17, 2026
**Author:** Senior Developer
**Status:** Revised

## 1. Overview

This document outlines the implementation plan for a new feature that allows users to select a "Clearance Type" when adding a new vehicle. This revision is based on the clarification that the cost for a "Full Vehicle Clearance" should be derived from the existing "Smart Estimator" (historical data), while the "Release & Gate" option should use a manual cost input form.

## 2. User Story

As a clearing agent, when I add a new vehicle to the system, I want to specify whether I am handling the full clearance process or only the final release and gate-out.
- If I choose **Full Clearance**, the system should provide me with an accurate cost estimate based on historical data for similar vehicles. This estimate should then become the initial `total_cost` for the vehicle's financial record.
- If I choose **Release & Gate**, the system should allow me to manually enter the specific costs associated with that service.

## 3. Proposed Changes

### 3.1. Frontend Implementation (`AddVehiclePage.tsx`)

The "Add Vehicle" stepper will be modified to incorporate the choice of clearance type and conditionally display the correct cost-capturing interface.

**New Stepper Logic:**
1.  **Step 1 (New): Select Clearance Type**
    -   A simple form with two radio buttons:
        -   `Full Vehicle Clearance` (Default)
        -   `Release & Gate Only`
2.  **Step 2: Vehicle Information** (No change)
3.  **Step 3: Shipping Details** (No change)
4.  **Step 4: Cost Determination (Conditional)**
    -   If **"Full Vehicle Clearance"** was selected: The UI will display the `EstimateDisplay` component. This component will call the existing `GET /api/estimate/global-search` endpoint using the vehicle's make, model, and year to show a real-time historical estimate. There will be no manual input fields in this mode.
    -   If **"Release & Gate Only"** was selected: The UI will display the existing `CostOfRunningStep` component, allowing the user to manually input the individual costs for services like `agencies`, `examination`, `release`, etc.
5.  **Step 5: Review**
    -   The review step will be updated to display the chosen clearance type and the corresponding cost (either the Smart Estimate or the sum of manual inputs).

### 3.2. Backend Implementation

The backend changes are now much simpler and focused on accepting the new data, rather than new calculations.

**API Modification (`POST /api/vehicles/`):**
-   The `VehicleCreate` schema will be updated to accept two new optional fields:
    -   `clearance_type: str`
    -   `estimated_total_cost: float` (sent only if "Full Clearance" is chosen)
-   The vehicle creation service will be updated: If `estimated_total_cost` is provided, it will automatically create the associated `Financials` record for that vehicle, setting `total_cost` to the value of `estimated_total_cost`.

This approach avoids creating a new calculation endpoint and intelligently reuses the powerful "Smart Estimator" that is already built.

### 3.3. Database Changes (`models/main.py`)

To persist the user's choice, the `Vehicle` model will be updated.

**New `Vehicle` Field:**
-   `clearance_type`: An `Enum` field will be added to the `vehicles` table.
    -   **Values:** `FULL`, `RELEASE_GATE`
    -   **Default:** `FULL`

**Alembic Migration:**
-   A new Alembic migration script will be generated to add the `clearance_type` column to the `vehicles` table. The column will be non-nullable with a server default of `'FULL'`.

---

## 4. Implementation Steps

1.  **Database:**
    -   Add `ClearanceType` enum to `models/main.py`.
    -   Add `clearance_type` field to the `Vehicle` model.
    -   Generate and apply the Alembic migration.
2.  **Backend:**
    -   Update the `VehicleCreate` Pydantic schema in `schemas/main.py` to include `clearance_type` and `estimated_total_cost`.
    -   Modify the `create_vehicle` service in `services/vehicle_service.py` to automatically create a `Financials` record if `estimated_total_cost` is present.
3.  **Frontend:**
    -   Modify `AddVehiclePage.tsx` to include the new "Select Clearance Type" step.
    -   Update the `getStepContent` function in `AddVehiclePage.tsx` to conditionally render either the `EstimateDisplay` component (for "Full Clearance") or the `CostOfRunningStep` component (for "Release & Gate").
    -   Update the `Review` component to display the selected clearance type and cost.
    -   Update the final `onSubmit` function to send `clearance_type` and, if applicable, the `estimated_total_cost` to the backend when creating the vehicle.

This revised plan is more efficient, aligns perfectly with your feedback, and leverages the existing strengths of the application.
