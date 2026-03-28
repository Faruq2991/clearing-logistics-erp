from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserCreate
from app.core.auth_utils import get_current_user, is_admin_or_staff
# Import the new service
from app.services import user_service

router = APIRouter()

@router.get("/", response_model=List[UserResponse], dependencies=[Depends(get_current_user), Depends(is_admin_or_staff)])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = user_service.get_all_users(db, skip, limit)
    return users

@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(get_current_user), Depends(is_admin_or_staff)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = user_service.get_user_by_id(db, user_id)
    return db_user

@router.put("/{user_id}/role", response_model=UserResponse, dependencies=[Depends(get_current_user), Depends(is_admin_or_staff)])
def update_user_role(user_id: int, role: UserRole, db: Session = Depends(get_db)):
    updated_user = user_service.update_user_role(db, user_id, role)
    return updated_user



@router.post("/", response_model=UserResponse, dependencies=[Depends(get_current_user), Depends(is_admin_or_staff)])
def create_user_with_role(user_data: UserCreate, db: Session = Depends(get_db)):
    new_user = user_service.create_user(db, user_data)
    return new_user
