# Missing Features Implementation Plan

This document outlines the plan for implementing features that are currently missing from the project.

## 1. Complete Audit Trail

**Goal:** Ensure all changes (updates, deletes) to vehicle records are logged in the `audit_logs` table.

**Current Status:** Only vehicle creation is being logged.

**Files to Modify:**
*   `backend/app/services/vehicle_service.py`
*   `backend/app/core/auditing.py` (to potentially add more specific action types)

**Implementation Steps:**

1.  **Analyze `log_action` utility:** Review the existing `log_action` function in `backend/app/core/auditing.py`. It currently logs the creation of a vehicle. We need to extend it or use it to log updates and deletions.

2.  **Log Vehicle Updates:**
    *   In `backend/app/services/vehicle_service.py`, locate the `update_existing_vehicle` function.
    *   Before committing the changes to the database (`db.commit()`), gather the old and new values of the fields that have been changed. The `old_value` and `new_value` columns in the `AuditLog` table are strings, so we can serialize the changes to JSON.
    *   Call the `log_action` function with the appropriate parameters: `user_id`, `action="UPDATE"`, `table_name="vehicles"`, `record_id=vehicle.id`, `old_value=<json_string_of_old_values>`, and `new_value=<json_string_of_new_values>`.

3.  **Log Vehicle Deletions:**
    *   In `backend/app/services/vehicle_service.py`, locate the `delete_vehicle_record` function.
    *   Before deleting the vehicle, serialize the vehicle's current state to a JSON string.
    *   Call the `log_action` function with `action="DELETE"`, `table_name="vehicles"`, `record_id=vehicle.id`, and `old_value=<json_string_of_the_deleted_record>`.

4.  **Verification:**
    *   Write a unit test that updates a vehicle and asserts that a corresponding record is created in the `audit_logs` table.
    *   Write a unit test that deletes a vehicle and asserts that a corresponding record is created in the `audit_logs` table.

## 2. Enhanced Cost Estimator

**Goal:** Add "Terminal Analysis" to the "Smart Cost Estimator". This feature will provide more accurate estimates by considering costs associated with specific terminals.

**Files to Modify:**
*   `backend/app/services/estimate_service.py`
*   `backend/app/api/endpoints/estimate.py`
*   `frontend/src/pages/AddVehiclePage.tsx` (or wherever the estimator is used)
*   `frontend/src/hooks/useEstimate.ts`
*   `frontend/src/components/EstimateDisplay.tsx`

**Implementation Steps:**

1.  **Backend:**
    *   **Data Analysis:** Determine how to calculate terminal-specific costs. This will likely involve querying historical data from the `vehicles` table, grouping by `terminal`, and averaging the relevant cost fields (`agencies`, `examination`, etc.).
    *   **Update `get_clearing_cost_estimate`:** In `backend/app/services/estimate_service.py`, modify the `get_clearing_cost_estimate` function to accept an optional `terminal` parameter.
    *   If a `terminal` is provided, the function should perform a query to get the average costs for that terminal and use them in the estimate.
    *   **Update API:** In `backend/app/api/endpoints/estimate.py`, update the estimate endpoint to accept the `terminal` in the request body. Update the response model to include the terminal analysis data.

2.  **Frontend:**
    *   **Update UI:** In the frontend component where the estimator is used, add a dropdown or autocomplete field to select a terminal.
    *   **Update Hook:** In `frontend/src/hooks/useEstimate.ts`, modify the function that calls the estimate API to include the selected `terminal`.
    *   **Display Results:** In `frontend/src/components/EstimateDisplay.tsx`, update the component to display the terminal-specific cost breakdown.

## 3. Advanced Financial Reporting

**Goal:** Implement advanced, filterable financial reports for administrators.

**Files to Create/Modify:**
*   `backend/app/services/financial_service.py`
*   `backend/app/api/endpoints/financials.py`
*   `frontend/src/pages/FinancialReportsPage.tsx` (new file)
*   `frontend/src/components/reports/FinancialReport.tsx` (new file)
*   `frontend/src/hooks/useFinancials.ts`

**Implementation Steps:**

1.  **Backend:**
    *   **API Endpoint:** Create a new endpoint in `backend/app/api/endpoints/financials.py`, for example, `GET /api/v1/financials/reports`.
    *   This endpoint should accept query parameters for filtering, such as `start_date`, `end_date`, `vehicle_id`, etc.
    *   **Service Logic:** In `backend/app/services/financial_service.py`, create a new function `get_financial_report`. This function will contain the business logic for fetching and processing the report data. It will involve joining the `financials`, `payments`, and `vehicles` tables and applying the filters.
    *   **Data Aggregation:** The service should aggregate data to provide insights like total costs, total payments, and profit/loss over a given period.
    *   **Response Model:** Define a Pydantic schema for the report data.

2.  **Frontend:**
    *   **Create Reports Page:** Create a new page `FinancialReportsPage.tsx` that will be accessible from the main navigation (for authorized users).
    *   **Filtering UI:** On this page, add UI components for filtering the report (e.g., date range pickers, dropdowns for vehicles).
    *   **Data Fetching:** Update `frontend/src/hooks/useFinancials.ts` with a new function to fetch the report data from the new API endpoint.
    *   **Display Component:** Create a `FinancialReport.tsx` component to display the data in a clear and understandable format, using tables and possibly charts.

## 4. Document Versioning

**Goal:** Allow users to upload new versions of documents while retaining access to the old versions.

**Current Status:** The `documents` table already includes `version` and `replaced_by_id` columns, indicating that this feature was planned.

**Files to Modify:**
*   `backend/app/services/document_service.py`
*   `backend/app/api/endpoints/documents.py`
*   `frontend/src/components/DocumentsTab.tsx`
*   `frontend/src/hooks/useDocuments.ts`

**Implementation Steps:**

1.  **Backend:**
    *   **Update `upload_document` Service:** In `backend/app/services/document_service.py`, modify the `upload_document` (or equivalent) function.
    *   When a document is uploaded with the same `document_type` for a vehicle that already has a document of that type, the existing document should be marked as outdated.
    *   The new document should be saved with an incremented `version` number.
    *   The `replaced_by_id` of the old document should be set to the `id` of the new document.
    *   **API for previous versions:** Create a new API endpoint, e.g., `GET /api/v1/documents/{document_id}/versions`, to retrieve all versions of a specific document.

2.  **Frontend:**
    *   **UI for Version History:** In `frontend/src/components/DocumentsTab.tsx`, for each document, add a button or link to view its version history.
    *   **Display Versions:** When the user clicks to view version history, make a call to the new API endpoint and display the list of versions, with links to download each one.
    *   **Upload New Version:** The UI for uploading a document should make it clear to the user if they are replacing an existing document.
