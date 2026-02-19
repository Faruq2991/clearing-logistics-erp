from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.estimate import CostOfRunning, CostOfRunningCreate, GlobalSearchResult

# Import the new service
from app.services import estimate_service

router = APIRouter()


@router.get("/global-search", response_model=GlobalSearchResult)
def search_estimate(
    make: str,
    model: str,
    year: int,
    terminal: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Smart Estimator: Historical clearing cost estimate with exchange rate normalization.
    Fetches matching records (Make, Model, Year), adjusts Naira costs to current market
    using exchange_rate_at_clearing vs CUSTOMS_EXCHANGE_RATE, returns weighted average.
    """
    result = estimate_service.get_clearing_cost_estimate(db, make, model, year, terminal)
    if result is None:
        raise HTTPException(status_code=404, detail="No historical data found for this model and year.")
    return result

@router.post("/cost-of-running", response_model=CostOfRunning)
def get_cost_of_running(
    costs: CostOfRunningCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculates the cost of running a vehicle based on input costs, fixed-price components,
    and terminal surcharges.
    """
    return estimate_service.calculate_cost_of_running(costs)
