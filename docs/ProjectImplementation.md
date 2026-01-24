# Project Implementation Plan: Clearing & Logistics ERP (MVP)

This document outlines the detailed, step-by-step process for building a Minimum Viable Product (MVP) for the Clearing & Logistics ERP system. The plan is divided into phases, starting from initial setup to deployment.

---

## Phase 0: Project Setup & Configuration (PIP Version)

**Goal:** Initialize the environment using standard Python tools and configure the storage/database connections.

1.  **Environment Configuration:**
    *   Create a `backend/.env` file with the following keys. The `CUSTOMS_EXCHANGE_RATE` is new and essential for the estimator.
        ```
        DATABASE_URL="postgresql://user:password@localhost/clearing_erp"
        SECRET_KEY="your-super-secret-key-for-jwt"
        CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
        CUSTOMS_EXCHANGE_RATE=1600.00
        ```
    *   Create a `frontend/.env.local` file:
        ```
        NEXT_PUBLIC_API_URL="http://localhost:8000/api"
        ```

2.  **Dependency Installation:**
    *   **Backend (Python):**
        ```bash
        # Navigate to the backend directory
        cd backend
        # Create and activate the virtual environment
        python3 -m venv venv
        source venv/bin/activate
        # Core stack plus logging and security
        pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary alembic python-multipart cloudinary python-dotenv passlib[bcrypt] python-jose[cryptography] sentry-sdk
        ```
    *   **PIP Reliability:** After installing dependencies, generate a `requirements.txt` file. This is critical for ensuring seamless and repeatable deployments.
        ```bash
        pip freeze > requirements.txt
        ```
    *   **Frontend (Node.js):**
        ```bash
        # Navigate to the frontend directory
        cd frontend
        # Install dependencies
        npm install
        ```

3.  **Database & Storage Setup:**
    *   **PostgreSQL:** Install and run PostgreSQL, then create the `clearing_erp` database.
    *   **Cloudinary:** Create an account and add your `CLOUDINARY_URL` to the `backend/.env` file.

## Phase 1: Backend Development (With Logic & Auditing)

**Goal:** Build the "Brains" of the system with an emphasis on data integrity and business logic.

1.  **Database Models (The "Truth" Layer):**
    *   In `backend/models/`, define the core SQLAlchemy models. This structure is critical for data integrity.
        *   `Vehicle`: (VIN, Make, Model, Year, Shipment_ID)
        *   `Financials`: (Total_Cost, Amount_Paid, Balance, **Exchange_Rate_At_Clearing**)
        *   `AuditLog`: (ID, User_ID, Action, Table_Name, Old_Value, New_Value, Timestamp)
        *   `Settings`: (Key, Value) — to store the current global `CUSTOMS_EXCHANGE_RATE`.
        *   Also include `User`, `Shipment`, and `Document` models as previously planned.

2.  **The "Smart Estimator" Logic Implementation:**
    *   Create a new service file: `backend/services/estimator.py`.
    *   Implement the estimation function, which will:
        1.  Fetch historical `Financials` records matching the vehicle's Make, Model, and Year.
        2.  Retrieve the `Exchange_Rate_At_Clearing` from those historical records.
        3.  Get the `CurrentRate` from the `Settings` table.
        4.  Adjust the old Naira cost to the current market value: `Estimate = (OldPrice / OldRate) * CurrentRate`.
        5.  Return a weighted average of the estimates to the API.

3.  **Database Migrations (Alembic):**
    *   Initialize Alembic: `alembic init migrations`.
    *   Configure `migrations/env.py` to see the new models.
    *   Generate the initial migration: `alembic revision --autogenerate -m "Add core business and audit models"`.
    *   Apply the schema to the database: `alembic upgrade head`.

4.  **Audit Middleware:**
    *   Create a utility function `log_action()` in `backend/core/auditing.py`.
    *   This function will be called as a dependency in the `POST`, `PATCH`, and `DELETE` API endpoints for `/api/vehicles` and `/api/financials`.
    *   It will record the user, the action, and the data changes into the `AuditLog` table.

5.  **API Endpoints:**
    *   Implement the CRUD endpoints for all new models.
    *   Create the `/api/estimate` endpoint that uses the estimator service.

---

## Phase 2: Frontend Development (UI Foundation)

