from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True
