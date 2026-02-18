from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.main import AuditLog
from app.models.user import User
from app.schemas.activity import Activity

from app.models.user import User

def get_recent_activities(db: Session, current_user: User, limit: int = 5) -> List[Activity]:
    recent_logs_with_users = (
        db.query(AuditLog, User.email)
        .outerjoin(User, AuditLog.user_id == User.id)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )

    activities = []
    for log, user_email in recent_logs_with_users:
        activities.append(
            Activity(
                id=log.id,
                user_name=user_email if user_email else "System",
                action=log.action,
                target_type=log.table_name,
                target_name=f"ID: {log.record_id}" if log.record_id else None,
                created_at=log.created_at,
            )
        )
    return activities
