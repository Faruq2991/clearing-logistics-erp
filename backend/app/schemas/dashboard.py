from pydantic import BaseModel
from typing import Dict

class DashboardStats(BaseModel):
    vehicles_in_progress: int
    total_cleared_vehicles: int
    pending_documents: int
    total_outstanding_debt: float
    vehicle_status_distribution: Dict[str, int]
    active_vessel_counts: Dict[str, int]
    vehicles_in_progress_trend: float
    total_cleared_vehicles_trend: float
    pending_documents_trend: float
    total_outstanding_debt_trend: float
