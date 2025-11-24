from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RegisterSchema(BaseModel):
    username: str
    email: EmailStr
    # password: str
    full_name: str
    role: str = "user"

class LoginSchema(BaseModel):
    email: EmailStr
    password: str
    
class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True