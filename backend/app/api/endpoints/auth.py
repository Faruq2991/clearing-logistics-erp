from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import user as user_schemas
from app.models import user as user_models
from app.core import auth_utils

router = APIRouter()

@router.post("/login")
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # 1. Fetch user by email
    user = db.query(user_models.User).filter(user_models.User.email == form_data.username).first()
    
    # 2. Verify existence and password
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Create Token
    access_token = auth_utils.create_access_token(
        data={"sub": user.email}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=user_schemas.UserResponse)
def register(user: user_schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(user_models.User).filter(user_models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = auth_utils.get_password_hash(user.password)
    
    # Create the new user
    new_user = user_models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user