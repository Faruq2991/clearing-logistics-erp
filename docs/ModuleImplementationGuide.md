# Module Implementation Guide: Documents & Financials

This document outlines a veteran developer approach to implementing the Documents and Financials modules for the Clearing & Logistics ERP, fully aligned with project objectives (PRD, SystemDesign, CustomerJourney).

---

## Guiding Principles

1. **Data model first** — Define models and relationships before endpoints.
2. **Flow-driven** — Design around the real workflow (CustomerJourney, PRD).
3. **Integrate with existing modules** — Tie into Vehicles, Estimates, Auth, and RBAC.
4. **Auditability** — Every important change is logged.
5. **Phased delivery** — Ship usable increments and avoid big-bang releases.

---

## Documents Module

### Business Context (from PRD & CustomerJourney)

- Documents are **per vehicle**.
- Types: Bill of Lading (BoL), Title, Customs Assessment, Duty Receipts, Terminal Delivery Order (DO).
- Field agents upload from mobile, often photos.
- Users must be able to preview documents in the browser.
- Need versioning when documents are replaced.
- Storage should be cloud-based (S3/Cloudinary) with controlled access.

### Data Model Design

```
Document
├── id (PK)
├── vehicle_id (FK → vehicles)
├── document_type (Enum: bol, title, customs_assessment, duty_receipt, delivery_order)
├── file_url (cloud storage URL — immutable per version)
├── file_name (original filename for display)
├── mime_type (for preview: PDF, image/*)
├── file_size_bytes
├── version (int, auto-incremented per vehicle+type)
├── uploaded_by_id (FK → users)
├── created_at (timestamp)
└── replaced_by_id (FK → documents, nullable — points to newer version)
```

- **Versioning:** Same vehicle + same type = new version; keep old row with `replaced_by_id` pointing to the new one.
- **Preview:** Use `mime_type` to choose between PDF viewer or image viewer.
- **Relationships:** `Vehicle` 1:N `Document`.

### API Design

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/vehicles/{vehicle_id}/documents` | Upload file (with `document_type`) |
| GET | `/api/vehicles/{vehicle_id}/documents` | List documents (current versions, optionally include history) |
| GET | `/api/documents/{document_id}` | Metadata (for UI) |
| GET | `/api/documents/{document_id}/preview` | Signed URL or redirect for in-browser preview |
| GET | `/api/documents/{document_id}/download` | Signed URL for download |
| DELETE | `/api/documents/{document_id}` | Soft-delete or mark deprecated (preserve audit trail) |

### Implementation Approach

1. **Storage abstraction**
   - Define `StorageService` interface: `upload(file, metadata) -> url`, `get_signed_url(key, action='get')`.
   - Implement for Cloudinary (or S3) and optionally add a local/development implementation.

2. **File handling**
   - Use `UploadFile`, validate MIME and size (e.g. 10MB).
   - Allow: PDF, JPEG, PNG.
   - Store original filename and Mime type for preview logic.

3. **Security**
   - Same RBAC as vehicles: STAFF/ADMIN full access; GUEST only their vehicles.
   - Use time-limited signed URLs for preview/download.
   - Reuse `get_current_user` and vehicle ownership checks.

4. **Versioning**
   - On upload for same vehicle + type: increment `version`, set `replaced_by_id` on previous row.
   - `GET /vehicles/{id}/documents` returns latest version per type by default.

5. **Preview**
   - If PDF: redirect to signed URL; browser handles preview.
   - If image: same; frontend can show in modal or new tab.

### Phased Delivery

| Phase | Scope |
|-------|--------|
| **Phase 1** | Upload + list; single storage provider (e.g. Cloudinary); no versioning |
| **Phase 2** | Versioning + preview |
| **Phase 3** | RBAC and soft-delete; optional audit logging |

---

## Financials Module

### Business Context (from PRD & CustomerJourney)

- One `Financials` record per vehicle (1:1).
- Must support **multiple installments** and derived **balance**.
- Exchange rate at clearing is needed for the estimator.
- Every payment must be auditable (who, when).
- Balance = Total Billed − Total Paid.

### Data Model Design

```
Financials (extend existing)
├── id (PK)
├── vehicle_id (FK, unique)
├── total_cost (Total Billed — editable when Customs Assessment is finalized)
├── amount_paid (denormalized sum of payments — for fast reads)
├── exchange_rate_at_clearing
├── created_at, updated_at
└── vehicle (relationship)

