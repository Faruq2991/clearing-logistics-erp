# React Frontend Implementation Guide
## Clearing & Logistics ERP

This document outlines how to implement the frontend for the Clearing & Logistics ERP using React. It aligns with the backend API, PRD, CustomerJourney, and SystemDesign documents.

---

## Document Information

| Field | Value |
|-------|-------|
| **Project** | Clearing & Logistics ERP |
| **Frontend Stack** | React (Vite or Create React App) |
| **State Management** | TanStack Query (React Query) |
| **Routing** | React Router |
| **UI Library** | Material-UI, Chakra UI, or Tailwind CSS |
| **Forms** | React Hook Form + Zod |
| **Last Updated** | February 2026 |

---

## 1. Project Setup

### 1.1 Create React Project

```bash
# Using Vite (recommended)
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Or using Create React App
npx create-react-app frontend --template typescript
cd frontend
```

### 1.2 Directory Structure

```
frontend/
├── public/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Button, Input, Card, etc.
│   │   ├── layout/       # Header, Sidebar, Layout
│   │   └── features/     # VehicleCard, DocumentList, EstimatorForm
│   ├── pages/            # Route-level components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── VehiclesPage.tsx
│   │   ├── VehicleDetailPage.tsx
│   │   └── EstimatePage.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useVehicles.ts
│   │   └── useFinancials.ts
│   ├── services/         # API clients
│   │   └── api.ts
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Helpers
│   └── App.tsx
├── .env.local
├── package.json
└── tsconfig.json
```

### 1.3 Dependencies

```bash
npm install react-router-dom @tanstack/react-query axios
npm install react-hook-form @hookform/resolvers zod
npm install @mui/material @emotion/react @emotion/styled
# Or: npm install @chakra-ui/react @emotion/react framer-motion
# Or: npm install tailwindcss postcss autoprefixer
```

### 1.4 Environment Variables

Create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8000/api
# For CRA: REACT_APP_API_URL=http://localhost:8000/api
```

---

## 2. API Service Layer

### 2.1 API Client (`src/services/api.ts`)

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 - redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
};

// Vehicles
export const vehiclesApi = {
  list: (params?: { skip?: number; limit?: number }) =>
    api.get('/vehicles/', { params }),
  get: (id: number) => api.get(`/vehicles/${id}`),
  create: (data: VehicleCreate) => api.post('/vehicles/', data),
  update: (id: number, data: VehicleCreate) => api.put(`/vehicles/${id}`, data),
  delete: (id: number) => api.delete(`/vehicles/${id}`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/vehicles/${id}/status`, null, { params: { status } }),
};

