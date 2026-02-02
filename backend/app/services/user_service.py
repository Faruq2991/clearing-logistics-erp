from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.core import auth_utils # Needed for password hashing

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    users = db.query(User).offset(skip).limit(limit).all()
    return users

def get_user_by_id(db: Session, user_id: int) -> User:
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

def update_user_role(db: Session, user_id: int, role: UserRole) -> User:
    db_user = get_user_by_id(db, user_id) # Reuse to check existence
    db_user.role = role
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user_by_id(db, user_id) # Reuse to check existence
    db.delete(db_user)
    db.commit()
    return {"message": f"User with ID {user_id} successfully deleted"}

def create_user(db: Session, user_data: UserCreate) -> User:
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth_utils.get_password_hash(user_data.password)
    
    new_user = User(email=user_data.email, hashed_password=hashed_password, role=user_data.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
