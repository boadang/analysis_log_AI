from pydantic import BaseModel, EmailStr

class RegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: str = "user"

class LoginSchema(BaseModel):
    email: EmailStr
    password: str