// Documents (vehicle-scoped)
export const documentsApi = {
  list: (vehicleId: number) => api.get(`/vehicles/${vehicleId}/documents/`),
  upload: (vehicleId: number, formData: FormData) =>
    api.post(`/vehicles/${vehicleId}/documents/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  preview: (documentId: number) =>
    `${API_URL.replace('/api', '')}/api/documents/${documentId}/preview`,
};

// Financials (vehicle-scoped)
export const financialsApi = {
  get: (vehicleId: number) => api.get(`/vehicles/${vehicleId}/financials/`),
  create: (vehicleId: number, data: FinancialsCreate) =>
    api.post(`/vehicles/${vehicleId}/financials/`, data),
  update: (vehicleId: number, data: FinancialsUpdate) =>
    api.patch(`/vehicles/${vehicleId}/financials/`, data),
  listPayments: (vehicleId: number) =>
    api.get(`/vehicles/${vehicleId}/financials/payments`),
  recordPayment: (vehicleId: number, data: PaymentCreate) =>
    api.post(`/vehicles/${vehicleId}/financials/payments`, data),
};

// Estimate
export const estimateApi = {
  search: (make: string, model: string, year: number) =>
    api.get('/estimate/global-search', { params: { make, model, year } }),
};
```

---

## 3. Authentication

### 3.1 Auth Context (`src/contexts/AuthContext.tsx`)

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('access_token')
  );
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const t = data.access_token;
    localStorage.setItem('access_token', t);
    setToken(t);
    // Decode JWT for user info or call /api/users/me if available
    setUser({ email, role: 'staff' });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

### 3.2 Protected Route

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
```

---

## 4. Core Pages & Features

### 4.1 Login Page

- Form: email, password
- On submit: call `authApi.login`, store token, redirect to dashboard
- Error handling for 401

### 4.2 Dashboard Page

- Summary cards: active vehicles count, outstanding balance, recent activity
- Quick links: Add Vehicle, Search
- List recent vehicles (optional)

### 4.3 Vehicles List Page (`/vehicles`)

- Fetch: `vehiclesApi.list({ skip, limit })`
- TanStack Query: `useQuery(['vehicles', skip, limit], () => vehiclesApi.list(...))`
- Table or cards: VIN, Make, Model, Year, Status, Actions
- Search bar (filter by VIN or consignee)
- Pagination
- "Add Vehicle" button → navigate to form or modal

### 4.4 Vehicle Detail Page (`/vehicles/:id`)

- Fetch vehicle: `vehiclesApi.get(id)`
- Tabs or sections:
  - **Details:** VIN, Make, Model, Year, Color, Ship, Terminal, Arrival, Status
  - **Documents:** list + upload (form: document_type, file)
  - **Financials:** total_cost, amount_paid, balance (Red/Green), payments list, record payment form
- Actions: Edit, Update Status, Delete (admin)

### 4.5 Add Vehicle Form (with Estimator)

- Fields: VIN, Make, Model, Year, Color, Ship Name, Terminal, Arrival Date
- As user selects Make, Model, Year → call `estimateApi.search(make, model, year)` (debounced)
- Display sidebar: "Rough Estimate: ₦X,XXX,XXX (based on N historical records)"
- Submit → `vehiclesApi.create(data)`

### 4.6 Document Upload

- Form: `document_type` (select: bol, title, customs_assessment, duty_receipt, delivery_order), `file` (input type file)
- `FormData` with `document_type` and `file`
- `documentsApi.upload(vehicleId, formData)`
- Display list of documents with preview/download links

### 4.7 Financials Section

- Display: total_cost, amount_paid, balance = total_cost - amount_paid
- Balance styling: Red if balance > 0, Green if balance = 0
- "Record Payment" form: amount, reference, notes
- Payments table: amount, date, reference, recorded by

---

## 5. TanStack Query Hooks

### 5.1 useVehicles

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../services/api';

export function useVehicles(skip = 0, limit = 100) {
  return useQuery({
    queryKey: ['vehicles', skip, limit],
    queryFn: () => vehiclesApi.list({ skip, limit }).then((r) => r.data),
  });
}

export function useVehicle(id: number | null) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}
```

### 5.2 useEstimate

```typescript
export function useEstimate(make: string, model: string, year: number) {
  return useQuery({
    queryKey: ['estimate', make, model, year],
    queryFn: () => estimateApi.search(make, model, year).then((r) => r.data),
    enabled: !!(make && model && year),
  });
}
```

---

## 6. Routing

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
            <Route path="/vehicles/:id" element={<ProtectedRoute><VehicleDetailPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## 7. Implementation Order

| Phase | Scope |
|-------|--------|
| **1** | Project setup, API client, Auth (login, protected routes) |
| **2** | Dashboard, Vehicles list, Vehicle detail (read-only) |
| **3** | Add Vehicle form, Estimator sidebar integration |
| **4** | Vehicle CRUD (create, update, delete, status) |
| **5** | Documents: list, upload, preview |
| **6** | Financials: display, create, record payment |
| **7** | Global search, filters, polish |

---

## 8. Backend API Reference (Quick)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Login (form: username, password) |
| `/api/auth/register` | POST | Register |
| `/api/vehicles/` | GET, POST | List, create vehicles |
| `/api/vehicles/{id}` | GET, PUT, DELETE | Get, update, delete vehicle |
| `/api/vehicles/{id}/status` | PATCH | Update status |
| `/api/vehicles/{id}/documents/` | GET, POST | List, upload documents |
| `/api/vehicles/{id}/financials/` | GET, POST, PATCH | Get, create, update financials |
| `/api/vehicles/{id}/financials/payments` | GET, POST | List, record payments |
| `/api/estimate/global-search` | GET | Estimate (params: make, model, year) |
| `/api/documents/{id}/preview` | GET | Preview document |
| `/api/documents/{id}/download` | GET | Download document |

---

## 9. Notes

- **CORS:** Ensure backend allows frontend origin (e.g. `http://localhost:5173` for Vite).
- **Auth:** Backend uses OAuth2PasswordBearer; token in `Authorization: Bearer <token>`.
- **Roles:** ADMIN, STAFF, GUEST; GUEST sees only their vehicles.
- **Document types:** `bol`, `title`, `customs_assessment`, `duty_receipt`, `delivery_order`.
- **Status workflow:** Backlog → In Transit → Clearing → Done.

---

*Last Updated: February 2026*
