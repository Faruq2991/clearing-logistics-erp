from sqlalchemy.orm import Session
from app.models import user as user_models
from app.schemas import user as user_schemas
from app.core import auth_utils
from fastapi import HTTPException, status

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(user_models.User).filter(user_models.User.email == email).first()
    if not user or not auth_utils.verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token_for_user(user: user_models.User) -> str:
    return auth_utils.create_access_token(data={"sub": user.email})

def register_new_user(db: Session, user_data: user_schemas.UserCreate):
    db_user = db.query(user_models.User).filter(user_models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth_utils.get_password_hash(user_data.password)
    new_user = user_models.User(email=user_data.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