**Goal:** Set up the Next.js frontend and build the basic user interface for interaction with the API.

1.  **Project Structure:**
    *   Organize the `frontend/src` directory into `components/`, `pages/`, `services/`, `hooks/`, `styles/`.

2.  **API Service Layer:**
    *   In `frontend/src/services/api.js`, create a client (e.g., using `axios`) to make requests to the backend. Configure it to handle JWT tokens automatically.

3.  **Authentication Flow:**
    *   Create a login page (`pages/login.js`).
    *   Implement the logic to call the `/token` endpoint and store the JWT in local storage or a cookie.
    *   Create a global context (`AuthContext`) to manage user authentication state throughout the app.
    *   Implement protected routes that require authentication.

4.  **Core UI Pages:**
    *   **Vehicle List Page (`pages/vehicles/index.js`):**
        *   Fetch and display a list of vehicles from the `/api/vehicles` endpoint.
        *   Use TanStack Query for data fetching, caching, and state management.
    *   **Vehicle Detail Page (`pages/vehicles/[id].js`):**
        *   Display detailed information for a single vehicle.

---

## Phase 3: Core Feature - "Smart Estimator"

**Goal:** Implement the estimation engine, the project's key feature.

1.  **Backend (`/api/estimate`):**
    *   Create the endpoint in `backend/api/endpoints/estimate.py`.
    *   Implement the `crud` function to perform the "Weighted Mean" query on historical financial data.
    *   Add logic to fetch the current exchange rate and normalize the final estimate.

2.  **Frontend (Estimator UI):**
    *   Create a new page or component with a form for users to input `make`, `model`, and `year`.
    *   On submission, call the `/api/estimate` endpoint.
    *   Display the returned estimate to the user, along with any relevant details.
    *   Use TanStack Query to cache the results of frequent estimates.

---

## Phase 4: Document Management

**Goal:** Enable users to upload and view documents associated with vehicles.

1.  **Backend (`/api/upload`):**
    *   Create the endpoint in `backend/api/endpoints/upload.py`.
    *   Use FastAPI's `UploadFile` to handle file intake.
    *   Integrate the Cloudinary (or S3) SDK to upload the file to object storage.
    *   On successful upload, save the document's URL to the `Document` table, linked to the appropriate vehicle.

2.  **Frontend (Upload UI):**
    *   On the vehicle detail page, add a file input component for document uploads.
    *   Implement the logic to send the file to the `/api/upload` endpoint.
    *   Create a component to display a list of already uploaded documents for the vehicle, with links to view them.

---

## Phase 5: Testing & Refinement

**Goal:** Ensure the MVP is stable, reliable, and ready for initial users.

1.  **Backend Testing (Pytest):**
    *   Write unit tests for `crud` functions and security logic.
    *   Write integration tests for all API endpoints, using a test database.

2.  **Frontend Testing (Jest/RTL):**
    *   Write unit tests for critical components (e.g., Estimator form).
    *   Write integration tests for user flows like login and vehicle creation.

3.  **End-to-End (E2E) Testing:**
    *   Manually perform a full run-through of the primary user journey:
        1.  User logs in.
        2.  User gets an estimate for a new vehicle.
        3.  User creates a new vehicle record.
        4.  User uploads a Bill of Lading for that vehicle.
        5.  User updates the vehicle's status from "Clearing" to "Done".

---

## Phase 6: MVP Deployment

**Goal:** Deploy the application to a cloud environment.

1.  **Containerization:**
    *   Create a `Dockerfile` for the backend service.
    *   Create a `Dockerfile` for the frontend service.

2.  **CI/CD Pipeline:**
    *   Set up a basic CI/CD pipeline using GitHub Actions to:
        *   Run tests on every push.
        *   Build and push Docker images to a registry (e.g., Docker Hub, AWS ECR).

3.  **Infrastructure & Deployment:**
    *   **Database:** Provision a managed PostgreSQL instance (e.g., AWS RDS).
    *   **Backend:** Deploy the backend Docker container (e.g., to AWS Fargate, Heroku, or a similar service).
    *   **Frontend:** Deploy the Next.js application to Vercel for optimal performance.

4.  **Post-Deployment:**
    *   Configure production environment variables.
    *   Run Alembic migrations on the production database: `alembic upgrade head`.
    *   Perform a final smoke test to ensure all parts of the system are communicating correctly.
