"""
Financial management endpoints.
Vehicle-scoped: get, create, update, payments (mounted under /api/vehicles/{vehicle_id}/financials)
Financials-level: list all (mounted at /api/financials)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.main import Vehicle, Financials, Payment
from app.models.user import User, UserRole
from app.schemas.financials import (
    FinancialsCreate,
    FinancialsUpdate,
    FinancialsResponse,
    FinancialsWithBalanceResponse,
    PaymentCreate,
    PaymentResponse,
)
from app.core.security import get_current_user, check_staff_privilege
from app.core.auditing import log_action

# Main router for /api/financials (list all)
router = APIRouter()

# Sub-router for vehicle-scoped operations - include in vehicles router
vehicle_financials_router = APIRouter()


def _get_vehicle_with_access(
    vehicle_id: int,
    db: Session,
    current_user: User,
) -> Vehicle:
    """Fetch vehicle and verify current user has access."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this vehicle")
    return vehicle


def _financials_with_balance(financials: Financials) -> dict:
    """Build response with computed balance."""
    balance = financials.total_cost - financials.amount_paid
    return FinancialsWithBalanceResponse(
        **{k: getattr(financials, k) for k in FinancialsResponse.model_fields},
        balance=balance,
    )


# --- Vehicle-scoped endpoints ---

@vehicle_financials_router.get("/", response_model=FinancialsWithBalanceResponse)
def get_vehicle_financials(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get financial summary for a vehicle (includes balance)."""
    vehicle = _get_vehicle_with_access(vehicle_id, db, current_user)
    financials = db.query(Financials).filter(Financials.vehicle_id == vehicle_id).first()
    if not financials:
        raise HTTPException(status_code=404, detail="Financials not found for this vehicle")
    return _financials_with_balance(financials)


@vehicle_financials_router.post("/", response_model=FinancialsWithBalanceResponse)
def create_vehicle_financials(
    vehicle_id: int,
    data: FinancialsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_staff_privilege),
):
    """Create financials for a vehicle. One record per vehicle; returns 400 if already exists."""
    vehicle = _get_vehicle_with_access(vehicle_id, db, current_user)
    existing = db.query(Financials).filter(Financials.vehicle_id == vehicle_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Financials already exist for this vehicle")

    financials = Financials(
        vehicle_id=vehicle_id,
        total_cost=data.total_cost,
        exchange_rate_at_clearing=data.exchange_rate_at_clearing,
    )
    db.add(financials)
    db.flush()

    log_action(
        db, current_user.id, "CREATE", "financials", financials.id,
        old_value=None, new_value={"total_cost": data.total_cost, "exchange_rate_at_clearing": data.exchange_rate_at_clearing},
    )

    db.commit()
    db.refresh(financials)
    return _financials_with_balance(financials)


@vehicle_financials_router.patch("/", response_model=FinancialsWithBalanceResponse)
def update_vehicle_financials(
    vehicle_id: int,
    data: FinancialsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_staff_privilege),
):
    """Update financials (total_cost, exchange_rate)."""
    vehicle = _get_vehicle_with_access(vehicle_id, db, current_user)
    financials = db.query(Financials).filter(Financials.vehicle_id == vehicle_id).first()
    if not financials:
        raise HTTPException(status_code=404, detail="Financials not found for this vehicle")

    old_values = {}
    if data.total_cost is not None:
        old_values["total_cost"] = financials.total_cost
        financials.total_cost = data.total_cost
    if data.exchange_rate_at_clearing is not None:
        old_values["exchange_rate_at_clearing"] = financials.exchange_rate_at_clearing
        financials.exchange_rate_at_clearing = data.exchange_rate_at_clearing

    if old_values:
        log_action(db, current_user.id, "UPDATE", "financials", financials.id, old_value=old_values, new_value=data.model_dump(exclude_none=True))

    db.commit()
    db.refresh(financials)
    return _financials_with_balance(financials)


@vehicle_financials_router.post("/payments", response_model=PaymentResponse)
def create_payment(
    vehicle_id: int,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_staff_privilege),
):
    """Record a payment (installment). Allows overpayment (negative balance for refunds/credits)."""
    vehicle = _get_vehicle_with_access(vehicle_id, db, current_user)
    financials = db.query(Financials).filter(Financials.vehicle_id == vehicle_id).first()
    if not financials:
        raise HTTPException(status_code=404, detail="Financials not found for this vehicle")

    if data.amount == 0:
        raise HTTPException(status_code=400, detail="Payment amount must not be zero")

    payment_kwargs = {
        "financial_id": financials.id,
        "amount": data.amount,
        "reference": data.reference,
        "notes": data.notes,
        "recorded_by_id": current_user.id,
    }
    if data.payment_date is not None:
        payment_kwargs["payment_date"] = data.payment_date
    payment = Payment(**payment_kwargs)
    db.add(payment)
    financials.amount_paid += data.amount
    db.flush()

    log_action(
        db, current_user.id, "PAYMENT", "payments", payment.id,
        old_value={"amount_paid": financials.amount_paid - data.amount},
        new_value={"amount": data.amount, "amount_paid": financials.amount_paid},
    )
    db.commit()
    db.refresh(payment)
    return payment


@vehicle_financials_router.get("/payments", response_model=List[PaymentResponse])
def list_vehicle_payments(
    vehicle_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List payments for a vehicle."""
    vehicle = _get_vehicle_with_access(vehicle_id, db, current_user)
    financials = db.query(Financials).filter(Financials.vehicle_id == vehicle_id).first()
    if not financials:
        raise HTTPException(status_code=404, detail="Financials not found for this vehicle")

    payments = db.query(Payment).filter(Payment.financial_id == financials.id).order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return payments


# --- Financials-level endpoints (admin/staff list) ---

@router.get("/", response_model=List[FinancialsWithBalanceResponse])
def list_financials(
    skip: int = 0,
    limit: int = 100,
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_staff_privilege),
):
    """List all financials. Admin/Staff only. Optional filter by vehicle_id."""
    query = db.query(Financials)
    if vehicle_id is not None:
        query = query.filter(Financials.vehicle_id == vehicle_id)
    financials_list = query.offset(skip).limit(limit).all()
    return [_financials_with_balance(f) for f in financials_list]
