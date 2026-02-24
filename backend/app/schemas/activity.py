from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class Activity(BaseModel):
    id: int
    user_name: str | None
    action: str
    target_type: str | None
    target_name: str | None
    target_id: int | None  # Add this for linking
    details: str | None  # Add this for field changes
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
