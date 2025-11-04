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


# ==================== EMAIL MARKETING MODELS ====================

class EmailTemplateBase(BaseModel):
    name: str
    subject: str
    content: dict  # JSON structure for email builder blocks
    thumbnail: Optional[str] = None
    category: Optional[str] = "custom"  # custom, welcome, newsletter, promotional

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplate(EmailTemplateBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    is_public: bool = False
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[dict] = None
    thumbnail: Optional[str] = None
    category: Optional[str] = None

class EmailCampaignBase(BaseModel):
    name: str
    subject: str
    content: dict  # Email builder blocks
    from_name: str
    from_email: EmailStr
    reply_to: Optional[EmailStr] = None
    
class EmailCampaignCreate(EmailCampaignBase):
    recipient_list: List[str] = []  # List of contact IDs or segment IDs
    recipient_type: str = "contacts"  # contacts, segments, all
    schedule_type: str = "immediate"  # immediate, scheduled
    scheduled_at: Optional[datetime] = None
    enable_ab_test: bool = False
    ab_test_config: Optional[dict] = None

class EmailCampaign(EmailCampaignBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: str = "draft"  # draft, scheduled, sending, sent, paused, failed
    recipient_list: List[str] = []
    recipient_type: str = "contacts"
    schedule_type: str = "immediate"
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    enable_ab_test: bool = False
    ab_test_config: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Analytics
    total_recipients: int = 0
    total_sent: int = 0
    total_delivered: int = 0
    total_opened: int = 0
    total_clicked: int = 0
    total_bounced: int = 0
    total_unsubscribed: int = 0
    total_failed: int = 0

class EmailCampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[dict] = None
    from_name: Optional[str] = None
    from_email: Optional[EmailStr] = None
    reply_to: Optional[EmailStr] = None
    status: Optional[str] = None
    recipient_list: Optional[List[str]] = None
    recipient_type: Optional[str] = None
    schedule_type: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class EmailLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    contact_id: str
    user_id: str
    recipient_email: EmailStr
    subject: str
    status: str = "pending"  # pending, sent, delivered, opened, clicked, bounced, failed
    provider: str = "mock"  # mock, sendgrid, smtp
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    bounced_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class EmailLogCreate(BaseModel):
    campaign_id: str
    contact_id: str
    recipient_email: EmailStr
    subject: str
    provider: str = "mock"

class EmailProviderSettings(BaseModel):
    provider: str = "mock"  # mock, sendgrid, smtp, aws_ses
    sendgrid_api_key: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: Optional[str] = "us-east-1"

class AIEmailRequest(BaseModel):
    prompt: str
    tone: str = "professional"  # professional, friendly, casual, formal, persuasive
    purpose: str = "general"  # general, welcome, promotional, newsletter, announcement
    length: str = "medium"  # short, medium, long
    include_cta: bool = True

class AIEmailResponse(BaseModel):
    subject: str
    content: str
    preview_text: Optional[str] = None

class TestEmailRequest(BaseModel):
    campaign_id: str
    test_emails: List[EmailStr]

class SendCampaignRequest(BaseModel):
    send_now: bool = True
    schedule_at: Optional[datetime] = None


# ==================== FUNNEL BUILDER MODELS ====================

class FunnelPageBase(BaseModel):
    name: str
    path: str  # URL path like /landing, /thank-you
    content: dict  # JSON structure for page builder blocks
    order: int = 0
    
class FunnelPageCreate(FunnelPageBase):
    pass

class FunnelPage(FunnelPageBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    funnel_id: str
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FunnelPageUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    content: Optional[dict] = None
    order: Optional[int] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None

class FunnelBase(BaseModel):
    name: str
    description: Optional[str] = None
    funnel_type: str = "custom"  # custom, lead_gen, sales, webinar, product_launch
    
class FunnelCreate(FunnelBase):
    template_id: Optional[str] = None  # If creating from template
    
class FunnelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    domain: Optional[str] = None
    subdomain: Optional[str] = None
    favicon: Optional[str] = None
    tracking_code: Optional[str] = None

class Funnel(FunnelBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: str = "draft"  # draft, active, paused, archived
    domain: Optional[str] = None
    subdomain: Optional[str] = None
    favicon: Optional[str] = None
    tracking_code: Optional[str] = None  # Google Analytics, FB Pixel, etc.
    pages: List[dict] = []  # Array of page summaries
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    
    # Analytics
    total_visits: int = 0
    total_conversions: int = 0
    conversion_rate: float = 0.0
    total_revenue: float = 0.0

class FunnelTemplateBase(BaseModel):
    name: str
    description: str
    funnel_type: str
    thumbnail: Optional[str] = None
    preview_url: Optional[str] = None
    pages: List[dict]  # Array of pre-configured pages

class FunnelTemplate(FunnelTemplateBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_public: bool = True
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FunnelVisit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    funnel_id: str
    page_id: str
    user_id: str
    visitor_ip: Optional[str] = None
    visitor_country: Optional[str] = None
    visitor_city: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FunnelConversion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    funnel_id: str
    page_id: str
    user_id: str
    contact_id: Optional[str] = None
    conversion_type: str = "form_submission"  # form_submission, purchase, signup
    conversion_value: float = 0.0
    form_data: Optional[dict] = None
    session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FunnelAnalyticsRequest(BaseModel):
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    
class TrackVisitRequest(BaseModel):
    page_id: str
    visitor_ip: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    session_id: Optional[str] = None

class FormSubmissionRequest(BaseModel):
    page_id: str
    form_data: dict
    session_id: Optional[str] = None
