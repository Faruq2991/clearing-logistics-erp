"""
Audit logging utility for financial and vehicle changes.
"""
import json
from typing import Any, Optional
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.main import AuditLog


def log_action(
    db: Session,
    user_id: Optional[int],
    action: str,
    table_name: str,
    record_id: Optional[int] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
) -> None:
    """Record an audit log entry. Serializes dict/list values to JSON strings."""
    def _serialize(v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, (dict, list)):
            return json.dumps(v, default=str)
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)

    entry = AuditLog(
        user_id=user_id,
        action=action,
        table_name=table_name,
        record_id=record_id,
        old_value=_serialize(old_value),
        new_value=_serialize(new_value),
    )
    db.add(entry)
