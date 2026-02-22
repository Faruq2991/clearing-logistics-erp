from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.ADMIN

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: Optional[str] = None
    role: UserRole

    class Config:
        from_attributes = True
