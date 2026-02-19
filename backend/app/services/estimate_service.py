from sqlalchemy.orm import Session
from decouple import config
from app.models.main import Vehicle, Financials
from typing import Dict, Any, List, Optional

def get_clearing_cost_estimate(db: Session, make: str, model: str, year: int, terminal: Optional[str] = None) -> Optional[Dict[str, Any]]:
    
    def calculate_average(query_result):
        if not query_result:
            return None, 0

        try:
            current_rate = float(config("CUSTOMS_EXCHANGE_RATE", default=1.0))
        except (ValueError, TypeError):
            current_rate = 1.0

        adjusted_costs = []
        for f in query_result:
            if f.exchange_rate_at_clearing and f.exchange_rate_at_clearing > 0:
                adjusted = (f.total_cost / f.exchange_rate_at_clearing) * current_rate
                adjusted_costs.append(adjusted)
            else:
                adjusted_costs.append(f.total_cost)
        
        avg_cost = sum(adjusted_costs) / len(adjusted_costs)
        return avg_cost, len(adjusted_costs)

    search_hierarchy = []
    base_query = db.query(Financials).join(Vehicle)

    if terminal:
        search_hierarchy.extend([
            ("exact_with_terminal", base_query.filter(Vehicle.make == make, Vehicle.model == model, Vehicle.year == year, Vehicle.terminal == terminal)),
            ("make_model_with_terminal", base_query.filter(Vehicle.make == make, Vehicle.model == model, Vehicle.terminal == terminal)),
            ("make_year_with_terminal", base_query.filter(Vehicle.make == make, Vehicle.year == year, Vehicle.terminal == terminal)),
            ("make_with_terminal", base_query.filter(Vehicle.make == make, Vehicle.terminal == terminal)),
        ])

    search_hierarchy.extend([
        ("exact", base_query.filter(Vehicle.make == make, Vehicle.model == model, Vehicle.year == year)),
        ("make_and_model", base_query.filter(Vehicle.make == make, Vehicle.model == model)),
        ("make_and_year", base_query.filter(Vehicle.make == make, Vehicle.year == year)),
        ("make_only", base_query.filter(Vehicle.make == make)),
        ("year_only", base_query.filter(Vehicle.year == year)),
    ])

    for match_type, query in search_hierarchy:
        result = query.all()
        if result:
            avg_cost, sample_size = calculate_average(result)
            if avg_cost is not None:
                return {
                    "average_clearing_cost": avg_cost,
                    "sample_size": sample_size,
                    "is_normalized": True, # Simplified for now
                    "match_type": match_type,
                }

    return None


def calculate_cost_of_running(costs: dict) -> Dict[str, float]:
    """
    Calculates the total cost of running a vehicle based on input costs
    and fixed-price components.
    """
    # Fixed costs
    cpc = 50000
    valuation = 100000
    approval_846 = 60000
    comet = 65000

    # Sum of user-provided costs
    total_cost = costs.vehicle_cost + costs.shipping_fees + costs.customs_duty

    # Add fixed costs
    total_cost += cpc + valuation + approval_846 + comet

    # Add terminal-specific surcharge
    if costs.terminal.lower() == "ptml":
        total_cost += 200000

    return {"total_estimate": total_cost}
