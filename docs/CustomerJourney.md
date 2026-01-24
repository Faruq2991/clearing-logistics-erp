# User Journey Map: Clearing & Logistics ERP

**Project:** Vehicle Clearing Management System  
**Actor:** Clearing Manager / Admin  
**Goal:** Successfully clear a vehicle, track payments, and store documentation

---

## Overview

This document maps the end-to-end experience of a user interacting with the system. It ensures that the software design aligns with the real-world workflow of a clearing agent or business owner.

---

## Phase 1: Intake & Pre-Arrival

**Target:** Getting the vehicle into the system before it hits the port.

### 1. System Entry
The user receives a notification of a new shipment. They log in to the dashboard.

### 2. The Search Check
The user performs a quick search for the VIN to ensure the vehicle hasn't been entered previously (preventing duplicates).

### 3. New Entry & Prediction
- The user clicks "Add Vehicle."
- As they select "Mercedes," "ML350," and "2018," the sidebar instantly populates with a **Rough Estimate** (e.g., ₦2,950,000).
- The user uses this estimate to send a "Proforma Invoice" to the client.

### 4. Initial Upload
The user scans and uploads the Bill of Lading and Export Title received via email.

---

## Phase 2: Vessel Tracking & Arrival

**Target:** Monitoring the vessel status.

### 1. Vessel Filtering
The user filters the dashboard by Ship Name (e.g., "Silver Ray") to see all 15 vehicles expected on that vessel.

### 2. Status Update
Once the vessel berths, the user selects all vehicles on that ship and bulk-updates their status to "At Port / Clearing."

### 3. Terminal Assignment
The user confirms the terminal (PTML or Five Star) to ensure the clearing team knows where to go.

---

## Phase 3: The Clearing Process (Active)

**Target:** Handling the "nitty-gritty" of Customs and Port operations.

### 1. Customs Valuation
The field agent at the port gets the Customs Assessment. They take a photo with their phone and upload it directly to the app.

### 2. Cost Finalization
The Admin sees the assessment, enters the **Final Clearing Cost**, and compares it to the original Rough Estimate to check for major discrepancies.

### 3. Payment Logging
- The client pays a deposit of ₦1,500,000.
- The user logs this payment.
- The system automatically updates the "Balance Due" to ₦1,450,000.

---

## Phase 4: Delivery & Completion

**Target:** Handing over the vehicle and closing the file.

### 1. Final Document Collection
The user uploads the Terminal Delivery Order (DO) and the Customs Duty Receipt.

### 2. Release
Once the balance hits zero, the system flags the vehicle as "Ready for Release."

### 3. Archive
The user marks the vehicle as "Done." The vehicle disappears from the "Active" dashboard but remains in the database to fuel future Rough Estimates.

---

## Phase 5: Reporting & Analysis

**Target:** Reviewing business health.

### 1. Monthly Review
At the end of the month, the owner filters all vehicles by "Clearing Date" for the current month.

### 2. Financial Export
The user generates a PDF report showing **Total Billed vs. Total Spent**, revealing the profit margin for the month.

### 3. Performance Check
The user compares the average clearing time at PTML vs. Five Star to decide which terminal to use for future shipments.

---

## User Pain Points Addressed

| Traditional Way (Spreadsheet) | The New System Way |
|-------------------------------|-------------------|
| "What did we pay for a 2018 ML350 last time?" | Instant Estimate based on 2018 ML350 history. |
| "Where is the Bill of Lading for this car?" | One-click preview inside the vehicle record. |
| "Did this client finish paying?" | Auto-calculated balance with Red/Green alerts. |
| "Is the car still at the port?" | Real-time status tracking (Backlog → Clearing → Done). |

---

## Key Benefits

1. **Duplicate Prevention:** VIN search ensures no vehicle is entered twice
2. **Predictive Costing:** Historical data powers instant rough estimates
3. **Document Centralization:** All files stored in one accessible location
4. **Automated Calculations:** Payment tracking with real-time balance updates
5. **Multi-vessel Management:** Bulk operations for efficiency
6. **Mobile-friendly Uploads:** Field agents can update from the port
7. **Business Intelligence:** Built-in reporting for financial and operational insights

---

*Last Updated: January 21 2026*