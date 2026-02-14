from pydantic import BaseModel, ConfigDict
from datetime import datetime

class Activity(BaseModel):
    id: int
    user_name: str | None
    action: str
    target_type: str | None
    target_name: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
