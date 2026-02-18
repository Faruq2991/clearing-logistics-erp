from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.main import Vehicle, Document, Financials
from datetime import datetime, timedelta

from app.models.user import User

def _calculate_trend(current_value, previous_value):
    if previous_value == 0:
        return 100.0 if current_value > 0 else 0.0
    return ((current_value - previous_value) / previous_value) * 100

def get_dashboard_stats(db: Session, current_user: User):
    # Base queries for the current user
    user_vehicles = db.query(Vehicle).filter(Vehicle.owner_id == current_user.id)
    user_financials = db.query(Financials).join(Vehicle).filter(Vehicle.owner_id == current_user.id)

    # --- Current Stats ---
    vehicles_in_progress = user_vehicles.filter(Vehicle.status.in_(['In Transit', 'Clearing'])).count()
    total_cleared_vehicles = user_vehicles.filter(Vehicle.status == 'Done').count()
    
    vehicles_with_documents_ids = [v.id for v in user_vehicles.join(Document).distinct().all()]
    pending_documents = user_vehicles.filter(Vehicle.id.notin_(vehicles_with_documents_ids)).count()

    total_billed = user_financials.with_entities(func.sum(Financials.total_cost)).scalar() or 0.0
    total_paid = user_financials.with_entities(func.sum(Financials.amount_paid)).scalar() or 0.0
    total_outstanding_debt = total_billed - total_paid

    status_distribution_query = user_vehicles.with_entities(Vehicle.status, func.count(Vehicle.id)).group_by(Vehicle.status).all()
    vehicle_status_distribution = {status: count for status, count in status_distribution_query}

    active_vessel_counts_query = user_vehicles.with_entities(Vehicle.ship_name, func.count(Vehicle.id)).filter(
        Vehicle.status.notin_(['Done'])
    ).group_by(Vehicle.ship_name).all()
    active_vessel_counts = {ship_name: count for ship_name, count in active_vessel_counts_query}
    
    # --- Trend Calculation ---
    end_date = datetime.utcnow()
    current_start_date = end_date - timedelta(days=30)
    previous_start_date = current_start_date - timedelta(days=30)

    # Previous period stats
    prev_vehicles_in_progress = user_vehicles.filter(
        Vehicle.status.in_(['In Transit', 'Clearing']),
        Vehicle.arrival_date.between(previous_start_date, current_start_date)
    ).count()
    prev_total_cleared_vehicles = user_vehicles.filter(
        Vehicle.status == 'Done',
        Vehicle.arrival_date.between(previous_start_date, current_start_date)
    ).count()

    prev_vehicles_with_docs_ids = [v.id for v in user_vehicles.join(Document).filter(
        Document.created_at.between(previous_start_date, current_start_date)
    ).distinct().all()]
    prev_pending_documents = user_vehicles.filter(
        Vehicle.id.notin_(prev_vehicles_with_docs_ids),
        Vehicle.arrival_date.between(previous_start_date, current_start_date)
    ).count()

    prev_total_billed = user_financials.filter(
        Financials.created_at.between(previous_start_date, current_start_date)
    ).with_entities(func.sum(Financials.total_cost)).scalar() or 0.0
    prev_total_paid = user_financials.filter(
        Financials.created_at.between(previous_start_date, current_start_date)
    ).with_entities(func.sum(Financials.amount_paid)).scalar() or 0.0
    prev_total_outstanding_debt = prev_total_billed - prev_total_paid
    
    # Current period stats for trends
    curr_vehicles_in_progress = user_vehicles.filter(
        Vehicle.status.in_(['In Transit', 'Clearing']),
        Vehicle.arrival_date >= current_start_date
    ).count()
    curr_total_cleared_vehicles = user_vehicles.filter(
        Vehicle.status == 'Done',
        Vehicle.arrival_date >= current_start_date
    ).count()
    
    curr_vehicles_with_docs_ids = [v.id for v in user_vehicles.join(Document).filter(
        Document.created_at >= current_start_date
    ).distinct().all()]
    curr_pending_documents = user_vehicles.filter(
        Vehicle.id.notin_(curr_vehicles_with_docs_ids),
        Vehicle.arrival_date >= current_start_date
    ).count()
    
    curr_total_billed = user_financials.filter(
        Financials.created_at >= current_start_date
    ).with_entities(func.sum(Financials.total_cost)).scalar() or 0.0
    curr_total_paid = user_financials.filter(
        Financials.created_at >= current_start_date
    ).with_entities(func.sum(Financials.amount_paid)).scalar() or 0.0
    curr_total_outstanding_debt = curr_total_billed - curr_total_paid

    return {
        "vehicles_in_progress": vehicles_in_progress,
        "total_cleared_vehicles": total_cleared_vehicles,
        "pending_documents": pending_documents,
        "total_outstanding_debt": total_outstanding_debt,
        "vehicle_status_distribution": vehicle_status_distribution,
        "active_vessel_counts": active_vessel_counts,
        "vehicles_in_progress_trend": _calculate_trend(curr_vehicles_in_progress, prev_vehicles_in_progress),
        "total_cleared_vehicles_trend": _calculate_trend(curr_total_cleared_vehicles, prev_total_cleared_vehicles),
        "pending_documents_trend": _calculate_trend(curr_pending_documents, prev_pending_documents),
        "total_outstanding_debt_trend": _calculate_trend(curr_total_outstanding_debt, prev_total_outstanding_debt),
    }
