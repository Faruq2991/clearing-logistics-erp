from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse
from app.core.security import check_admin_privilege
from app.services import audit_log_service

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse], dependencies=[Depends(check_admin_privilege)])
def get_audit_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get audit logs, with optional filtering.
    - **user_id**: Filter by user ID.
    - **action**: Filter by action type (e.g., 'CREATE', 'UPDATE', 'DELETE', 'PAYMENT').
    - **start_date**: Filter logs created on or after this date.
    - **end_date**: Filter logs created on or before this date.
    """
    logs = audit_log_service.get_audit_logs(db, user_id, action, start_date, end_date, skip, limit)
    return logs

@router.get("/export", dependencies=[Depends(check_admin_privilege)])
def export_audit_logs_as_csv(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """
    Export audit logs as a CSV file, with optional filtering.
    """
    csv_data = audit_log_service.get_audit_logs_as_csv(db, user_id, action, start_date, end_date)
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=audit_logs.csv"})
