# Financials Module PRD

This document provides a detailed overview of the Financials module in the Clearing & Logistics ERP system. It is based on the existing implementation and is intended to be a comprehensive guide for developers and stakeholders.

## 1. Overview

The Financials module is a core component of the ERP, designed to track the complete financial lifecycle of each vehicle clearing. It provides a centralized system for managing costs, recording payments, and maintaining a clear audit trail, replacing manual spreadsheet-based methods.

## 2. Features

### 2.1. Financial Summaries

For each vehicle, the system maintains a financial summary that includes:

-   **Total Billed**: The total cost of clearing the vehicle. This is typically finalized after the customs assessment is complete.
-   **Total Paid**: The sum of all payments made for the vehicle.
-   **Balance Due**: The outstanding amount, calculated as `Total Billed - Total Paid`.

### 2.2. Payment Tracking (Installments)

The system supports logging multiple payment installments for each vehicle. This allows for flexible payment schedules and accurate tracking of the payment status. Each payment record includes:

-   Amount paid
-   Payment date
-   Reference (e.g., cheque number, transaction ID)
-   The user who recorded the payment

### 2.3. Balance Calculation

The balance due is automatically calculated and updated whenever a new payment is recorded or the total billed amount is adjusted. The system provides clear visual indicators (e.g., color-coding in the UI) to show whether a balance is outstanding or settled.

### 2.4. Audit Trails

Every financial transaction is meticulously logged to ensure data integrity and accountability. The system records:

-   **Who**: The user who performed the action.
-   **What**: The action performed (e.g., creating a financial record, recording a payment).
-   **When**: A timestamp of when the action occurred.

This creates an immutable audit trail that can be reviewed for compliance and reconciliation purposes.

## 3. Data Model

The financials module utilizes two primary tables in the PostgreSQL database:

### `Financials` Table

This table stores the main financial summary for each vehicle, with a one-to-one relationship with the `Vehicles` table.

| Column                      | Type      | Description                                     |
| --------------------------- | --------- | ----------------------------------------------- |
| `id`                        | `Integer` | Primary Key                                     |
| `vehicle_id`                | `Integer` | Foreign Key to the `Vehicles` table (unique)    |
| `total_cost`                | `Numeric` | Total billed amount for the vehicle             |
| `amount_paid`               | `Numeric` | Denormalized sum of all payments for fast reads |
| `exchange_rate_at_clearing` | `Numeric` | The exchange rate used for cost calculation     |
| `created_at`                | `DateTime`| Timestamp of creation                           |
| `updated_at`                | `DateTime`| Timestamp of the last update                    |

### `Payment` Table

This table stores individual payment installments, with a one-to-many relationship with the `Financials` table.

| Column         | Type      | Description                               |
| -------------- | --------- | ----------------------------------------- |
| `id`           | `Integer` | Primary Key                               |
| `financial_id` | `Integer` | Foreign Key to the `Financials` table     |
| `amount`       | `Numeric` | The amount of the payment installment     |
| `payment_date` | `Date`    | The date the payment was made             |
| `reference`    | `String`  | Optional reference for the payment        |
| `recorded_by_id` | `Integer` | Foreign Key to the `Users` table          |
| `created_at`   | `DateTime`| Timestamp of when the payment was recorded|
| `notes`        | `String`  | Optional notes about the payment          |

## 4. API Endpoints

The following RESTful API endpoints are available for the Financials module:

| Method  | Endpoint                                       | Description                                       |
| ------- | ---------------------------------------------- | ------------------------------------------------- |
| `GET`   | `/api/vehicles/{vehicle_id}/financials`        | Get the financial summary for a specific vehicle. |
| `POST`  | `/api/vehicles/{vehicle_id}/financials`        | Create a new financial record for a vehicle.      |
| `PATCH` | `/api/vehicles/{vehicle_id}/financials`        | Update the `total_cost` or `exchange_rate`.       |
| `POST`  | `/api/vehicles/{vehicle_id}/financials/payments` | Record a new payment installment for a vehicle.   |
| `GET`   | `/api/vehicles/{vehicle_id}/financials/payments` | List all payment installments for a vehicle.      |
| `GET`   | `/api/financials`                              | List all financial records (for admins/staff).    |

## 5. User Roles and Permissions (RBAC)

The Financials module adheres to the Role-Based Access Control (RBAC) policies defined in the system:

-   **Super-Admins and Managers**: Have full read/write access to all financial records. They can create, update, and view financial information for any vehicle.
-   **Field Staff/Agents**: Can record payments and view financial summaries for vehicles they are assigned to.
-   **Guests (Clients)**: Have read-only access to the financial summaries of their own vehicles.

## 6. Future Enhancements

### 6.1. Cost of Running Calculator

For vehicles that do not have a historical financial record, the system will provide a "Cost of Running" calculator. This tool will allow users to input various cost components to generate a quick estimate.

The calculator will automatically add a surcharge of **200,000 naira** if the selected terminal is **PTML (Port & Terminal Multiservices Ltd)**. This accounts for additional fees associated with that specific terminal.
