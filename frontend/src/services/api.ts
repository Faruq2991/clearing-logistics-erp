import axios from 'axios';
import type {
  VehicleCreate,
  FinancialsCreate,
  FinancialsUpdate,
  PaymentCreate,
  UserRegister,
  UserCreate, // Add this import
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
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
  register: (data: UserRegister) =>
    api.post('/auth/register', data),
};

// Vehicles
export const vehiclesApi = {
  list: (params?: { skip?: number; limit?: number; search?: string | null, status?: string | null }) =>
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
  getPreviewUrl: (documentId: number) =>
    `${API_URL}/documents/${documentId}/preview`,
  download: (documentId: number) =>
    api.get(`/documents/${documentId}/download`, { responseType: 'blob' }),
  delete: (documentId: number) => api.delete(`/documents/${documentId}`),
  getVersions: (documentId: number) => api.get(`/documents/${documentId}/versions`),
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
  getReport: (params: { start_date: string; end_date: string; vehicle_id?: number }) =>
    api.get('/financials/report', { params }),
};

// Estimate
export const estimateApi = {
  search: (make: string, model: string, year: number, terminal?: string) =>
    api.get('/estimate/global-search', { params: { make, model, year, terminal } }),
  calculateCostOfRunning: (data: {
    vehicle_cost: number;
    shipping_fees: number;
    customs_duty: number;
    terminal: string;
  }) => api.post('/estimate/cost-of-running', data),
};

// Users (admin only)
export const usersApi = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  create: async (data: UserCreate) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<UserCreate>) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
