"""
Financial management endpoints.
Vehicle-scoped: get, create, update, payments (mounted under /api/vehicles/{vehicle_id}/financials)
Financials-level: list all (mounted at /api/financials)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole # Keep UserRole for access check in service helper
from app.schemas.financials import (
    FinancialsCreate,
    FinancialsUpdate,
    FinancialsWithBalanceResponse,
    PaymentCreate,
    PaymentResponse,
)
from app.core.security import get_current_user, check_admin_privilege

# Import the new service
from app.services import financial_service

# Main router for /api/financials (list all)
router = APIRouter()

# Sub-router for vehicle-scoped operations - include in vehicles router
vehicle_financials_router = APIRouter()


# --- Vehicle-scoped endpoints ---

@vehicle_financials_router.get("/", response_model=FinancialsWithBalanceResponse)
def get_vehicle_financials(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_privilege),
):
    """Get financial summary for a vehicle (includes balance)."""
    return financial_service.get_financial_summary_for_vehicle(db, vehicle_id, current_user)


@vehicle_financials_router.post("/", response_model=FinancialsWithBalanceResponse)
def create_vehicle_financials(
    vehicle_id: int,
    data: FinancialsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_privilege),
):
    """Create financials for a vehicle. One record per vehicle; returns 400 if already exists."""
    # The _get_vehicle_with_access check is implicitly handled inside the service function
    # by raising HTTPException if not authorized.
    financial_service._get_vehicle_with_access(db, vehicle_id, current_user) # Ensure user has access to vehicle
    return financial_service.create_financial_record_for_vehicle(db, vehicle_id, data, current_user.id)


@vehicle_financials_router.patch("/", response_model=FinancialsWithBalanceResponse)
def update_vehicle_financials(
    vehicle_id: int,
    data: FinancialsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_privilege),
):
    """Update financials (total_cost, exchange_rate)."""
    financial_service._get_vehicle_with_access(db, vehicle_id, current_user) # Ensure user has access to vehicle
    return financial_service.update_financial_record_for_vehicle(db, vehicle_id, data, current_user.id)


@vehicle_financials_router.post("/payments", response_model=PaymentResponse)
def create_payment(
    vehicle_id: int,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_privilege),
):
    """Record a payment (installment). Allows overpayment (negative balance for refunds/credits)."""
    financial_service._get_vehicle_with_access(db, vehicle_id, current_user) # Ensure user has access to vehicle
    return financial_service.record_payment_for_vehicle(db, vehicle_id, data, current_user.id)


@vehicle_financials_router.get("/payments", response_model=List[PaymentResponse])
def list_vehicle_payments(
    vehicle_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_privilege),
):
    """List payments for a vehicle."""
    return financial_service.list_payments_for_vehicle(db, vehicle_id, current_user, skip, limit)


# --- Financials-level endpoints (admin/staff list) ---

@router.get("/", response_model=List[FinancialsWithBalanceResponse])
def list_financials(
    skip: int = 0,
    limit: int = 100,
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_privilege), # Endpoint handles role check
):
    """List all financials. Admin only. Optional filter by vehicle_id."""
    return financial_service.list_all_financial_records(db, current_user, skip, limit, vehicle_id)
