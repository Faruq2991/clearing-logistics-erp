from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class FinancialsCreate(BaseModel):
    total_cost: float = 0.0
    exchange_rate_at_clearing: Optional[float] = None


class FinancialsUpdate(BaseModel):
    total_cost: Optional[float] = None
    exchange_rate_at_clearing: Optional[float] = None


class FinancialsResponse(BaseModel):
    id: int
    vehicle_id: int
    total_cost: float
    amount_paid: float
    exchange_rate_at_clearing: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class FinancialsWithBalanceResponse(FinancialsResponse):
    balance: float


class PaymentCreate(BaseModel):
    amount: float
    payment_date: Optional[datetime] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    financial_id: int
    amount: float
    payment_date: datetime
    reference: Optional[str] = None
    recorded_by_id: Optional[int] = None
    created_at: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FinancialsReportItem(BaseModel):
    vehicle_id: int
    vin: str
    make: str
    model: str
    year: int
    total_cost: float
    amount_paid: float
    balance: float

    model_config = ConfigDict(from_attributes=True)


class FinancialsReport(BaseModel):
    start_date: datetime
    end_date: datetime
    total_vehicles: int
    total_revenue: float
    total_expenses: float
    net_profit: float
    items: List[FinancialsReportItem]

    model_config = ConfigDict(from_attributes=True)
