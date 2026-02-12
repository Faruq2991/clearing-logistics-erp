from pydantic import BaseModel
from datetime import datetime

class Activity(BaseModel):
    id: int
    user_name: str | None
    action: str
    target_type: str | None
    target_name: str | None
    created_at: datetime

    class Config:
        orm_mode = True
