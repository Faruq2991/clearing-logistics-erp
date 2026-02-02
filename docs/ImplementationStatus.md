# Core Project Functionalities — Implementation Status

This document summarizes how the core project functionalities (auth, documents, estimates, financials, vehicles) have been implemented in the Clearing & Logistics ERP codebase. Use it as a guide for further development.

---

## 1. Auth — Implemented

**Location:** `backend/app/api/endpoints/auth.py`  
**Security:** `backend/app/core/auth_utils.py`, `backend/app/core/security.py`

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/auth/login` | POST | Implemented |
| `/api/auth/register` | POST | Implemented |

**Features:**
- Login: email + password, JWT access token via `auth_utils.create_access_token()`
- Register: creates user with bcrypt-hashed password
- Password hashing (bcrypt), JWT (HS256, 24h expiry)
- `get_current_user`, `check_admin_privilege`, `check_staff_privilege` for protected routes

**Models:** `User` with `email`, `hashed_password`, `role` (ADMIN, STAFF, GUEST)

---

## 2. Documents — Implemented

**Location:** `backend/app/api/endpoints/documents.py`  
**Storage:** `backend/app/core/storage.py` (Cloudinary + local fallback)

| Endpoint | Method | Status |
|----------|--------|--------|
| `GET /api/vehicles/{vehicle_id}/documents` | GET | List documents for vehicle |
| `POST /api/vehicles/{vehicle_id}/documents` | POST | Upload document (form: document_type, file) |
| `GET /api/documents/{document_id}` | GET | Get document metadata |
| `GET /api/documents/{document_id}/preview` | GET | Preview document (redirect/serve) |
| `GET /api/documents/{document_id}/download` | GET | Download document |
| `DELETE /api/documents/{document_id}` | DELETE | Delete document |
| `GET /api/documents/files/{filename}` | GET | Serve local files (dev fallback) |

**Features:**
- Document types: Bill of Lading, Title, Customs Assessment, Duty Receipt, Delivery Order
- Allowed: PDF, JPEG, PNG. Max 10MB
- Storage: Cloudinary when `CLOUDINARY_URL` set; local `uploads/` otherwise
- RBAC: STAFF/ADMIN full access; GUEST only their vehicles

---

## 3. Estimates — Implemented

**Location:** `backend/app/api/endpoints/estimate.py`

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/estimate/global-search` | GET | Implemented |

**Features:**
- Query params: `make`, `model`, `year`
- Joins `Vehicle` and `Financials` for historical data
- Exchange rate normalization: uses `exchange_rate_at_clearing` and `CUSTOMS_EXCHANGE_RATE` when available
- Returns average clearing cost, sample size, and normalization status
- Requires auth via `get_current_user`

---

## 4. Financials — Implemented

**Location:** `backend/app/api/endpoints/financials.py`  
**Audit:** `backend/app/core/auditing.py`

| Endpoint | Method | Status |
|----------|--------|--------|
| `GET /api/vehicles/{vehicle_id}/financials` | GET | Get financial summary (with balance) |
| `POST /api/vehicles/{vehicle_id}/financials` | POST | Create financials (one per vehicle) |
| `PATCH /api/vehicles/{vehicle_id}/financials` | PATCH | Update total_cost, exchange_rate |
| `POST /api/vehicles/{vehicle_id}/financials/payments` | POST | Record payment (installment) |
| `GET /api/vehicles/{vehicle_id}/financials/payments` | GET | List payments for vehicle |
| `GET /api/financials` | GET | List all financials (admin/staff, paginated, filter by vehicle_id) |

**Features:**
- One Financials record per vehicle (unique vehicle_id; returns 400 if duplicate)
- Payment model for installments; AuditLog for create/update/payment
- Balance = total_cost − amount_paid (allows overpayment for refunds/credits)
- RBAC: STAFF/ADMIN full access; GUEST read-only for their vehicles

---

## 5. Vehicles — Implemented

**Location:** `backend/app/api/endpoints/vehicles.py`

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/vehicles/` | POST | Create vehicle |
| `/api/vehicles/` | GET | List vehicles (paginated) |
| `/api/vehicles/{id}` | GET | Get vehicle by ID |
| `/api/vehicles/{id}` | PUT | Full update |
| `/api/vehicles/{id}` | DELETE | Delete vehicle |
| `/api/vehicles/{id}/status` | PATCH | Update status |

**Features:**
- Full CRUD with DB and Pydantic schemas
- Role-based access: ADMIN/STAFF see all; GUEST only their own (`owner_id`)
- VIN uniqueness check
- Vehicle attributes: VIN, make, model, year, color, ship_name, terminal, arrival_date, status, owner_id

---

## Summary Table

| Module | Implementation Level | Notes |
|--------|----------------------|-------|
| **Auth** | Complete | Login, register, JWT, RBAC |
| **Documents** | Complete | Upload, list, preview, download, delete; Cloudinary/local storage |
| **Estimates** | Complete | Global search; exchange rate normalization |
| **Financials** | Complete | CRUD, payments, audit, balance; RBAC |
| **Vehicles** | Complete | Full CRUD, RBAC, status workflow |

---

## Additional Modules

**Users** (`/api/users/`): Admin-only user management (list, get, create, update role, delete) — implemented.

**Auto-admin:** On startup, creates default admin if none exists (email/password from `.env`).

---

## Recommended Next Steps

1. **Documents Phase 2:** Add versioning logic (replace document → set replaced_by_id, increment version).
2. **Financials Phase 3:** Add `GET /api/financials/summary` with monthly filters and basic reporting.
3. **OAuth2 tokenUrl:** In `security.py`, ensure `tokenUrl` matches the login endpoint (e.g., `tokenUrl="/api/auth/login"`) for correct OpenAPI/Swagger auth flow.
