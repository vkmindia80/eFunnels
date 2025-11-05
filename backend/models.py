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


# ==================== FORMS & SURVEYS MODELS ====================

class FormFieldBase(BaseModel):
    label: str
    field_type: str  # text, email, phone, number, textarea, select, radio, checkbox, file, date, rating, agreement
    placeholder: Optional[str] = None
    required: bool = False
    options: Optional[List[str]] = []  # For select, radio, checkbox
    validation: Optional[dict] = {}  # min, max, pattern, etc.
    conditional_logic: Optional[dict] = None  # Show/hide based on other fields
    order: int = 0

class FormFieldCreate(FormFieldBase):
    pass

class FormField(FormFieldBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class FormBase(BaseModel):
    name: str
    description: Optional[str] = None
    form_type: str = "standard"  # standard, survey, quiz
    
class FormCreate(FormBase):
    fields: List[FormFieldCreate] = []
    settings: Optional[dict] = {}  # Theme, notifications, thank you message, etc.
    
class FormUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    fields: Optional[List[dict]] = None
    settings: Optional[dict] = None
    
class Form(FormBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: str = "draft"  # draft, active, paused, archived
    fields: List[dict] = []
    settings: dict = {}  # notifications, thank_you_message, redirect_url, etc.
    is_multi_step: bool = False
    pages: Optional[List[dict]] = []  # For multi-step forms
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    
    # Analytics
    total_views: int = 0
    total_submissions: int = 0
    conversion_rate: float = 0.0

class FormSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_id: str
    user_id: str  # Form owner
    contact_id: Optional[str] = None
    submission_data: dict
    visitor_ip: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FormSubmissionCreate(BaseModel):
    form_id: str
    submission_data: dict
    visitor_ip: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

class FormTemplateBase(BaseModel):
    name: str
    description: str
    category: str  # contact, feedback, registration, order, survey
    thumbnail: Optional[str] = None
    fields: List[dict]
    
class FormTemplate(FormTemplateBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_public: bool = True
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FormViewTrack(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_id: str
    user_id: str
    visitor_ip: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PublicFormSubmissionRequest(BaseModel):
    submission_data: dict
    visitor_ip: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

# ==================== SURVEY MODELS ====================

class SurveyQuestionBase(BaseModel):
    question_text: str
    question_type: str  # multiple_choice, single_choice, rating, text, scale
    options: Optional[List[str]] = []
    required: bool = True
    order: int = 0
    
class SurveyQuestionCreate(SurveyQuestionBase):
    pass

class SurveyQuestion(SurveyQuestionBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class SurveyBase(BaseModel):
    name: str
    description: Optional[str] = None
    
class SurveyCreate(SurveyBase):
    questions: List[SurveyQuestionCreate] = []
    settings: Optional[dict] = {}
    
class SurveyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    questions: Optional[List[dict]] = None
    settings: Optional[dict] = None
    
class Survey(SurveyBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: str = "draft"  # draft, active, paused, closed
    questions: List[dict] = []
    settings: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    
    # Analytics
    total_responses: int = 0
    completion_rate: float = 0.0

class SurveyResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    survey_id: str
    user_id: str  # Survey owner
    contact_id: Optional[str] = None
    responses: dict  # question_id: answer
    visitor_ip: Optional[str] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class PublicSurveyResponseRequest(BaseModel):
    responses: dict
    visitor_ip: Optional[str] = None
    completed: bool = True


# ==================== WORKFLOW AUTOMATION MODELS ====================

class WorkflowNodeData(BaseModel):
    """Data stored in each workflow node"""
    label: Optional[str] = None
    # Trigger-specific data
    trigger_type: Optional[str] = None  # email_opened, email_clicked, form_submitted, tag_added, contact_created
    trigger_config: Optional[dict] = {}  # Additional trigger configuration
    # Action-specific data
    action_type: Optional[str] = None  # send_email, add_tag, remove_tag, update_contact, wait, conditional
    action_config: Optional[dict] = {}  # Additional action configuration
    # Condition-specific data
    condition_field: Optional[str] = None  # Field to check for conditions
    condition_operator: Optional[str] = None  # equals, not_equals, contains, greater_than, less_than
    condition_value: Optional[str] = None  # Value to compare against

class WorkflowNode(BaseModel):
    """Visual node in workflow builder"""
    id: str
    type: str  # trigger, action, condition, end
    position: dict  # {x: int, y: int}
    data: WorkflowNodeData

class WorkflowEdge(BaseModel):
    """Connection between workflow nodes"""
    id: str
    source: str  # Source node ID
    target: str  # Target node ID
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    label: Optional[str] = None  # For condition branches (yes/no)

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = False
    trigger_type: str  # Main trigger type for the workflow

class WorkflowCreate(WorkflowBase):
    nodes: List[WorkflowNode] = []
    edges: List[WorkflowEdge] = []

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    nodes: Optional[List[WorkflowNode]] = None
    edges: Optional[List[WorkflowEdge]] = None
    trigger_type: Optional[str] = None

class Workflow(WorkflowBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    nodes: List[WorkflowNode] = []
    edges: List[WorkflowEdge] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_triggered: Optional[datetime] = None
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0

class WorkflowExecution(BaseModel):
    """Track individual workflow execution"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workflow_id: str
    user_id: str
    contact_id: str  # Contact that triggered the workflow
    status: str = "running"  # running, completed, failed
    current_node: Optional[str] = None  # Current node being executed
    execution_log: List[dict] = []  # Log of actions taken
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

class WorkflowTemplate(BaseModel):
    """Pre-built workflow templates"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str  # welcome, nurture, re_engagement, abandoned_cart
    thumbnail: Optional[str] = None
    trigger_type: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkflowAnalytics(BaseModel):
    """Workflow performance analytics"""
    workflow_id: str
    total_executions: int
    successful_executions: int
    failed_executions: int
    success_rate: float
    contacts_processed: int
    emails_sent: int
    tags_added: int
    last_execution: Optional[datetime] = None


# ==================== COURSE & MEMBERSHIP MODELS ====================

class CourseLessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str  # video, text, pdf, quiz
    content: dict  # Flexible content storage (video URL, text content, quiz data, etc.)
    duration: Optional[int] = None  # Duration in minutes
    order: int = 0
    is_preview: bool = False  # Allow preview without enrollment
    
class CourseLessonCreate(CourseLessonBase):
    pass

class CourseLesson(CourseLessonBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    module_id: str
    course_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CourseLessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    content: Optional[dict] = None
    duration: Optional[int] = None
    order: Optional[int] = None
    is_preview: Optional[bool] = None

class CourseModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0
    
class CourseModuleCreate(CourseModuleBase):
    lessons: Optional[List[CourseLessonCreate]] = []

class CourseModule(CourseModuleBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    course_id: str
    user_id: str
    lessons: List[dict] = []  # Summary of lessons
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CourseModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class CourseBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = "general"  # tech, business, design, marketing, etc.
    level: str = "beginner"  # beginner, intermediate, advanced
    language: str = "en"
    thumbnail: Optional[str] = None
    
class CourseCreate(CourseBase):
    pricing_type: str = "free"  # free, paid, membership
    price: Optional[float] = 0.0
    currency: str = "USD"
    membership_tier_ids: Optional[List[str]] = []  # Required membership tiers
    drip_enabled: bool = False
    drip_interval_days: Optional[int] = 7  # Days between module releases

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    language: Optional[str] = None
    thumbnail: Optional[str] = None
    status: Optional[str] = None
    pricing_type: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    membership_tier_ids: Optional[List[str]] = None
    drip_enabled: Optional[bool] = None
    drip_interval_days: Optional[int] = None

class Course(CourseBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Course creator
    status: str = "draft"  # draft, published, archived
    pricing_type: str = "free"
    price: float = 0.0
    currency: str = "USD"
    membership_tier_ids: List[str] = []
    modules: List[dict] = []  # Summary of modules
    drip_enabled: bool = False
    drip_interval_days: int = 7
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    
    # Analytics
    total_students: int = 0
    total_completions: int = 0
    completion_rate: float = 0.0
    average_rating: float = 0.0
    total_reviews: int = 0

class CourseEnrollmentBase(BaseModel):
    course_id: str
    
class CourseEnrollmentCreate(CourseEnrollmentBase):
    contact_id: Optional[str] = None
    payment_status: str = "pending"  # pending, completed, failed
    payment_amount: Optional[float] = None

class CourseEnrollment(CourseEnrollmentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Student user ID
    contact_id: Optional[str] = None  # Link to contact if exists
    course_owner_id: str  # Course creator ID
    enrollment_date: datetime = Field(default_factory=datetime.utcnow)
    completed_date: Optional[datetime] = None
    progress_percentage: float = 0.0
    current_module_id: Optional[str] = None
    current_lesson_id: Optional[str] = None
    payment_status: str = "completed"  # pending, completed, failed
    payment_amount: float = 0.0
    certificate_issued: bool = False
    certificate_id: Optional[str] = None
    last_accessed: Optional[datetime] = None
    total_time_spent: int = 0  # Minutes

class CourseProgressBase(BaseModel):
    lesson_id: str
    
class CourseProgressCreate(BaseModel):
    time_spent: Optional[int] = 0  # Minutes
    quiz_score: Optional[float] = None
    quiz_passed: Optional[bool] = None

class CourseProgress(CourseProgressBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    enrollment_id: str
    user_id: str
    course_id: str
    module_id: str
    completed: bool = False
    completed_at: Optional[datetime] = None
    time_spent: int = 0  # Minutes
    quiz_score: Optional[float] = None
    quiz_passed: Optional[bool] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CertificateBase(BaseModel):
    course_id: str
    enrollment_id: str
    
class Certificate(CertificateBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Student
    course_owner_id: str
    course_title: str
    student_name: str
    completion_date: datetime = Field(default_factory=datetime.utcnow)
    certificate_number: str  # Unique certificate number
    issued_at: datetime = Field(default_factory=datetime.utcnow)

class MembershipTierBase(BaseModel):
    name: str
    description: str
    price: float
    currency: str = "USD"
    billing_period: str = "monthly"  # monthly, yearly, lifetime
    
class MembershipTierCreate(MembershipTierBase):
    features: List[str] = []
    course_ids: List[str] = []  # Courses included in this tier
    
class MembershipTierUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    billing_period: Optional[str] = None
    features: Optional[List[str]] = None
    course_ids: Optional[List[str]] = None
    status: Optional[str] = None

class MembershipTier(MembershipTierBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Tier creator/owner
    status: str = "active"  # active, inactive
    features: List[str] = []
    course_ids: List[str] = []
    total_subscribers: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MembershipSubscriptionBase(BaseModel):
    tier_id: str
    
class MembershipSubscriptionCreate(MembershipSubscriptionBase):
    payment_status: str = "pending"
    
class MembershipSubscription(MembershipSubscriptionBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Subscriber
    tier_owner_id: str
    status: str = "active"  # active, cancelled, expired, paused
    payment_status: str = "completed"
    subscribed_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    last_payment_date: Optional[datetime] = None
    next_payment_date: Optional[datetime] = None

class PublicEnrollmentRequest(BaseModel):
    student_name: str
    student_email: EmailStr
    payment_method: str = "mock"  # mock, stripe, paypal
    payment_token: Optional[str] = None



# ==================== BLOG & WEBSITE BUILDER MODELS (PHASE 8) ====================

# Blog Post Models
class BlogPostBase(BaseModel):
    title: str
    slug: Optional[str] = None  # URL-friendly version of title
    content: str  # HTML content (rich text)
    excerpt: Optional[str] = None  # Short description
    featured_image: Optional[str] = None
    category_id: Optional[str] = None
    tags: List[str] = []
    
class BlogPostCreate(BlogPostBase):
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    status: str = "draft"  # draft, published, scheduled
    scheduled_at: Optional[datetime] = None
    enable_comments: bool = True
    
class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    enable_comments: Optional[bool] = None
    
class BlogPost(BlogPostBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Post author
    status: str = "draft"  # draft, published, scheduled, archived
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    enable_comments: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Analytics
    total_views: int = 0
    total_comments: int = 0
    average_reading_time: int = 0  # Minutes


# Blog Category Models
class BlogCategoryBase(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"
    
class BlogCategoryCreate(BlogCategoryBase):
    parent_id: Optional[str] = None  # For hierarchical categories
    
class BlogCategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[str] = None
    
class BlogCategory(BlogCategoryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    parent_id: Optional[str] = None
    post_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Blog Tag Models (similar to contact tags but for blog)
class BlogTagBase(BaseModel):
    name: str
    slug: Optional[str] = None
    color: Optional[str] = "#3B82F6"
    
class BlogTagCreate(BlogTagBase):
    pass
    
class BlogTag(BlogTagBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    post_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Blog Comment Models
class BlogCommentBase(BaseModel):
    post_id: str
    content: str
    author_name: str
    author_email: EmailStr
    
class BlogCommentCreate(BlogCommentBase):
    parent_id: Optional[str] = None  # For replies
    
class BlogComment(BlogCommentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Blog owner
    parent_id: Optional[str] = None
    status: str = "pending"  # pending, approved, spam, trash
    author_ip: Optional[str] = None
    author_user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None


# Website Page Models
class WebsitePageBase(BaseModel):
    title: str
    slug: Optional[str] = None
    content: dict  # JSON structure for page builder blocks (reuse funnel blocks)
    
class WebsitePageCreate(WebsitePageBase):
    parent_id: Optional[str] = None  # For page hierarchy
    template_id: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    
class WebsitePageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[dict] = None
    parent_id: Optional[str] = None
    status: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    order: Optional[int] = None
    
class WebsitePage(WebsitePageBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    parent_id: Optional[str] = None
    status: str = "draft"  # draft, published, archived
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    
    # Analytics
    total_views: int = 0


# Website Theme Models
class WebsiteThemeBase(BaseModel):
    name: str
    primary_color: str = "#3B82F6"
    secondary_color: str = "#10B981"
    accent_color: str = "#F59E0B"
    
class WebsiteThemeCreate(WebsiteThemeBase):
    background_color: str = "#FFFFFF"
    text_color: str = "#111827"
    heading_font: str = "Inter"
    body_font: str = "Inter"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    custom_css: Optional[str] = None
    
class WebsiteThemeUpdate(BaseModel):
    name: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    heading_font: Optional[str] = None
    body_font: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    custom_css: Optional[str] = None
    
class WebsiteTheme(WebsiteThemeBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    background_color: str = "#FFFFFF"
    text_color: str = "#111827"
    heading_font: str = "Inter"
    body_font: str = "Inter"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    custom_css: Optional[str] = None
    is_active: bool = False  # Only one theme active at a time
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Navigation Menu Models
class NavigationMenuItemBase(BaseModel):
    label: str
    url: Optional[str] = None
    page_id: Optional[str] = None  # Link to website page
    post_id: Optional[str] = None  # Link to blog post
    link_type: str = "custom"  # custom, page, post, category
    
class NavigationMenuItemCreate(NavigationMenuItemBase):
    parent_id: Optional[str] = None  # For nested menus
    order: int = 0
    open_in_new_tab: bool = False
    css_classes: Optional[str] = None
    
class NavigationMenuItem(NavigationMenuItemBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parent_id: Optional[str] = None
    order: int = 0
    open_in_new_tab: bool = False
    css_classes: Optional[str] = None


class NavigationMenuBase(BaseModel):
    name: str
    location: str = "header"  # header, footer, sidebar
    
class NavigationMenuCreate(NavigationMenuBase):
    items: List[NavigationMenuItemCreate] = []
    
class NavigationMenuUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    items: Optional[List[dict]] = None
    
class NavigationMenu(NavigationMenuBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[dict] = []  # Menu items with hierarchy
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Blog Analytics Models
class BlogPostView(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    user_id: str  # Post author
    visitor_ip: Optional[str] = None
    visitor_country: Optional[str] = None
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    reading_time: Optional[int] = None  # Seconds spent on page
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WebsitePageView(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    page_id: str
    user_id: str
    visitor_ip: Optional[str] = None
    visitor_country: Optional[str] = None
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Public API Request Models
class PublicBlogCommentRequest(BaseModel):
    content: str
    author_name: str
    author_email: EmailStr
    parent_id: Optional[str] = None
    
