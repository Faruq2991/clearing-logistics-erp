from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserCreate
from app.core.security import check_admin_privilege
from app.core import auth_utils

router = APIRouter()

@router.get("/", response_model=List[UserResponse], dependencies=[Depends(check_admin_privilege)])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(check_admin_privilege)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}/role", response_model=UserResponse, dependencies=[Depends(check_admin_privilege)])
def update_user_role(user_id: int, role: UserRole, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.role = role
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", dependencies=[Depends(check_admin_privilege)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(db_user)
    db.commit()
    return {"message": f"User with ID {user_id} successfully deleted"}

@router.post("/", response_model=UserResponse, dependencies=[Depends(check_admin_privilege)])
def create_user_with_role(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth_utils.get_password_hash(user_data.password)
    
    new_user = User(email=user_data.email, hashed_password=hashed_password, role=user_data.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
