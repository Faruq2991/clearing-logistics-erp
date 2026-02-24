from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
import json
from app.models.main import AuditLog, Vehicle
from app.models.user import User
from app.schemas.activity import Activity

def format_action_description(log: AuditLog) -> tuple[str, str | None]:
    """
    Format a more descriptive action message and extract details.
    Returns: (action_description, details)
    """
    action = log.action
    table = log.table_name
    changes_dict = {}
    if action == "UPDATE" and log.old_value and log.new_value:
        try:
            old_data = json.loads(log.old_value)
            new_data = json.loads(log.new_value)
            
            if isinstance(old_data, dict) and isinstance(new_data, dict):
                for key in new_data:
                    if key in old_data and old_data[key] != new_data[key]:
                        changes_dict[key] = {'old': old_data.get(key), 'new': new_data.get(key)}
                    elif key not in old_data:
                        changes_dict[key] = {'old': None, 'new': new_data.get(key)}
        except (json.JSONDecodeError, TypeError):
            pass
            
    elif (action == "CREATE" or action == "UPDATE") and log.new_value:
        try:
            changes_dict = json.loads(log.new_value) if isinstance(log.new_value, str) else log.new_value
        except (json.JSONDecodeError, TypeError):
            pass
    
    # Build detailed action descriptions
    if action == "UPDATE" and table == "vehicles":
        if changes_dict:
            updated_fields = list(changes_dict.keys())
            if len(updated_fields) == 1:
                field = updated_fields[0]
                if field == "status":
                    return f"updated status to '{changes_dict[field]['new']}'", None
                elif field == "terminal":
                    return f"changed terminal to {changes_dict[field]['new']}", None
                else:
                    return f"updated {field}", None
            else:
                fields_str = ", ".join(updated_fields[:3])
                if len(updated_fields) > 3:
                    fields_str += f" and {len(updated_fields) - 3} more"
                return f"updated {fields_str}", None
        return "updated vehicle", None
    
    elif action == "CREATE" and table == "vehicles":
        return "created vehicle", None
    
    elif action == "DELETE" and table == "vehicles":
        return "deleted vehicle", None
    
    elif action == "UPDATE" and table == "financials":
        if changes_dict and "amount_paid" in changes_dict:
            return "recorded payment", f"₦{changes_dict['amount_paid']['new']:,.2f}"
        return "updated financials", None
    
    elif action == "CREATE" and table == "financials":
        return "added financial record", None
    
    elif action == "CREATE" and table == "documents":
        return "uploaded document", None
    
    elif action == "DELETE" and table == "documents":
        return "deleted document", None
    
    # Default fallback
    return f"{action.lower()} {table}", None


def get_target_display_name(db: Session, log: AuditLog) -> tuple[str | None, int | None]:
    """
    Get a user-friendly display name for the target entity.
    Returns: (display_name, entity_id)
    """
    if log.table_name == "vehicles" and log.record_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == log.record_id).first()
        if vehicle:
            return f"VIN: {vehicle.vin}", vehicle.id
        return f"Vehicle ID: {log.record_id}", log.record_id
    
    elif log.table_name == "financials":
        return "Financial Record", None
    
    elif log.table_name == "documents":
        return "Document", None
    
    return None, None


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
        action_desc, details = format_action_description(log)
        target_name, target_id = get_target_display_name(db, log)
        
        activities.append(
            Activity(
                id=log.id,
                user_name=user_email if user_email else "System",
                action=action_desc,
                target_type=log.table_name,
                target_name=target_name,
                target_id=target_id,
                details=details,
                created_at=log.created_at,
            )
        )
    return activities
