from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.main import AuditLog, User
from app.schemas.activity import Activity

def get_recent_activities(db: Session, limit: int = 20) -> List[Activity]:
    recent_logs = (
        db.query(AuditLog)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )

    activities = []
    for log in recent_logs:
        activities.append(
            Activity(
                id=log.id,
                user_name=log.user.email if log.user else "System",
                action=log.action,
                target_type=log.table_name,
                target_name=f"ID: {log.record_id}" if log.record_id else None, # Basic target name
                created_at=log.created_at,
            )
        )
    return activities
