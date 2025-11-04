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

# ==================== CONTACT MODELS ====================

class ContactBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    source: Optional[str] = None  # How they were acquired
    notes: Optional[str] = None

class ContactCreate(ContactBase):
    custom_fields: Optional[dict] = {}
    tags: Optional[List[str]] = []

class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    score: Optional[int] = None
    custom_fields: Optional[dict] = None
    tags: Optional[List[str]] = None

class Contact(ContactBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Owner of the contact
    status: str = "lead"  # lead, qualified, customer, lost
    score: int = 0  # Contact scoring 0-100
    custom_fields: dict = {}
    tags: List[str] = []
    segments: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_contacted: Optional[datetime] = None
    engagement_count: int = 0  # Number of interactions

class ContactActivity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: str
    user_id: str
    activity_type: str  # note, email, call, meeting, status_change
    title: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContactActivityCreate(BaseModel):
    activity_type: str
    title: str
    description: Optional[str] = None

# ==================== TAG MODELS ====================

class TagBase(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"  # Default blue

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    contact_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== SEGMENT MODELS ====================

class SegmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_dynamic: bool = False  # Static or dynamic segment
    
class SegmentCreate(SegmentBase):
    criteria: Optional[dict] = {}  # For dynamic segments

class Segment(SegmentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    criteria: Optional[dict] = {}
    contact_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== BULK OPERATIONS ====================

class BulkDeleteRequest(BaseModel):
    contact_ids: List[str]

class BulkTagRequest(BaseModel):
    contact_ids: List[str]
    tag_names: List[str]

class BulkSegmentRequest(BaseModel):
    contact_ids: List[str]
    segment_id: str