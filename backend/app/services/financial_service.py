from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any

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
from app.core.auditing import log_action

def _get_vehicle_with_access(db: Session, vehicle_id: int, current_user: User) -> Vehicle:
    """Fetch vehicle and verify current user has access."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this vehicle")
    return vehicle

def _financials_with_balance(financials: Financials) -> FinancialsWithBalanceResponse:
    """Build response with computed balance."""
    balance = financials.total_cost - financials.amount_paid
    return FinancialsWithBalanceResponse(
        **{k: getattr(financials, k) for k in FinancialsResponse.model_fields},
        balance=balance,
    )

def get_financial_summary_for_vehicle(db: Session, vehicle_id: int, current_user: User) -> FinancialsWithBalanceResponse:
    _get_vehicle_with_access(db, vehicle_id, current_user) # Ensure user has access
    financials = db.query(Financials).filter(Financials.vehicle_id == vehicle_id).first()
    if not financials:
        raise HTTPException(status_code=404, detail="Financials not found for this vehicle")
    return _financials_with_balance(financials)

def create_financial_record_for_vehicle(
    db: Session, vehicle_id: int, data: FinancialsCreate, current_user_id: int
) -> FinancialsWithBalanceResponse:
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
        db, current_user_id, "CREATE", "financials", financials.id,
        old_value=None, new_value={"total_cost": data.total_cost, "exchange_rate_at_clearing": data.exchange_rate_at_clearing},
    )

    db.commit()
    db.refresh(financials)
    return _financials_with_balance(financials)

def update_financial_record_for_vehicle(
    db: Session, vehicle_id: int, data: FinancialsUpdate, current_user_id: int
) -> FinancialsWithBalanceResponse:
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
        log_action(db, current_user_id, "UPDATE", "financials", financials.id, old_value=old_values, new_value=data.model_dump(exclude_none=True))

    db.commit()
    db.refresh(financials)
    return _financials_with_balance(financials)

def record_payment_for_vehicle(
    db: Session, vehicle_id: int, data: PaymentCreate, current_user_id: int
) -> PaymentResponse:
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
        "recorded_by_id": current_user_id,
    }
    if data.payment_date is not None:
        payment_kwargs["payment_date"] = data.payment_date
    payment = Payment(**payment_kwargs)
    db.add(payment)
    financials.amount_paid += data.amount
    db.flush()

    log_action(
        db, current_user_id, "PAYMENT", "payments", payment.id,
        old_value={"amount_paid": financials.amount_paid - data.amount},
        new_value={"amount": data.amount, "amount_paid": financials.amount_paid},
    )
    db.commit()
    db.refresh(payment)
    return payment

def list_payments_for_vehicle(
    db: Session, vehicle_id: int, current_user: User, skip: int = 0, limit: int = 100
) -> List[PaymentResponse]:
    _get_vehicle_with_access(db, vehicle_id, current_user) # Ensure user has access
    financials = db.query(Financials).filter(Financials.vehicle_id == vehicle_id).first()
    if not financials:
        raise HTTPException(status_code=404, detail="Financials not found for this vehicle")

    payments = db.query(Payment).filter(Payment.financial_id == financials.id).order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return payments

def list_all_financial_records(
    db: Session, current_user: User, skip: int = 0, limit: int = 100, vehicle_id: Optional[int] = None
) -> List[FinancialsWithBalanceResponse]:
    # Staff/Admin check is handled by endpoint, but _get_vehicle_with_access also contains it.
    # For now, we'll keep it simple and assume endpoint handles top-level auth.
    query = db.query(Financials)
    if vehicle_id is not None:
        query = query.filter(Financials.vehicle_id == vehicle_id)
    financials_list = query.offset(skip).limit(limit).all()
    return [_financials_with_balance(f) for f in financials_list]
