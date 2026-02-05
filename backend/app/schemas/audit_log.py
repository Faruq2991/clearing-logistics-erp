from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    table_name: str
    record_id: Optional[int]
    old_value: Optional[str]
    new_value: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
