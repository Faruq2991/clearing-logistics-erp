from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from decouple import config

from app.database import get_db
from app.models.main import Vehicle, Financials
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/global-search")
def search_estimate(
    make: str,
    model: str,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Smart Estimator: Historical clearing cost estimate with exchange rate normalization.
    Fetches matching records (Make, Model, Year), adjusts Naira costs to current market
    using exchange_rate_at_clearing vs CUSTOMS_EXCHANGE_RATE, returns weighted average.
    """
    historical_data = (
        db.query(Financials)
        .join(Vehicle)
        .filter(
            Vehicle.make == make,
            Vehicle.model == model,
            Vehicle.year == year,
        )
        .all()
    )

    if not historical_data:
        return {"estimate": "No historical data found for this year/model"}

    try:
        current_rate = config("CUSTOMS_EXCHANGE_RATE", default=None)
        current_rate = float(current_rate) if current_rate else None
    except (ValueError, TypeError):
        current_rate = None
    adjusted_costs = []

    for f in historical_data:
        if f.exchange_rate_at_clearing and current_rate and f.exchange_rate_at_clearing > 0:
            # Normalize: (OldPrice / OldRate) * CurrentRate
            adjusted = (f.total_cost / f.exchange_rate_at_clearing) * current_rate
            adjusted_costs.append(adjusted)
        else:
            # Fallback: use raw total_cost when no exchange rate available
            adjusted_costs.append(f.total_cost)

    avg_cost = sum(adjusted_costs) / len(adjusted_costs)

    return {
        "make": make,
        "model": model,
        "year": year,
        "average_clearing_cost": avg_cost,
        "sample_size": len(historical_data),
        "current_exchange_rate": current_rate,
        "exchange_rate_normalized": current_rate is not None,
    }
