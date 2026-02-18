# Feature Proposal: Advanced Estimator and Dynamic Costing

**Date:** February 17, 2026
**Author:** Senior Developer
**Status:** Proposed

## 1. Overview

This document outlines a plan to significantly enhance the cost estimation and input capabilities of the ERP system. Based on user feedback, this proposal addresses two key areas:

1.  **Manual Cost Input for Full Clearance:** The "Full Vehicle Clearance" option in the vehicle-add workflow will be equipped with a comprehensive cost input form, similar to the "Release & Gate" option.
2.  **Enhanced "Smart Estimator":** The estimator will be upgraded to provide more flexible and resilient estimates, searching for partial matches when an exact match is unavailable.

This will give users both the flexibility of manual entry and the power of data-driven estimation simultaneously.

---

## 2. Revised "Add Vehicle" Workflow

The primary changes will occur in the "Cost Determination" step of the `AddVehiclePage`.

### 2.1. Step 4: Cost Determination (Revised Logic)

This step will always show the "Smart Estimate" at the top, with a conditional form for manual cost input below it.

-   **Unconditional Component:**
    1.  **Smart Estimate (Upgraded):** The `EstimateDisplay` component will always be rendered, providing a real-time estimate based on the new backend logic.
-   **Conditional Component:**
    1.  **If "Full Vehicle Clearance" is selected:** A new, comprehensive `FullClearanceCostStep` component will be displayed for manual cost input.
    2.  **If "Release & Gate Only" is selected:** The existing, simpler `CostOfRunningStep` component will be displayed.

---
...
---
## 5. Implementation Steps
...
2.  **Frontend:**
    ...
    -   Modify `AddVehiclePage.tsx`:
        -   In the `StepContent` function for the "Cost Determination" step, render the `EstimateDisplay` component unconditionally. Below it, add the conditional logic to render either the new `FullClearanceCostStep` or the existing `CostOfRunningStep` based on the selected `clearance_type`.
...

This plan provides a clear path to delivering a more flexible and user-friendly costing and estimation feature, directly addressing your recent feedback while building on the existing codebase.
