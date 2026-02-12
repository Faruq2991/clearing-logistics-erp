from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.activity import Activity
from app.services import activity_service
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[Activity])
def read_recent_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
):
    """
    Retrieve recent activities (audit logs).
    """
    return activity_service.get_recent_activities(db, limit=limit)
