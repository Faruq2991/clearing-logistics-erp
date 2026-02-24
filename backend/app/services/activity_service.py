from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.models.main import AuditLog, Vehicle
from app.models.user import User
from app.schemas.activity import Activity
import json

def _generate_descriptive_action(log: AuditLog) -> str:
    """Generates a more descriptive action string from an audit log."""
    try:
        old_value = json.loads(log.old_value) if log.old_value else {}
        new_value = json.loads(log.new_value) if log.new_value else {}
    except (json.JSONDecodeError, TypeError):
        old_value, new_value = {}, {}

    if log.action == "update":
        if isinstance(old_value, dict) and isinstance(new_value, dict):
            changed_fields = {k: new_value[k] for k in new_value if k in old_value and new_value[k] != old_value[k]}
            if changed_fields:
                field_str = ", ".join(changed_fields.keys())
                return f"updated {field_str}"
    return log.action


def get_recent_activities(db: Session, current_user: User, limit: int = 5) -> List[Activity]:

    user_vehicle_ids_query = db.query(Vehicle.id).filter(Vehicle.owner_id == current_user.id)

    recent_logs_with_users = (
        db.query(AuditLog, User.email)
        .outerjoin(User, AuditLog.user_id == User.id)
        .filter(
            or_(
                AuditLog.user_id == current_user.id,
                (AuditLog.table_name == 'vehicles') & (AuditLog.record_id.in_(user_vehicle_ids_query))
            )
        )
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )

    activities = []
    for log, user_email in recent_logs_with_users:
        target_name = f"ID: {log.record_id}"
        if log.table_name == 'vehicles' and log.record_id:
            vehicle = db.query(Vehicle).filter(Vehicle.id == log.record_id).first()
            if vehicle:
                target_name = vehicle.vin

        activities.append(
            Activity(
                id=log.id,
                user_name=user_email if user_email else "System",
                action=_generate_descriptive_action(log),
                target_type=log.table_name,
                target_name=target_name,
                target_id=log.record_id,
                old_value=log.old_value,
                new_value=log.new_value,
                created_at=log.created_at,
            )
        )
    return activities
