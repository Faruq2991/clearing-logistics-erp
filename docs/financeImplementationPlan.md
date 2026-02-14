# Finance Module Implementation Plan

This document outlines the phased implementation plan for the Financials module, including the development of new features and alignment with the overall system architecture.

## 1. Guiding Principles

-   **Phased Rollout**: Deliver value incrementally.
-   **Consistency**: Adhere to the existing design patterns and technology stack (FastAPI, React, PostgreSQL).
-   **Test-Driven**: All new features must have comprehensive unit and integration tests.
-   **User-Centric**: Design with the end-user workflow in mind.

## 2. Implementation Phases

### Phase 1: Foundational Financials (Completed)

This phase represents the current state of the Financials module as described in the `ImplementationStatus.md`.

-   **Status**: Implemented and deployed.
-   **Features**:
    -   CRUD operations for financial records.
    -   Payment tracking with support for multiple installments.
    -   Automatic balance calculation.
    -   Role-Based Access Control (RBAC).
    -   Audit logging for all financial transactions.

### Phase 2: Cost of Running Calculator

This phase focuses on implementing the "Cost of Running" calculator as specified in the `financial.md` document.

-   **Timeline**: 2-3 sprints (4-6 weeks)
-   **Dependencies**: None

#### Backend Tasks

1.  **API Endpoint**:
    -   Create a new `POST` endpoint: `/api/estimate/cost-of-running`.
    -   This endpoint will accept a JSON payload with cost components (e.g., `vehicle_cost`, `shipping_fees`, `customs_duty`) and the `terminal`.
2.  **Calculation Logic**:
    -   Implement a service function to calculate the total estimated cost based on the input components.
    -   Include fixed costs for:
        -   **CPC**: 50,000 naira
        -   **Valuation**: 100,000 naira
        -   **846 Approval**: 60,000 naira
        -   **COMET**: 65,000 naira
    -   The function must also include the logic to automatically add **200,000 naira** to the total if the `terminal` is "PTML".
3.  **Data Validation**:
    -   Implement Pydantic models for request and response data validation.
    -   Ensure all cost components are positive numbers.
4.  **Unit and Integration Tests**:
    -   Write unit tests for the calculation logic, including a specific test for the PTML surcharge.
    -   Write integration tests for the new API endpoint.

#### Frontend Tasks

1.  **UI Component**:
    -   Create a new React component, `CostOfRunningCalculator.tsx`, in the `frontend/src/components/` directory.
    -   The component will feature a form with input fields for the various cost components and a dropdown for selecting the terminal.
2.  **API Integration**:
    -   Use the `axios` instance in `frontend/src/services/api.ts` to send a `POST` request to the new endpoint.
    -   Implement state management (e.g., using `useState` or a custom hook) to handle form data, loading state, and the calculated estimate.
3.  **Displaying the Estimate**:
    -   Add a section to the component to display the returned estimate from the API.
    -   Ensure the UI clearly indicates when the PTML surcharge has been applied.
4.  **Component Tests**:
    -   Write unit tests for the `CostOfRunningCalculator` component to verify its functionality and interactions.

### Phase 3: Financial Reporting

This phase will implement the financial reporting features mentioned in the `PRD.md`.

-   **Timeline**: 3-4 sprints (6-8 weeks)
-   **Dependencies**: Phase 2 completion is recommended but not strictly required.

#### Backend Tasks

1.  **API Endpoint**:
    -   Create a new `GET` endpoint: `/api/financials/summary`.
    -   This endpoint will support query parameters for filtering by date range (e.g., `start_date`, `end_date`).
2.  **Aggregation Logic**:
    -   Implement a service function to aggregate financial data from the `Financials` and `Payment` tables.
    -   The function should calculate:
        -   Total revenue (sum of `total_cost`).
        -   Total expenses (sum of all payments).
        -   Net profit.
        -   Total outstanding debt.
3.  **Database Optimization**:
    -   Ensure that the queries are optimized for performance, using database indexes where necessary.
4.  **Unit and Integration Tests**:
    -   Write unit tests for the aggregation logic.
    -   Write integration tests for the `/api/financials/summary` endpoint.

#### Frontend Tasks

1.  **Dashboard Integration**:
    -   Integrate the financial summary data into the main dashboard (`DashboardPage.tsx`).
    -   Add new charts (e.g., bar charts for monthly revenue, a summary card for total profit) using the `BarChartComponent.tsx`.
2.  **Date Range Filter**:
    -   Add a date range picker to the dashboard to allow users to filter the financial summary.
3.  **Data Visualization**:
    -   Present the summary data in a clear and easily digestible format.
    -   Use the `TrendIndicator.tsx` component to show trends in revenue and profit.
4.  **Component Tests**:
    -   Write unit tests for the new dashboard components and data visualizations.

## 3. Deployment Plan

-   Each phase will be developed on a separate feature branch.
-   Once all tasks in a phase are complete and the tests are passing, the feature branch will be merged into the main development branch.
-   The new features will be deployed to a staging environment for user acceptance testing (UAT) before being released to production.
