# Frontend UI/UX Technical Specification

This document provides a technical breakdown of the UI/UX design for the Clearing Logistics ERP frontend. It is aligned with the current codebase and serves as a guide for frontend development.

## 1. Overall Layout Architecture

- **Layout Type:** Centered container layout with a fixed max-width dashboard set against a tinted background.
- **Modularity:** A card-based modular system is used to organize content.
- **Grid System:** A 12-column responsive grid is assumed for layout management.
- **Page Structure (Top → Bottom):**
  - Top Navigation Bar
  - Greeting + Controls Row
  - KPI Cards Row
  - Main Analytics Grid
  - Recent Activity Table (Full Width)

## 2. Container & Background

- **Outer Background:** A soft, desaturated blue-green (#4F8F95 to #5A9DA3) frames the main dashboard.
- **Main Dashboard Container:**
  - Centered with rounded corners (~20–24px radius).
  - Background: Light gray/white (#F8FAFB).
  - Internal Padding: ~32px.

## 3. Top Navigation Bar

- **Structure:** A horizontal flex layout containing: `[Logo] [Nav Links] [Icons] [Profile Dropdown]`.
- **Navigation Links:**
  - Dashboard (Active)
  - Vehicles
  - Financials
  - Reports
- **Styling:**
  - **Active Tab:** Pill-style background with a teal fill and white text.
  - **Inactive Tabs:** Medium gray text with no background.
- **Spacing:** 24px between navigation items, 32px padding on the left and right.

## 4. Greeting + Control Row

- **Layout:** Two-column split:
  - **Left:** "Hi, [Name]" and a "Good Morning" greeting.
  - **Right:** Controls such as a Date Dropdown, Export CSV button, and a primary "Add New Vehicle" CTA.
- **Typography:**
  - **Greeting:** 14px, medium gray.
  - **Main Message:** 24–28px, bold, dark gray.
- **Controls:**
  - **Date Dropdown:** Light gray background, rounded corners.
  - **Export CSV:** Text button with a left-aligned icon.
  - **Primary CTA ("Add New Vehicle"):** Filled teal button with a pill shape and slight elevation.

## 5. KPI Cards Row

- **Layout:** A row of three equal-width cards with 24px spacing between them.
- **Card Properties:**
  - White background with a 16px border-radius.
  - Soft shadow: `0 4px 12px rgba(0,0,0,0.05)`.
  - Internal padding: 20–24px.
- **Content:** Each card includes a title, a primary metric, and a subtext with a comparison, often featuring a `TrendIndicator` component.
- **Example Cards:**
  - Total Vehicles
  - Vehicles In-Clearance
  - Cleared Vehicles

## 6. Main Analytics Grid

- **Grid Structure:** A two-column grid with a 24px gap. The left column is wider (approx. 60-65%) than the right.
- **Components:**
  - **Vehicle Statistics (`BarChartComponent`):** A large card displaying a grouped bar chart. It includes a header with a title and a year selector dropdown.
  - **Financial Overview (`PieChartComponent`):** A card with a pie chart visualizing financial data, such as cost distribution.

*Note: The original design mentioned a Gauge Chart, a Map preview, and a Timeline component. These are not yet implemented and are considered for future development.*

## 7. Recent Activity Table

- **Component:** `RecentActivity.tsx`
- **Layout:** A full-width card with horizontal filter tabs (e.g., All, In-Progress, Cleared).
- **Table Style:**
  - Light gray row separators with no heavy borders.
  - Row height of 48–56px.
  - Status labels are styled with color-coded text (e.g., green for "Cleared").
- **Pagination:** A pagination control is present on the right.

## 8. Component Inventory

### Core Components:
- **`layout/Layout.tsx`:** The main application layout, including the top navigation bar and sidebar.
- **`components/charts/BarChartComponent.tsx`:** For displaying bar charts.
- **`components/charts/PieChartComponent.tsx`:** For displaying pie charts.
- **`components/RecentActivity.tsx`:** The table for displaying recent activities.
- **`components/TrendIndicator.tsx`:** A small pill-style indicator for showing trends (e.g., up or down).
- **`components/form/Form.tsx`, `InputField.tsx`, `SelectField.tsx`:** Components for building forms.
- **`components/reports/FinancialReport.tsx`:** A component for displaying financial reports.
- **`pages/DashboardPage.tsx`:** The main dashboard page that integrates many of these components.

### Planned for Future Development:
- Gauge Chart Component
- Map Preview Component
- Timeline Component
- Status Badge Component

## 9. Responsive Behavior

- **Desktop:** Two-column analytics layout.
- **Tablet:** KPI cards stack (2+1), and the analytics section becomes a single column.
- **Mobile:** A single-column layout, with the navigation collapsing into a hamburger menu. The activity table may become horizontally scrollable.

## 10. Visual Design Characteristics

- **Aesthetic:** A soft, modern UI with airy spacing, low-contrast shadows, and a rounded, friendly look.
- **Style:** Clean typography hierarchy and minimal use of borders, consistent with modern SaaS dashboard design.