Payment (NEW — for installments and audit)
├── id (PK)
├── financial_id (FK → financials)
├── amount
├── payment_date
├── reference (optional: cheque #, transfer ref)
├── recorded_by_id (FK → users)
├── created_at (audit timestamp)
└── notes (optional)
```

- `amount_paid` = sum of `Payment.amount`; updated in same transaction when adding a payment.
- This keeps balance queries fast and supports multiple installments.

### API Design

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/vehicles/{vehicle_id}/financials` | Get financial summary (total_cost, amount_paid, balance) |
| POST | `/api/vehicles/{vehicle_id}/financials` | Create financials (when clearing costs are known) |
| PATCH | `/api/vehicles/{vehicle_id}/financials` | Update total_cost, exchange_rate (admin finalization) |
| POST | `/api/vehicles/{vehicle_id}/financials/payments` | Record a payment (add installment) |
| GET | `/api/vehicles/{vehicle_id}/financials/payments` | List payments (for audit/history) |
| GET | `/api/financials` | List all financials (admin/staff, with filters) |
| GET | `/api/financials/summary` | Monthly totals, outstanding balances, etc. |

### Implementation Approach

1. **Transactional integrity**
   - All payment operations in explicit DB transactions.
   - When inserting `Payment`:
     - Update `Financials.amount_paid += payment.amount`
     - Create `AuditLog` entry
   - Any failure triggers rollback.

2. **Balance logic**
   - `balance = total_cost - amount_paid`
   - Compute in service layer or DB view; expose in response.
   - Frontend can use it for Red (balance > 0) / Green (balance = 0).

3. **Estimator integration**
   - Ensure `exchange_rate_at_clearing` is set when finalizing clearing cost.
   - Estimator uses historical `Financials` plus this rate for normalization.

4. **Audit logging**
   - Add `AuditLog` model if missing.
   - Log on: create/update financials, add payment.
   - Fields: `user_id`, `action`, `table`, `record_id`, `old_value`, `new_value`, `timestamp`.

5. **RBAC**
   - STAFF/ADMIN: full financial access.
   - GUEST: only vehicles they own.

### Phased Delivery

| Phase | Scope |
|-------|--------|
| **Phase 1** | CRUD for `Financials`; payment recording; balance calculation; no AuditLog |
| **Phase 2** | `Payment` model; multiple installments; AuditLog for payments |
| **Phase 3** | `/api/financials/summary`; monthly filters; basic reporting |

---

## Module Interaction

Documents and Financials both depend on Vehicles:

```
Vehicle
  ├── documents (1:N)
  └── financials (1:1)
        └── payments (1:N)
```

Flow:

1. Vehicle created → optional documents uploaded.
2. Customs Assessment uploaded → admin finalizes clearing cost → `Financials` created/updated.
3. Payments recorded → balance updated → when zero, vehicle can be marked "Ready for Release".
4. Final documents (DO, Duty Receipt) uploaded → vehicle marked "Done".

---

## Technical Considerations

| Concern | Documents | Financials |
|---------|-----------|------------|
| **Storage** | Cloudinary/S3; signed URLs | PostgreSQL only |
| **Concurrency** | Low risk | Use DB locks or `SELECT FOR UPDATE` for balance updates |
| **Offline** | Defer uploads until online | Defer; design sync later |
| **Validation** | File type, size | Amounts > 0; total_cost ≥ amount_paid |
| **Indexes** | `vehicle_id`, `document_type` | `vehicle_id`, `created_at` |

---

## Suggested Implementation Order

1. **Financials Phase 1** — Foundation for estimator and payment tracking.
2. **Documents Phase 1** — Upload and list; unlocks the "initial upload" journey.
3. **Financials Phase 2** — Payments, installments, audit.
4. **Documents Phase 2** — Versioning and preview.
5. **Financials Phase 3** — Reporting.
6. **Documents Phase 3** — RBAC and cleanup.

---

*Last Updated: February 2026*
