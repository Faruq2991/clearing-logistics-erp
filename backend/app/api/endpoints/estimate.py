from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.main import Vehicle, Financials
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/global-search")
def search_estimate(make: str, model: str, year: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # PRINCIPLE: Search the entire DB for matches to provide a "Veteran Estimate"
    historical_data = db.query(Financials).join(Vehicle).filter(
        Vehicle.make == make,
        Vehicle.model == model,
        Vehicle.year == year
    ).all()

    if not historical_data:
        return {"estimate": "No historical data found for this year/model"}

    # Logic: Calculate average of historical costs
    avg_cost = sum([f.total_cost for f in historical_data]) / len(historical_data)
    
    return {
        "make": make,
        "model": model,
        "year": year,
        "average_clearing_cost": avg_cost,
        "sample_size": len(historical_data)
    }
