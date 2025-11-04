from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import uuid

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    token: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    auth_provider: str = "local"  # local or google
    avatar: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    subscription_plan: str = "free"

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "full_name": "John Doe",
                "role": "user"
            }
        }

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    avatar: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None