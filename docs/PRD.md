# Product Requirements Document (PRD)
## Clearing & Logistics Management System

---

### Document Information

| Field | Value |
|-------|-------|
| **Project Name** | Clearing & Logistics Management System |
| **Status** | In Development / V1 Implemented |
| **Author** | Gemini (AI Thought Partner) |
| **Stakeholder** | System Owner / Lead Developer |
| **Last Updated** | January 2026 |

---

## 1. Executive Summary

The goal of this project is to replace manual spreadsheet-based tracking with a centralized web application. The system will manage the end-to-end clearing process for vehicles, store essential shipping documents, and provide intelligent clearing cost estimates based on historical data.

---

## 2. Target Audience

### User Roles

**Super-Admin (Owner)**
- Full visibility into financials, profit margins, and system settings

**Managers**
- Oversight of active shipments and terminal operations

**Field Staff/Agents**
- Data entry, status updates, and document uploads

---

## 3. Core Functional Requirements

### 3.1 Vehicle Management (CRUD)

The system must allow users to create, read, update, and delete vehicle records.

**Required Fields:**
- VIN (Unique)
- Make
- Model
- Year
- Color
- Ship Name
- Terminal
- Arrival Date
- Clearing Status

**Status Workflow:**
```
Backlog → In Transit → Clearing → Done
```

### 3.2 Document Vault

Each vehicle record must support multiple file uploads.

**Supported Document Types:**
- Bill of Lading (BoL)
- Title
- Customs Assessment
- Duty Receipts
- Terminal Delivery Orders

**Requirements:**
- Users must be able to preview documents within the browser without downloading
- Secure cloud storage with access controls
- Version tracking for updated documents (Implemented)

### 3.3 Smart Cost Estimator

The system must provide a "Rough Estimate" for clearing a vehicle during the "New Entry" phase.

**Logic Requirements:**
- The estimate must be filtered by Make, Model, AND Year
- Dynamic Factors: Logic must account for the current Customs Exchange Rate compared to the historical rate stored in the record
- Terminal Analysis: The system should show cost variances between different terminals (e.g., PTML vs. Five Star) (Implemented)

**Priority Hierarchy:**
1. Vehicle Year (primary cost driver)
2. Make and Model
3. Current exchange rate vs. historical rate
4. Terminal-specific costs

### 3.4 Financial Tracking

**Payment Management:**
- Ability to log multiple payment installments per vehicle
- Automatic calculation of Balance Due: `Total Billed − Total Paid`
- Visual indicators (Red/Green) for outstanding balances

**Financial Reporting:**
- Track total billed vs. total spent per vehicle
- Calculate profit margins
- Generate monthly financial summaries (Implemented via admin-only reporting page)

---

## 4. Technical Architecture

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React/Next.js (Responsive for Mobile/Desktop) |
| **Backend** | Node.js (REST API) |
| **Database** | PostgreSQL (Relational) for structured data |
| **File Storage** | Cloud-based (S3 or Cloudinary) for document security |
| **Authentication** | Role-Based Access Control (RBAC) |

### Architecture Principles
- Scalable and modular design
- RESTful API architecture
- Secure file handling and storage
- Real-time data synchronization

---

## 5. User Journey & UI Requirements

### Core UI Features

**Global Search**
- A persistent search bar to find vehicles by VIN or Consignee instantly
- Auto-complete suggestions
- Fast query response time (< 500ms)

**Dashboard**
- High-level view of active vessel counts
- Total outstanding debt visualization
- Quick access to recent vehicles
- Status distribution charts

**Mobile Optimization**
- Field agents must be able to upload photos of receipts directly from the port
- Responsive design for tablets and smartphones
- Touch-friendly interface elements
- Offline capability for basic data entry

### UX Principles
- Minimal clicks to complete common tasks
- Clear visual hierarchy
- Consistent navigation patterns
- Contextual help and tooltips

---

## 6. Data Integrity & Constraints

### Critical Business Rules

**No Duplicate VINs**
- The system must reject entries with an existing VIN to prevent double-billing
- Warning message when duplicate VIN is detected
- Option to view existing record

**Audit Logs**
- Every financial change (payment recorded) must be timestamped with the user who performed it
- Track all CRUD operations on vehicle records (Implemented)
- Maintain immutable audit trail

**Year-Based Logic**
- The estimator must prioritize the vehicle year, as it is a primary driver of clearing costs
- Year must be validated as a 4-digit number
- Year range validation (e.g., 1990-current year)

### Data Validation
- Required field enforcement
- Format validation for VIN numbers
- Date range validation
- Currency amount validation
- File size and type restrictions for uploads

---

## 7. Success Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Reduction in Error** | Zero duplicate vehicle entries | System audit logs |
| **Estimation Accuracy** | Estimates within 5-10% margin of actual clearing costs | Comparison of estimates vs. final costs |
| **Efficiency** | Time to retrieve documents reduced from minutes to seconds | User task completion time tracking |
| **User Adoption** | 90% of staff using system within 3 months | Login frequency and feature usage analytics |
| **Data Completeness** | 95% of required fields populated | Database completeness reports |

### Success Criteria
1. System successfully replaces spreadsheet workflow
2. Users can generate accurate estimates without manual calculation
3. Document retrieval time reduced by 90%
4. Zero financial discrepancies due to duplicate entries
5. Mobile access enables real-time updates from the field

---

## 8. Future Enhancements (Out of Scope for V1)

- Multi-currency support
- Integration with Customs API for real-time duty calculations
- Automated client notifications via SMS/Email
- Advanced analytics and predictive modeling
- Mobile native apps (iOS/Android)
- Integration with accounting software (QuickBooks, Xero)

---

## 9. Risks & Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Data migration from spreadsheets | High | Develop robust import tool with validation |
| User resistance to new system | Medium | Comprehensive training and gradual rollout |
| File storage costs | Medium | Implement file size limits and compression |
| Network connectivity at ports | High | Offline mode with sync capability |

---

## Appendix A: Glossary

- **VIN**: Vehicle Identification Number - Unique 17-character identifier
- **BoL**: Bill of Lading - Document issued by carrier to acknowledge receipt of cargo
- **PTML**: Port & Terminal Multiservices Limited - One of the terminals
- **DO**: Delivery Order - Authorization to release cargo
- **RBAC**: Role-Based Access Control - Permission system based on user roles

---

*This document serves as the primary specification for development. All changes must be reviewed and approved by the project stakeholder.*