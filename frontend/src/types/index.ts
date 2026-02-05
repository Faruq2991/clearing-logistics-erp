/**
 * Frontend types aligned with backend schemas.
 */

export interface UserRegister {
  email: string;
  password: string;
  role?: string; // Assuming role is optional for registration
}

export interface VehicleCreate {
  vin: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  ship_name?: string;
  terminal?: string;
  arrival_date?: string;
  status?: string;
}

export interface VehicleResponse extends VehicleCreate {
  id: number;
}

export interface FinancialsCreate {
  total_cost?: number;
  exchange_rate_at_clearing?: number;
}

export interface FinancialsUpdate {
  total_cost?: number;
  exchange_rate_at_clearing?: number;
}

export interface FinancialsWithBalance extends FinancialsResponse {
  balance: number;
}

export interface FinancialsResponse {
  id: number;
  vehicle_id: number;
  total_cost: number;
  amount_paid: number;
  exchange_rate_at_clearing?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentCreate {
  amount: number;
  payment_date?: string;
  reference?: string;
  notes?: string;
}

export interface PaymentResponse {
  id: number;
  financial_id: number;
  amount: number;
  payment_date: string;
  reference?: string;
  recorded_by_id?: number;
  created_at?: string;
  notes?: string;
}

export interface DocumentResponse {
  id: number;
  vehicle_id: number;
  document_type: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  version: number;
  uploaded_by_id?: number;
  created_at?: string;
}

export type DocumentType =
  | 'bol'
  | 'title'
  | 'customs_assessment'
  | 'duty_receipt'
  | 'delivery_order';
