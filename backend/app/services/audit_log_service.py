from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import csv
import io

from app.models.main import AuditLog
from app.models.user import User

def get_audit_logs(
    db: Session,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[AuditLog]:
    query = db.query(AuditLog)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

def get_audit_logs_as_csv(
    db: Session,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> str:
    logs = get_audit_logs(db, user_id, action, start_date, end_date, limit=None) # Get all matching logs

    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "ID", "User ID", "Action", "Table Name", "Record ID",
        "Old Value", "New Value", "Timestamp"
    ])

    # Write rows
    for log in logs:
        writer.writerow([
            log.id,
            log.user_id,
            log.action,
            log.table_name,
            log.record_id,
            log.old_value,
            log.new_value,
            log.created_at.isoformat()
        ])

    return output.getvalue()
