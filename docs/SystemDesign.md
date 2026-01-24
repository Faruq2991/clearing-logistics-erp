# System Design: Clearing & Logistics ERP

**Project:** Distributed Logistics Management System
**Framework:** Three-Tier Architecture
**Key Goal:** High Availability, Data Consistency, and Intelligent Estimation.

This document outlines the technical blueprint for the Clearing & Logistics ERP. It is designed to be scalable, ensuring that as your database grows from 100 vehicles to 10,000, the "Rough Estimate" queries and document retrieval remain lightning-fast.

## 1. High-Level Architecture

The system follows a modular "Client-Server" model to decouple the user interface from the heavy mathematical logic of the estimation engine.

### A. Presentation Layer (Frontend)

*   **Technology:** Next.js (React).
*   **State Management:** TanStack Query (for caching server data).
*   **Design Pattern:** Component-Based Architecture (reusable cards for vehicles, ships, and documents).

### B. Application Layer (Backend API)

*   **Technology:** Python with FastAPI.
*   **ORM:** SQLAlchemy with Alembic for database migrations.
*   **Responsibilities:**
    *   Authentication & Role-Based Access Control (RBAC).
    *   The Estimation Engine logic.
    *   File upload orchestration.
*   **Concurrency Handling:** FastAPI's native `async/await` support for non-blocking I/O, ideal for handling concurrent requests and file uploads efficiently.

### C. Data Layer (Persistence)

*   **Primary Database:** PostgreSQL (Relational). Chosen for its strict schema and complex "Join" capabilities (e.g., joining Vehicles to Shipments and Financials).
*   **Object Storage:** AWS S3 or Cloudinary. Stores the actual "BL" and "Receipt" files.
*   **Caching Layer:** Redis (Optional for Phase 2). Used to store the most frequent "Rough Estimates" for common vehicles like the Toyota Corolla to reduce database load.

## 2. Distributed System Concepts Applied

### 2.1 Data Consistency & Integrity

In a financial system, consistency is non-negotiable.

*   **ACID Compliance:** Every payment log is a "Transaction." If the system fails halfway through recording a ₦500,000 payment, the database rolls back to ensure the balance doesn't reflect an incorrect number.
*   **Unique Constraints:** The VIN serves as a natural primary key to prevent "Data Drift" (duplicate records for the same vehicle).

### 2.2 Scalability (Vertical vs. Horizontal)

*   **Horizontal Scaling:** As your team grows, we can run multiple instances of the Backend API behind a Load Balancer.
*   **Database Indexing:** We will apply indexes on make, model, and year. Without this, searching through 5,000 cars would take seconds; with indexing, it takes milliseconds.

### 2.3 The "Smart Estimator" Logic Flow

The estimation engine functions as a micro-service logic within the app:

1.  **Request:** User inputs `Toyota + Camry + 2020`.
2.  **Aggregation:** The system performs a "Weighted Mean" query on historical records.
3.  **Normalization:** It fetches the current Customs Exchange Rate from a global settings table and adjusts the historical Naira cost to current market value.

## 3. Database Schema Design (Physical Model)

| Table          | Purpose                | Key Relationships                            |
|----------------|------------------------|----------------------------------------------|
| **Users**      | Identity & Roles       | 1:N with Logs                                |
| **Vehicles**   | Asset Tracking         | 1:1 with Financials, 1:N with Documents      |
| **Shipments**  | Logistics Tracking     | 1:N with Vehicles                            |
| **Financials** | Transaction Ledger     | 1:1 with Vehicles                            |
| **Exchange_Rates** | Currency Tracking    | Used globally for Estimates                  |

## 4. API Endpoints (Data Flow)

| Method  | Endpoint                               | Action                                         |
|---------|----------------------------------------|------------------------------------------------|
| `GET`   | `/api/vehicles`                        | Fetch all vehicles (with filters for Ship/Status). |
| `POST`  | `/api/estimate`                        | Trigger the Smart Estimator (Input: Make, Model, Year). |
| `PATCH` | `/api/vehicles/:id/status`             | Move a car from "Clearing" to "Done".          |
| `POST`  | `/api/upload`                          | Stream a document to Cloud Storage and save the URL. |

## 5. Security & Availability

*   **Encryption:** All data in transit is encrypted via HTTPS (TLS 1.3).
*   **Backups:** Automated daily snapshots of the PostgreSQL database.
*   **RBAC (Role-Based Access Control):** A "Field Agent" API token is restricted from accessing the `/api/admin/financial-reports` endpoint.
