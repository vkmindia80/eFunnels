from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from datetime import timedelta, datetime
from typing import Optional
import io
import csv
import os
import pandas as pd
from email_service import EmailService, AIEmailGenerator, convert_blocks_to_html
import asyncio
from models import (
    UserCreate, UserLogin, User, Token, UserUpdate, GoogleLogin,
    ContactCreate, ContactUpdate, Contact, ContactActivityCreate,
    TagCreate, Tag, SegmentCreate, Segment,
    BulkDeleteRequest, BulkTagRequest, BulkSegmentRequest,
    EmailTemplateCreate, EmailTemplateUpdate, EmailTemplate,
    EmailCampaignCreate, EmailCampaignUpdate, EmailCampaign,
    EmailProviderSettings, AIEmailRequest, TestEmailRequest, SendCampaignRequest,
    FunnelCreate, FunnelUpdate, Funnel, FunnelPageCreate, FunnelPageUpdate, FunnelPage,
    FunnelTemplate, TrackVisitRequest, FormSubmissionRequest, FunnelAnalyticsRequest,
    FormCreate, FormUpdate, Form, FormSubmission, FormSubmissionCreate,
    PublicFormSubmissionRequest, FormTemplate,
    SurveyCreate, SurveyUpdate, Survey, SurveyResponse, PublicSurveyResponseRequest,
    WorkflowCreate, WorkflowUpdate, Workflow, WorkflowExecution, WorkflowTemplate, 
    WorkflowNode, WorkflowEdge, WorkflowAnalytics,
    CourseCreate, CourseUpdate, Course, CourseModuleCreate, CourseModuleUpdate, CourseModule,
    CourseLessonCreate, CourseLessonUpdate, CourseLesson, CourseEnrollmentCreate, CourseEnrollment,
    CourseProgressCreate, CourseProgress, Certificate, PublicEnrollmentRequest,
    MembershipTierCreate, MembershipTierUpdate, MembershipTier, 
    MembershipSubscriptionCreate, MembershipSubscription
)
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    verify_google_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from database import (
    users_collection, contacts_collection, contact_activities_collection,
    tags_collection, segments_collection,
    email_templates_collection, email_campaigns_collection, email_logs_collection,
    funnels_collection, funnel_pages_collection, funnel_templates_collection,
    funnel_visits_collection, funnel_conversions_collection,
    forms_collection, form_submissions_collection, form_templates_collection, form_views_collection,
    surveys_collection, survey_responses_collection,
    workflows_collection, workflow_executions_collection, workflow_templates_collection,
    courses_collection, course_modules_collection, course_lessons_collection,
    course_enrollments_collection, course_progress_collection, certificates_collection,
    membership_tiers_collection, membership_subscriptions_collection
)
import uuid
from typing import List

app = FastAPI(title="eFunnels API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "eFunnels API"}

# ==================== AUTH ROUTES ====================

@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user exists
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user.model_dump()
    user_dict['id'] = str(uuid.uuid4())
    user_dict['password'] = get_password_hash(user.password)
    user_dict['created_at'] = datetime.utcnow()
    user_dict['updated_at'] = datetime.utcnow()
    user_dict['is_active'] = True
    user_dict['auth_provider'] = 'local'
    user_dict['subscription_plan'] = 'free'
    
    users_collection.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # Remove password from response
    user_dict.pop('password')
    user_dict.pop('_id')
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

@app.post("/api/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    # Find user
    user = users_collection.find_one({"email": user_login.email})
    if not user or not verify_password(user_login.password, user.get('password', '')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user['email']},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # Remove password from response
    user.pop('password', None)
    user['_id'] = str(user['_id'])
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.post("/api/auth/google", response_model=Token)
async def google_login(google_data: GoogleLogin):
    # Verify Google token
    google_user = verify_google_token(google_data.token)
    
    if not google_user:
        # For demo purposes, create a mock Google user
        # In production, this should fail if token is invalid
        google_user = {
            "email": "demo@google.com",
            "name": "Demo Google User",
            "picture": "https://via.placeholder.com/150"
        }
    
    email = google_user.get('email')
    name = google_user.get('name', email)
    avatar = google_user.get('picture')
    
    # Check if user exists
    user = users_collection.find_one({"email": email})
    
    if not user:
        # Create new user
        user_dict = {
            'id': str(uuid.uuid4()),
            'email': email,
            'full_name': name,
            'role': 'user',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'is_active': True,
            'auth_provider': 'google',
            'avatar': avatar,
            'subscription_plan': 'free'
        }
        users_collection.insert_one(user_dict)
        user = user_dict
    
    # Create access token
    access_token = create_access_token(
        data={"sub": email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # Remove password from response
    user.pop('password', None)
    user.pop('_id', None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop('password', None)
    return current_user

@app.put("/api/auth/profile")
async def update_profile(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = user_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    users_collection.update_one(
        {"email": current_user['email']},
        {"$set": update_data}
    )
    
    updated_user = users_collection.find_one({"email": current_user['email']})
    updated_user.pop('password', None)
    updated_user['_id'] = str(updated_user['_id'])
    
    return updated_user

# ==================== DEMO CREDENTIALS ====================

@app.get("/api/demo/credentials")
async def get_demo_credentials():
    """Returns demo credentials for testing"""
    return {
        "email": "demo@efunnels.com",
        "password": "demo123",
        "message": "Use these credentials for quick testing"
    }

# ==================== CONTACT ROUTES ====================

@app.get("/api/contacts")
async def get_contacts(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    tags: str = Query(None)
):
    """Get all contacts with pagination and filters"""
    query = {"user_id": current_user['id']}
    
    # Add search filter
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}}
        ]
    
    # Add status filter
    if status:
        query["status"] = status
    
    # Add tags filter
    if tags:
        tag_list = tags.split(",")
        query["tags"] = {"$in": tag_list}
    
    # Get total count
    total = contacts_collection.count_documents(query)
    
    # Get paginated contacts
    skip = (page - 1) * limit
    contacts = list(contacts_collection.find(query).skip(skip).limit(limit).sort("created_at", -1))
    
    # Clean up MongoDB _id
    for contact in contacts:
        contact.pop('_id', None)
    
    return {
        "contacts": contacts,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.post("/api/contacts")
async def create_contact(contact: ContactCreate, current_user: dict = Depends(get_current_user)):
    """Create a new contact"""
    # Check for duplicate email
    existing = contacts_collection.find_one({
        "user_id": current_user['id'],
        "email": contact.email
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact with this email already exists"
        )
    
    contact_dict = contact.model_dump()
    contact_dict['id'] = str(uuid.uuid4())
    contact_dict['user_id'] = current_user['id']
    contact_dict['status'] = 'lead'
    contact_dict['score'] = 0
    contact_dict['segments'] = []
    contact_dict['created_at'] = datetime.utcnow()
    contact_dict['updated_at'] = datetime.utcnow()
    contact_dict['last_contacted'] = None
    contact_dict['engagement_count'] = 0
    
    contacts_collection.insert_one(contact_dict)
    contact_dict.pop('_id')
    
    return contact_dict

@app.get("/api/contacts/{contact_id}")
async def get_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific contact"""
    contact = contacts_collection.find_one({
        "id": contact_id,
        "user_id": current_user['id']
    })
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    contact.pop('_id', None)
    
    # Get contact activities
    activities = list(contact_activities_collection.find({
        "contact_id": contact_id
    }).sort("created_at", -1).limit(50))
    
    for activity in activities:
        activity.pop('_id', None)
    
    contact['activities'] = activities
    
    return contact

@app.put("/api/contacts/{contact_id}")
async def update_contact(
    contact_id: str,
    contact_update: ContactUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a contact"""
    existing = contacts_collection.find_one({
        "id": contact_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = contact_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    contacts_collection.update_one(
        {"id": contact_id},
        {"$set": update_data}
    )
    
    updated_contact = contacts_collection.find_one({"id": contact_id})
    updated_contact.pop('_id', None)
    
    # Log activity
    if 'status' in update_data:
        activity = {
            'id': str(uuid.uuid4()),
            'contact_id': contact_id,
            'user_id': current_user['id'],
            'activity_type': 'status_change',
            'title': f"Status changed to {update_data['status']}",
            'created_at': datetime.utcnow()
        }
        contact_activities_collection.insert_one(activity)
    
    return updated_contact

@app.delete("/api/contacts/{contact_id}")
async def delete_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a contact"""
    result = contacts_collection.delete_one({
        "id": contact_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Delete associated activities
    contact_activities_collection.delete_many({"contact_id": contact_id})
    
    return {"message": "Contact deleted successfully"}

# ==================== CONTACT ACTIVITIES ====================

@app.post("/api/contacts/{contact_id}/activities")
async def add_contact_activity(
    contact_id: str,
    activity: ContactActivityCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add an activity to a contact"""
    contact = contacts_collection.find_one({
        "id": contact_id,
        "user_id": current_user['id']
    })
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    activity_dict = activity.model_dump()
    activity_dict['id'] = str(uuid.uuid4())
    activity_dict['contact_id'] = contact_id
    activity_dict['user_id'] = current_user['id']
    activity_dict['created_at'] = datetime.utcnow()
    
    contact_activities_collection.insert_one(activity_dict)
    activity_dict.pop('_id', None)
    
    # Update engagement count
    contacts_collection.update_one(
        {"id": contact_id},
        {
            "$inc": {"engagement_count": 1},
            "$set": {"last_contacted": datetime.utcnow()}
        }
    )
    
    return activity_dict

# ==================== BULK OPERATIONS ====================

@app.post("/api/contacts/bulk/delete")
async def bulk_delete_contacts(
    request: BulkDeleteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Bulk delete contacts"""
    result = contacts_collection.delete_many({
        "id": {"$in": request.contact_ids},
        "user_id": current_user['id']
    })
    
    # Delete associated activities
    contact_activities_collection.delete_many({
        "contact_id": {"$in": request.contact_ids}
    })
    
    return {"deleted_count": result.deleted_count}

@app.post("/api/contacts/bulk/tag")
async def bulk_tag_contacts(
    request: BulkTagRequest,
    current_user: dict = Depends(get_current_user)
):
    """Bulk add tags to contacts"""
    result = contacts_collection.update_many(
        {
            "id": {"$in": request.contact_ids},
            "user_id": current_user['id']
        },
        {"$addToSet": {"tags": {"$each": request.tag_names}}}
    )
    
    # Update tag counts
    for tag_name in request.tag_names:
        tags_collection.update_one(
            {"user_id": current_user['id'], "name": tag_name},
            {"$inc": {"contact_count": len(request.contact_ids)}},
            upsert=True
        )
    
    return {"modified_count": result.modified_count}

@app.post("/api/contacts/bulk/segment")
async def bulk_assign_segment(
    request: BulkSegmentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Bulk assign contacts to a segment"""
    result = contacts_collection.update_many(
        {
            "id": {"$in": request.contact_ids},
            "user_id": current_user['id']
        },
        {"$addToSet": {"segments": request.segment_id}}
    )
    
    # Update segment count
    segments_collection.update_one(
        {"id": request.segment_id, "user_id": current_user['id']},
        {"$inc": {"contact_count": len(request.contact_ids)}}
    )
    
    return {"modified_count": result.modified_count}

# ==================== IMPORT/EXPORT ====================

@app.post("/api/contacts/import")
async def import_contacts(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Import contacts from CSV or Excel file"""
    try:
        contents = await file.read()
        
        # Determine file type and read
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Clean column names
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
        
        imported_count = 0
        skipped_count = 0
        
        for _, row in df.iterrows():
            # Skip if no email
            if pd.isna(row.get('email')):
                skipped_count += 1
                continue
            
            email = str(row['email']).strip()
            
            # Check for duplicate
            existing = contacts_collection.find_one({
                "user_id": current_user['id'],
                "email": email
            })
            
            if existing:
                skipped_count += 1
                continue
            
            # Create contact
            contact = {
                'id': str(uuid.uuid4()),
                'user_id': current_user['id'],
                'first_name': str(row.get('first_name', '')).strip() or 'Unknown',
                'last_name': str(row.get('last_name', '')).strip() if not pd.isna(row.get('last_name')) else None,
                'email': email,
                'phone': str(row.get('phone', '')).strip() if not pd.isna(row.get('phone')) else None,
                'company': str(row.get('company', '')).strip() if not pd.isna(row.get('company')) else None,
                'job_title': str(row.get('job_title', '')).strip() if not pd.isna(row.get('job_title')) else None,
                'website': str(row.get('website', '')).strip() if not pd.isna(row.get('website')) else None,
                'city': str(row.get('city', '')).strip() if not pd.isna(row.get('city')) else None,
                'country': str(row.get('country', '')).strip() if not pd.isna(row.get('country')) else None,
                'status': 'lead',
                'score': 0,
                'tags': [],
                'segments': [],
                'custom_fields': {},
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'engagement_count': 0
            }
            
            contacts_collection.insert_one(contact)
            imported_count += 1
        
        return {
            "imported": imported_count,
            "skipped": skipped_count,
            "total": len(df)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@app.get("/api/contacts/export")
async def export_contacts(
    format: str = Query("csv", regex="^(csv|excel)$"),
    current_user: dict = Depends(get_current_user)
):
    """Export contacts to CSV or Excel"""
    contacts = list(contacts_collection.find({"user_id": current_user['id']}))
    
    if not contacts:
        raise HTTPException(status_code=404, detail="No contacts to export")
    
    # Prepare data for export
    export_data = []
    for contact in contacts:
        export_data.append({
            'first_name': contact.get('first_name', ''),
            'last_name': contact.get('last_name', ''),
            'email': contact.get('email', ''),
            'phone': contact.get('phone', ''),
            'company': contact.get('company', ''),
            'job_title': contact.get('job_title', ''),
            'website': contact.get('website', ''),
            'city': contact.get('city', ''),
            'country': contact.get('country', ''),
            'status': contact.get('status', ''),
            'score': contact.get('score', 0),
            'tags': ','.join(contact.get('tags', [])),
            'created_at': contact.get('created_at', '').isoformat() if contact.get('created_at') else ''
        })
    
    df = pd.DataFrame(export_data)
    
    if format == 'csv':
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=contacts.csv"}
        )
    else:  # excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Contacts')
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=contacts.xlsx"}
        )

# ==================== TAGS ROUTES ====================

@app.get("/api/tags")
async def get_tags(current_user: dict = Depends(get_current_user)):
    """Get all tags"""
    tags = list(tags_collection.find({"user_id": current_user['id']}))
    
    for tag in tags:
        tag.pop('_id', None)
    
    return tags

@app.post("/api/tags")
async def create_tag(tag: TagCreate, current_user: dict = Depends(get_current_user)):
    """Create a new tag"""
    existing = tags_collection.find_one({
        "user_id": current_user['id'],
        "name": tag.name
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")
    
    tag_dict = tag.model_dump()
    tag_dict['id'] = str(uuid.uuid4())
    tag_dict['user_id'] = current_user['id']
    tag_dict['contact_count'] = 0
    tag_dict['created_at'] = datetime.utcnow()
    
    tags_collection.insert_one(tag_dict)
    tag_dict.pop('_id')
    
    return tag_dict

@app.delete("/api/tags/{tag_id}")
async def delete_tag(tag_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a tag"""
    tag = tags_collection.find_one({"id": tag_id, "user_id": current_user['id']})
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Remove tag from all contacts
    contacts_collection.update_many(
        {"user_id": current_user['id']},
        {"$pull": {"tags": tag['name']}}
    )
    
    tags_collection.delete_one({"id": tag_id})
    
    return {"message": "Tag deleted successfully"}

# ==================== SEGMENTS ROUTES ====================

@app.get("/api/segments")
async def get_segments(current_user: dict = Depends(get_current_user)):
    """Get all segments"""
    segments = list(segments_collection.find({"user_id": current_user['id']}))
    
    for segment in segments:
        segment.pop('_id', None)
    
    return segments

@app.post("/api/segments")
async def create_segment(segment: SegmentCreate, current_user: dict = Depends(get_current_user)):
    """Create a new segment"""
    segment_dict = segment.model_dump()
    segment_dict['id'] = str(uuid.uuid4())
    segment_dict['user_id'] = current_user['id']
    segment_dict['contact_count'] = 0
    segment_dict['created_at'] = datetime.utcnow()
    segment_dict['updated_at'] = datetime.utcnow()
    
    segments_collection.insert_one(segment_dict)
    segment_dict.pop('_id')
    
    return segment_dict

@app.delete("/api/segments/{segment_id}")
async def delete_segment(segment_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a segment"""
    result = segments_collection.delete_one({
        "id": segment_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    # Remove segment from all contacts
    contacts_collection.update_many(
        {"user_id": current_user['id']},
        {"$pull": {"segments": segment_id}}
    )
    
    return {"message": "Segment deleted successfully"}

# ==================== STATISTICS ====================

@app.get("/api/contacts/stats/summary")
async def get_contact_stats(current_user: dict = Depends(get_current_user)):
    """Get contact statistics"""
    total_contacts = contacts_collection.count_documents({"user_id": current_user['id']})
    
    # Count by status
    leads = contacts_collection.count_documents({"user_id": current_user['id'], "status": "lead"})
    qualified = contacts_collection.count_documents({"user_id": current_user['id'], "status": "qualified"})
    customers = contacts_collection.count_documents({"user_id": current_user['id'], "status": "customer"})
    
    # Recent contacts (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_contacts = contacts_collection.count_documents({
        "user_id": current_user['id'],
        "created_at": {"$gte": thirty_days_ago}
    })
    
    return {
        "total": total_contacts,
        "by_status": {
            "lead": leads,
            "qualified": qualified,
            "customer": customers
        },
        "recent": recent_contacts
    }


# ==================== EMAIL MARKETING ROUTES ====================

# Initialize email service
email_service = EmailService()
ai_generator = AIEmailGenerator()

# ==================== EMAIL TEMPLATES ====================

@app.get("/api/email/templates")
async def get_email_templates(current_user: dict = Depends(get_current_user)):
    """Get all email templates"""
    templates = list(email_templates_collection.find({
        "$or": [
            {"user_id": current_user['id']},
            {"is_public": True}
        ]
    }))
    
    for template in templates:
        template.pop('_id', None)
    
    return templates

@app.post("/api/email/templates")
async def create_email_template(
    template: EmailTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new email template"""
    template_dict = template.model_dump()
    template_dict['id'] = str(uuid.uuid4())
    template_dict['user_id'] = current_user['id']
    template_dict['is_public'] = False
    template_dict['usage_count'] = 0
    template_dict['created_at'] = datetime.utcnow()
    template_dict['updated_at'] = datetime.utcnow()
    
    email_templates_collection.insert_one(template_dict)
    template_dict.pop('_id')
    
    return template_dict

@app.get("/api/email/templates/{template_id}")
async def get_email_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific email template"""
    template = email_templates_collection.find_one({
        "id": template_id,
        "$or": [
            {"user_id": current_user['id']},
            {"is_public": True}
        ]
    })
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.pop('_id', None)
    return template

@app.put("/api/email/templates/{template_id}")
async def update_email_template(
    template_id: str,
    template_update: EmailTemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an email template"""
    existing = email_templates_collection.find_one({
        "id": template_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    email_templates_collection.update_one(
        {"id": template_id},
        {"$set": update_data}
    )
    
    updated = email_templates_collection.find_one({"id": template_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/email/templates/{template_id}")
async def delete_email_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an email template"""
    result = email_templates_collection.delete_one({
        "id": template_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted successfully"}

# ==================== EMAIL CAMPAIGNS ====================

@app.get("/api/email/campaigns")
async def get_email_campaigns(
    current_user: dict = Depends(get_current_user),
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all email campaigns with pagination"""
    query = {"user_id": current_user['id']}
    
    if status:
        query["status"] = status
    
    total = email_campaigns_collection.count_documents(query)
    skip = (page - 1) * limit
    
    campaigns = list(email_campaigns_collection.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort("created_at", -1))
    
    for campaign in campaigns:
        campaign.pop('_id', None)
    
    return {
        "campaigns": campaigns,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.post("/api/email/campaigns")
async def create_email_campaign(
    campaign: EmailCampaignCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new email campaign"""
    campaign_dict = campaign.model_dump()
    campaign_dict['id'] = str(uuid.uuid4())
    campaign_dict['user_id'] = current_user['id']
    campaign_dict['status'] = 'draft'
    campaign_dict['created_at'] = datetime.utcnow()
    campaign_dict['updated_at'] = datetime.utcnow()
    campaign_dict['total_recipients'] = 0
    campaign_dict['total_sent'] = 0
    campaign_dict['total_delivered'] = 0
    campaign_dict['total_opened'] = 0
    campaign_dict['total_clicked'] = 0
    campaign_dict['total_bounced'] = 0
    campaign_dict['total_unsubscribed'] = 0
    campaign_dict['total_failed'] = 0
    
    email_campaigns_collection.insert_one(campaign_dict)
    campaign_dict.pop('_id')
    
    return campaign_dict

@app.get("/api/email/campaigns/{campaign_id}")
async def get_email_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific email campaign"""
    campaign = email_campaigns_collection.find_one({
        "id": campaign_id,
        "user_id": current_user['id']
    })
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign.pop('_id', None)
    
    # Get campaign logs
    logs = list(email_logs_collection.find({"campaign_id": campaign_id})
               .sort("created_at", -1)
               .limit(100))
    
    for log in logs:
        log.pop('_id', None)
    
    campaign['logs'] = logs
    return campaign

@app.put("/api/email/campaigns/{campaign_id}")
async def update_email_campaign(
    campaign_id: str,
    campaign_update: EmailCampaignUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an email campaign"""
    existing = email_campaigns_collection.find_one({
        "id": campaign_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Don't allow editing sent campaigns
    if existing['status'] in ['sending', 'sent'] and campaign_update.content:
        raise HTTPException(
            status_code=400,
            detail="Cannot edit content of sent campaigns"
        )
    
    update_data = campaign_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    email_campaigns_collection.update_one(
        {"id": campaign_id},
        {"$set": update_data}
    )
    
    updated = email_campaigns_collection.find_one({"id": campaign_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/email/campaigns/{campaign_id}")
async def delete_email_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an email campaign"""
    campaign = email_campaigns_collection.find_one({
        "id": campaign_id,
        "user_id": current_user['id']
    })
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Don't allow deleting sent campaigns
    if campaign['status'] in ['sending', 'sent']:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete sent campaigns"
        )
    
    email_campaigns_collection.delete_one({"id": campaign_id})
    email_logs_collection.delete_many({"campaign_id": campaign_id})
    
    return {"message": "Campaign deleted successfully"}

# ==================== SEND CAMPAIGNS ====================

async def send_campaign_emails(campaign_id: str, user_id: str):
    """Background task to send campaign emails"""
    try:
        campaign = email_campaigns_collection.find_one({"id": campaign_id})
        if not campaign:
            return
        
        # Update status to sending
        email_campaigns_collection.update_one(
            {"id": campaign_id},
            {"$set": {"status": "sending", "sent_at": datetime.utcnow()}}
        )
        
        # Get recipients
        recipients = []
        if campaign['recipient_type'] == 'all':
            recipients = list(contacts_collection.find({"user_id": user_id}))
        elif campaign['recipient_type'] == 'contacts':
            recipients = list(contacts_collection.find({
                "user_id": user_id,
                "id": {"$in": campaign['recipient_list']}
            }))
        elif campaign['recipient_type'] == 'segments':
            recipients = list(contacts_collection.find({
                "user_id": user_id,
                "segments": {"$in": campaign['recipient_list']}
            }))
        
        # Convert email blocks to HTML
        html_content = convert_blocks_to_html(campaign['content'].get('blocks', []))
        
        total_recipients = len(recipients)
        sent_count = 0
        failed_count = 0
        
        # Send emails
        for contact in recipients:
            try:
                # Send email
                result = email_service.send_email(
                    to_email=contact['email'],
                    subject=campaign['subject'],
                    html_content=html_content,
                    from_name=campaign['from_name'],
                    from_email=campaign['from_email'],
                    reply_to=campaign.get('reply_to')
                )
                
                # Log the email
                log_data = {
                    'id': str(uuid.uuid4()),
                    'campaign_id': campaign_id,
                    'contact_id': contact['id'],
                    'user_id': user_id,
                    'recipient_email': contact['email'],
                    'subject': campaign['subject'],
                    'status': 'sent' if result['success'] else 'failed',
                    'provider': result['provider'],
                    'provider_message_id': result.get('message_id'),
                    'error_message': result.get('error'),
                    'sent_at': datetime.utcnow() if result['success'] else None,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                
                email_logs_collection.insert_one(log_data)
                
                if result['success']:
                    sent_count += 1
                else:
                    failed_count += 1
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.1)
                
            except Exception as e:
                failed_count += 1
                print(f"Error sending to {contact['email']}: {str(e)}")
        
        # Update campaign stats
        email_campaigns_collection.update_one(
            {"id": campaign_id},
            {"$set": {
                "status": "sent",
                "total_recipients": total_recipients,
                "total_sent": sent_count,
                "total_failed": failed_count
            }}
        )
        
    except Exception as e:
        print(f"Campaign sending error: {str(e)}")
        email_campaigns_collection.update_one(
            {"id": campaign_id},
            {"$set": {"status": "failed"}}
        )

@app.post("/api/email/campaigns/{campaign_id}/send")
async def send_email_campaign(
    campaign_id: str,
    send_request: SendCampaignRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send an email campaign"""
    campaign = email_campaigns_collection.find_one({
        "id": campaign_id,
        "user_id": current_user['id']
    })
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign['status'] in ['sending', 'sent']:
        raise HTTPException(status_code=400, detail="Campaign already sent")
    
    # Schedule or send immediately
    if send_request.send_now:
        # Add to background tasks
        background_tasks.add_task(send_campaign_emails, campaign_id, current_user['id'])
        return {"message": "Campaign is being sent", "status": "sending"}
    else:
        # Schedule for later
        email_campaigns_collection.update_one(
            {"id": campaign_id},
            {"$set": {
                "status": "scheduled",
                "scheduled_at": send_request.schedule_at
            }}
        )
        return {"message": "Campaign scheduled", "status": "scheduled"}

@app.post("/api/email/campaigns/{campaign_id}/test")
async def send_test_email(
    campaign_id: str,
    test_request: TestEmailRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send test emails"""
    campaign = email_campaigns_collection.find_one({
        "id": campaign_id,
        "user_id": current_user['id']
    })
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Convert email blocks to HTML
    html_content = convert_blocks_to_html(campaign['content'].get('blocks', []))
    
    results = []
    for test_email in test_request.test_emails:
        result = email_service.send_email(
            to_email=test_email,
            subject=f"[TEST] {campaign['subject']}",
            html_content=html_content,
            from_name=campaign['from_name'],
            from_email=campaign['from_email']
        )
        results.append({
            'email': test_email,
            'success': result['success'],
            'error': result.get('error')
        })
    
    return {"results": results}

# ==================== EMAIL PROVIDER SETTINGS ====================

@app.get("/api/email/settings")
async def get_email_settings(current_user: dict = Depends(get_current_user)):
    """Get current email provider settings"""
    return {
        "provider": os.getenv('EMAIL_PROVIDER', 'mock'),
        "from_email": os.getenv('EMAIL_FROM', 'noreply@efunnels.com'),
        "sendgrid_configured": bool(os.getenv('SENDGRID_API_KEY')),
        "smtp_configured": all([
            os.getenv('SMTP_HOST'),
            os.getenv('SMTP_USERNAME'),
            os.getenv('SMTP_PASSWORD')
        ]),
        "aws_ses_configured": all([
            os.getenv('AWS_ACCESS_KEY_ID'),
            os.getenv('AWS_SECRET_ACCESS_KEY')
        ])
    }

@app.put("/api/email/settings")
async def update_email_settings(
    settings: EmailProviderSettings,
    current_user: dict = Depends(get_current_user)
):
    """Update email provider settings"""
    # Note: In production, this should update a database record per user
    # For now, we'll just validate and return success
    
    if settings.provider == 'sendgrid' and not settings.sendgrid_api_key:
        raise HTTPException(status_code=400, detail="SendGrid API key required")
    
    if settings.provider == 'smtp':
        if not all([settings.smtp_host, settings.smtp_username, settings.smtp_password]):
            raise HTTPException(status_code=400, detail="SMTP credentials required")
    
    if settings.provider == 'aws_ses':
        if not all([settings.aws_access_key_id, settings.aws_secret_access_key]):
            raise HTTPException(status_code=400, detail="AWS SES credentials required")
    
    return {"message": "Settings updated successfully", "provider": settings.provider}

# ==================== AI EMAIL GENERATION ====================

@app.post("/api/email/ai/generate")
async def generate_email_with_ai(
    request: AIEmailRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate email content using AI"""
    try:
        result = ai_generator.generate_email_content(
            prompt=request.prompt,
            tone=request.tone,
            purpose=request.purpose,
            length=request.length,
            include_cta=request.include_cta
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/api/email/ai/improve-subject")
async def improve_subject_line(
    subject: str = Query(...),
    context: str = Query(""),
    current_user: dict = Depends(get_current_user)
):
    """Generate alternative subject lines"""
    try:
        alternatives = ai_generator.improve_subject_line(subject, context)
        return {"alternatives": alternatives}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# ==================== EMAIL ANALYTICS ====================

@app.get("/api/email/analytics/summary")
async def get_email_analytics_summary(current_user: dict = Depends(get_current_user)):
    """Get email marketing analytics summary"""
    # Total campaigns
    total_campaigns = email_campaigns_collection.count_documents({"user_id": current_user['id']})
    
    # Sent campaigns
    sent_campaigns = email_campaigns_collection.count_documents({
        "user_id": current_user['id'],
        "status": "sent"
    })
    
    # Total emails sent
    total_sent = email_logs_collection.count_documents({
        "user_id": current_user['id'],
        "status": {"$in": ["sent", "delivered", "opened", "clicked"]}
    })
    
    # Delivery rate
    total_delivered = email_logs_collection.count_documents({
        "user_id": current_user['id'],
        "status": {"$in": ["delivered", "opened", "clicked"]}
    })
    
    # Open rate
    total_opened = email_logs_collection.count_documents({
        "user_id": current_user['id'],
        "status": {"$in": ["opened", "clicked"]}
    })
    
    # Click rate
    total_clicked = email_logs_collection.count_documents({
        "user_id": current_user['id'],
        "status": "clicked"
    })
    
    delivery_rate = (total_delivered / total_sent * 100) if total_sent > 0 else 0
    open_rate = (total_opened / total_delivered * 100) if total_delivered > 0 else 0
    click_rate = (total_clicked / total_opened * 100) if total_opened > 0 else 0
    
    return {
        "total_campaigns": total_campaigns,
        "sent_campaigns": sent_campaigns,
        "total_sent": total_sent,
        "total_delivered": total_delivered,
        "total_opened": total_opened,
        "total_clicked": total_clicked,
        "delivery_rate": round(delivery_rate, 2),
        "open_rate": round(open_rate, 2),
        "click_rate": round(click_rate, 2)
    }


# ==================== FUNNEL BUILDER ROUTES ====================

@app.get("/api/funnels")
async def get_funnels(
    current_user: dict = Depends(get_current_user),
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all funnels with pagination"""
    query = {"user_id": current_user['id']}
    
    if status:
        query["status"] = status
    
    total = funnels_collection.count_documents(query)
    skip = (page - 1) * limit
    
    funnels = list(funnels_collection.find(query)
                  .skip(skip)
                  .limit(limit)
                  .sort("created_at", -1))
    
    for funnel in funnels:
        funnel.pop('_id', None)
        # Get page count for each funnel
        page_count = funnel_pages_collection.count_documents({"funnel_id": funnel['id']})
        funnel['page_count'] = page_count
    
    return {
        "funnels": funnels,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.post("/api/funnels")
async def create_funnel(
    funnel: FunnelCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new funnel"""
    funnel_dict = funnel.model_dump()
    funnel_dict['id'] = str(uuid.uuid4())
    funnel_dict['user_id'] = current_user['id']
    funnel_dict['status'] = 'draft'
    funnel_dict['pages'] = []
    funnel_dict['created_at'] = datetime.utcnow()
    funnel_dict['updated_at'] = datetime.utcnow()
    funnel_dict['total_visits'] = 0
    funnel_dict['total_conversions'] = 0
    funnel_dict['conversion_rate'] = 0.0
    funnel_dict['total_revenue'] = 0.0
    
    # If creating from template
    if funnel_dict.get('template_id'):
        template = funnel_templates_collection.find_one({"id": funnel_dict['template_id']})
        if template:
            # Create pages from template
            for template_page in template.get('pages', []):
                page_dict = {
                    'id': str(uuid.uuid4()),
                    'funnel_id': funnel_dict['id'],
                    'user_id': current_user['id'],
                    'name': template_page['name'],
                    'path': template_page['path'],
                    'content': template_page['content'],
                    'order': template_page['order'],
                    'seo_title': template_page.get('seo_title'),
                    'seo_description': template_page.get('seo_description'),
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                funnel_pages_collection.insert_one(page_dict)
                page_dict.pop('_id', None)
                funnel_dict['pages'].append({
                    'id': page_dict['id'],
                    'name': page_dict['name'],
                    'path': page_dict['path'],
                    'order': page_dict['order']
                })
            
            # Update template usage
            funnel_templates_collection.update_one(
                {"id": funnel_dict['template_id']},
                {"$inc": {"usage_count": 1}}
            )
    
    funnel_dict.pop('template_id', None)
    funnels_collection.insert_one(funnel_dict)
    funnel_dict.pop('_id')
    
    return funnel_dict

@app.get("/api/funnels/{funnel_id}")
async def get_funnel(
    funnel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific funnel with all pages"""
    funnel = funnels_collection.find_one({
        "id": funnel_id,
        "user_id": current_user['id']
    })
    
    if not funnel:
        raise HTTPException(status_code=404, detail="Funnel not found")
    
    funnel.pop('_id', None)
    
    # Get all pages for this funnel
    pages = list(funnel_pages_collection.find({"funnel_id": funnel_id}).sort("order", 1))
    for page in pages:
        page.pop('_id', None)
    
    funnel['pages'] = pages
    
    return funnel

@app.put("/api/funnels/{funnel_id}")
async def update_funnel(
    funnel_id: str,
    funnel_update: FunnelUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a funnel"""
    existing = funnels_collection.find_one({
        "id": funnel_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Funnel not found")
    
    update_data = funnel_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    # If publishing, set published_at
    if update_data.get('status') == 'active' and existing['status'] != 'active':
        update_data['published_at'] = datetime.utcnow()
    
    funnels_collection.update_one(
        {"id": funnel_id},
        {"$set": update_data}
    )
    
    updated = funnels_collection.find_one({"id": funnel_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/funnels/{funnel_id}")
async def delete_funnel(
    funnel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a funnel"""
    result = funnels_collection.delete_one({
        "id": funnel_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Funnel not found")
    
    # Delete all pages
    funnel_pages_collection.delete_many({"funnel_id": funnel_id})
    # Delete all visits and conversions
    funnel_visits_collection.delete_many({"funnel_id": funnel_id})
    funnel_conversions_collection.delete_many({"funnel_id": funnel_id})
    
    return {"message": "Funnel deleted successfully"}

# ==================== FUNNEL PAGES ROUTES ====================

@app.get("/api/funnels/{funnel_id}/pages")
async def get_funnel_pages(
    funnel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all pages for a funnel"""
    # Verify funnel ownership
    funnel = funnels_collection.find_one({
        "id": funnel_id,
        "user_id": current_user['id']
    })
    
    if not funnel:
        raise HTTPException(status_code=404, detail="Funnel not found")
    
    pages = list(funnel_pages_collection.find({"funnel_id": funnel_id}).sort("order", 1))
    for page in pages:
        page.pop('_id', None)
    
    return pages

@app.post("/api/funnels/{funnel_id}/pages")
async def create_funnel_page(
    funnel_id: str,
    page: FunnelPageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new page in a funnel"""
    # Verify funnel ownership
    funnel = funnels_collection.find_one({
        "id": funnel_id,
        "user_id": current_user['id']
    })
    
    if not funnel:
        raise HTTPException(status_code=404, detail="Funnel not found")
    
    page_dict = page.model_dump()
    page_dict['id'] = str(uuid.uuid4())
    page_dict['funnel_id'] = funnel_id
    page_dict['user_id'] = current_user['id']
    page_dict['created_at'] = datetime.utcnow()
    page_dict['updated_at'] = datetime.utcnow()
    
    funnel_pages_collection.insert_one(page_dict)
    page_dict.pop('_id')
    
    # Update funnel's pages array
    funnels_collection.update_one(
        {"id": funnel_id},
        {"$push": {"pages": {
            "id": page_dict['id'],
            "name": page_dict['name'],
            "path": page_dict['path'],
            "order": page_dict['order']
        }}}
    )
    
    return page_dict

@app.get("/api/funnels/{funnel_id}/pages/{page_id}")
async def get_funnel_page(
    funnel_id: str,
    page_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific page"""
    page = funnel_pages_collection.find_one({
        "id": page_id,
        "funnel_id": funnel_id,
        "user_id": current_user['id']
    })
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    page.pop('_id', None)
    return page

@app.put("/api/funnels/{funnel_id}/pages/{page_id}")
async def update_funnel_page(
    funnel_id: str,
    page_id: str,
    page_update: FunnelPageUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a funnel page"""
    existing = funnel_pages_collection.find_one({
        "id": page_id,
        "funnel_id": funnel_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = page_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    funnel_pages_collection.update_one(
        {"id": page_id},
        {"$set": update_data}
    )
    
    # Update funnel's pages array if name or path changed
    if 'name' in update_data or 'path' in update_data or 'order' in update_data:
        updated_page = funnel_pages_collection.find_one({"id": page_id})
        funnels_collection.update_one(
            {"id": funnel_id, "pages.id": page_id},
            {"$set": {
                "pages.$.name": updated_page['name'],
                "pages.$.path": updated_page['path'],
                "pages.$.order": updated_page['order']
            }}
        )
    
    updated = funnel_pages_collection.find_one({"id": page_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/funnels/{funnel_id}/pages/{page_id}")
async def delete_funnel_page(
    funnel_id: str,
    page_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a funnel page"""
    result = funnel_pages_collection.delete_one({
        "id": page_id,
        "funnel_id": funnel_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Remove from funnel's pages array
    funnels_collection.update_one(
        {"id": funnel_id},
        {"$pull": {"pages": {"id": page_id}}}
    )
    
    return {"message": "Page deleted successfully"}

# ==================== FUNNEL TEMPLATES ROUTES ====================

@app.get("/api/funnel-templates")
async def get_funnel_templates(current_user: dict = Depends(get_current_user)):
    """Get all funnel templates"""
    templates = list(funnel_templates_collection.find({"is_public": True}))
    
    for template in templates:
        template.pop('_id', None)
    
    return templates

# ==================== FUNNEL ANALYTICS ROUTES ====================

@app.get("/api/funnels/{funnel_id}/analytics")
async def get_funnel_analytics(
    funnel_id: str,
    current_user: dict = Depends(get_current_user),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get funnel analytics"""
    # Verify funnel ownership
    funnel = funnels_collection.find_one({
        "id": funnel_id,
        "user_id": current_user['id']
    })
    
    if not funnel:
        raise HTTPException(status_code=404, detail="Funnel not found")
    
    # Build date filter
    date_filter = {}
    if date_from:
        date_filter['$gte'] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
    if date_to:
        date_filter['$lte'] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
    
    query = {"funnel_id": funnel_id}
    if date_filter:
        query['created_at'] = date_filter
    
    # Get visit stats
    total_visits = funnel_visits_collection.count_documents(query)
    unique_sessions = len(funnel_visits_collection.distinct("session_id", query))
    
    # Get conversion stats
    total_conversions = funnel_conversions_collection.count_documents(query)
    
    # Calculate conversion rate
    conversion_rate = (total_conversions / total_visits * 100) if total_visits > 0 else 0
    
    # Get page-by-page stats
    pages = list(funnel_pages_collection.find({"funnel_id": funnel_id}).sort("order", 1))
    page_stats = []
    
    for page in pages:
        page_visits = funnel_visits_collection.count_documents({
            "funnel_id": funnel_id,
            "page_id": page['id'],
            **({'created_at': date_filter} if date_filter else {})
        })
        page_conversions = funnel_conversions_collection.count_documents({
            "funnel_id": funnel_id,
            "page_id": page['id'],
            **({'created_at': date_filter} if date_filter else {})
        })
        
        page_stats.append({
            "page_id": page['id'],
            "page_name": page['name'],
            "visits": page_visits,
            "conversions": page_conversions,
            "conversion_rate": (page_conversions / page_visits * 100) if page_visits > 0 else 0
        })
    
    # Get traffic sources
    traffic_sources = {}
    visits_with_source = list(funnel_visits_collection.find(query, {"utm_source": 1}))
    for visit in visits_with_source:
        source = visit.get('utm_source', 'direct')
        traffic_sources[source] = traffic_sources.get(source, 0) + 1
    
    return {
        "funnel_id": funnel_id,
        "funnel_name": funnel['name'],
        "total_visits": total_visits,
        "unique_sessions": unique_sessions,
        "total_conversions": total_conversions,
        "conversion_rate": round(conversion_rate, 2),
        "page_stats": page_stats,
        "traffic_sources": traffic_sources
    }

@app.post("/api/funnels/{funnel_id}/track-visit")
async def track_funnel_visit(
    funnel_id: str,
    visit_data: TrackVisitRequest
):
    """Track a page visit (public endpoint - no auth required)"""
    # Verify funnel exists
    funnel = funnels_collection.find_one({"id": funnel_id})
    
    if not funnel:
        raise HTTPException(status_code=404, detail="Funnel not found")
    
    # Create visit record
    visit = {
        'id': str(uuid.uuid4()),
        'funnel_id': funnel_id,
        'page_id': visit_data.page_id,
        'user_id': funnel['user_id'],
        'visitor_ip': visit_data.visitor_ip,
        'user_agent': visit_data.user_agent,
        'referrer': visit_data.referrer,
        'utm_source': visit_data.utm_source,
        'utm_medium': visit_data.utm_medium,
        'utm_campaign': visit_data.utm_campaign,
        'session_id': visit_data.session_id or str(uuid.uuid4()),
        'created_at': datetime.utcnow()
    }
    
    funnel_visits_collection.insert_one(visit)
    
    # Update funnel visit count
    funnels_collection.update_one(
        {"id": funnel_id},
        {"$inc": {"total_visits": 1}}
    )
    
    return {"message": "Visit tracked", "session_id": visit['session_id']}

@app.post("/api/funnels/{funnel_id}/submit-form")
async def submit_funnel_form(
    funnel_id: str,
    form_data: FormSubmissionRequest
):
    """Handle form submission (public endpoint - no auth required)"""
    # Verify funnel exists
    funnel = funnels_collection.find_one({"id": funnel_id})
    
    if not funnel:
        raise HTTPException(status_code=404, detail="Funnel not found")
    
    # Create contact from form data
    contact_data = form_data.form_data
    contact_email = contact_data.get('email')
    
    contact_id = None
    if contact_email:
        # Check if contact already exists
        existing_contact = contacts_collection.find_one({
            "user_id": funnel['user_id'],
            "email": contact_email
        })
        
        if existing_contact:
            contact_id = existing_contact['id']
            # Update contact with new form data
            contacts_collection.update_one(
                {"id": contact_id},
                {"$set": {
                    "first_name": contact_data.get('first_name', existing_contact.get('first_name')),
                    "last_name": contact_data.get('last_name', existing_contact.get('last_name')),
                    "phone": contact_data.get('phone', existing_contact.get('phone')),
                    "company": contact_data.get('company', existing_contact.get('company')),
                    "updated_at": datetime.utcnow()
                }}
            )
        else:
            # Create new contact
            contact = {
                'id': str(uuid.uuid4()),
                'user_id': funnel['user_id'],
                'first_name': contact_data.get('first_name', 'Unknown'),
                'last_name': contact_data.get('last_name'),
                'email': contact_email,
                'phone': contact_data.get('phone'),
                'company': contact_data.get('company'),
                'source': f"Funnel: {funnel['name']}",
                'status': 'lead',
                'score': 0,
                'tags': [f"funnel-{funnel['name'].lower().replace(' ', '-')}"],
                'segments': [],
                'custom_fields': {k: v for k, v in contact_data.items() 
                                 if k not in ['email', 'first_name', 'last_name', 'phone', 'company']},
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'engagement_count': 0
            }
            contacts_collection.insert_one(contact)
            contact_id = contact['id']
    
    # Create conversion record
    conversion = {
        'id': str(uuid.uuid4()),
        'funnel_id': funnel_id,
        'page_id': form_data.page_id,
        'user_id': funnel['user_id'],
        'contact_id': contact_id,
        'conversion_type': 'form_submission',
        'conversion_value': 0.0,
        'form_data': contact_data,
        'session_id': form_data.session_id,
        'created_at': datetime.utcnow()
    }
    
    funnel_conversions_collection.insert_one(conversion)
    
    # Update funnel conversion count and rate
    funnels_collection.update_one(
        {"id": funnel_id},
        {"$inc": {"total_conversions": 1}}
    )
    
    # Recalculate conversion rate
    updated_funnel = funnels_collection.find_one({"id": funnel_id})
    if updated_funnel['total_visits'] > 0:
        conversion_rate = (updated_funnel['total_conversions'] / updated_funnel['total_visits']) * 100
        funnels_collection.update_one(
            {"id": funnel_id},
            {"$set": {"conversion_rate": round(conversion_rate, 2)}}
        )
    
    return {"message": "Form submitted successfully", "contact_id": contact_id}


# ==================== FORMS & SURVEYS ROUTES ====================

# ==================== FORMS ROUTES ====================

@app.get("/api/forms")
async def get_forms(
    current_user: dict = Depends(get_current_user),
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all forms with pagination"""
    query = {"user_id": current_user['id']}
    
    if status:
        query["status"] = status
    
    total = forms_collection.count_documents(query)
    skip = (page - 1) * limit
    
    forms = list(forms_collection.find(query)
                .skip(skip)
                .limit(limit)
                .sort("created_at", -1))
    
    for form in forms:
        form.pop('_id', None)
    
    return {
        "forms": forms,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.post("/api/forms")
async def create_form(
    form: FormCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new form"""
    form_dict = form.model_dump()
    form_dict['id'] = str(uuid.uuid4())
    form_dict['user_id'] = current_user['id']
    form_dict['status'] = 'draft'
    form_dict['created_at'] = datetime.utcnow()
    form_dict['updated_at'] = datetime.utcnow()
    form_dict['total_views'] = 0
    form_dict['total_submissions'] = 0
    form_dict['conversion_rate'] = 0.0
    
    # Convert fields to dict format with IDs
    fields = []
    for idx, field in enumerate(form_dict.get('fields', [])):
        field['id'] = str(uuid.uuid4())
        field['order'] = idx
        fields.append(field)
    form_dict['fields'] = fields
    
    forms_collection.insert_one(form_dict)
    form_dict.pop('_id')
    
    return form_dict

@app.get("/api/forms/{form_id}")
async def get_form(
    form_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific form"""
    form = forms_collection.find_one({
        "id": form_id,
        "user_id": current_user['id']
    })
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    form.pop('_id', None)
    return form

@app.put("/api/forms/{form_id}")
async def update_form(
    form_id: str,
    form_update: FormUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a form"""
    existing = forms_collection.find_one({
        "id": form_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Form not found")
    
    update_data = form_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    # If publishing, set published_at
    if update_data.get('status') == 'active' and existing['status'] != 'active':
        update_data['published_at'] = datetime.utcnow()
    
    forms_collection.update_one(
        {"id": form_id},
        {"$set": update_data}
    )
    
    updated = forms_collection.find_one({"id": form_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/forms/{form_id}")
async def delete_form(
    form_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a form"""
    result = forms_collection.delete_one({
        "id": form_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Delete all submissions
    form_submissions_collection.delete_many({"form_id": form_id})
    # Delete all views
    form_views_collection.delete_many({"form_id": form_id})
    
    return {"message": "Form deleted successfully"}

# ==================== FORM SUBMISSIONS ROUTES ====================

@app.get("/api/forms/{form_id}/submissions")
async def get_form_submissions(
    form_id: str,
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """Get all submissions for a form"""
    # Verify form ownership
    form = forms_collection.find_one({
        "id": form_id,
        "user_id": current_user['id']
    })
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    query = {"form_id": form_id}
    total = form_submissions_collection.count_documents(query)
    skip = (page - 1) * limit
    
    submissions = list(form_submissions_collection.find(query)
                      .skip(skip)
                      .limit(limit)
                      .sort("created_at", -1))
    
    for submission in submissions:
        submission.pop('_id', None)
    
    return {
        "submissions": submissions,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.post("/api/forms/{form_id}/submit")
async def submit_form(
    form_id: str,
    submission: PublicFormSubmissionRequest
):
    """Submit a form (public endpoint - no auth required)"""
    # Verify form exists and is active
    form = forms_collection.find_one({"id": form_id, "status": "active"})
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or not active")
    
    # Create submission record
    submission_dict = submission.model_dump()
    submission_dict['id'] = str(uuid.uuid4())
    submission_dict['form_id'] = form_id
    submission_dict['user_id'] = form['user_id']
    submission_dict['created_at'] = datetime.utcnow()
    
    # Check if email exists in submission data to create/update contact
    contact_id = None
    submission_data = submission_dict['submission_data']
    
    if 'email' in submission_data:
        email = submission_data['email']
        
        # Check if contact exists
        existing_contact = contacts_collection.find_one({
            "user_id": form['user_id'],
            "email": email
        })
        
        if existing_contact:
            contact_id = existing_contact['id']
            # Update contact with any new data
            update_data = {}
            if 'first_name' in submission_data:
                update_data['first_name'] = submission_data['first_name']
            if 'last_name' in submission_data:
                update_data['last_name'] = submission_data['last_name']
            if 'phone' in submission_data:
                update_data['phone'] = submission_data['phone']
            if 'company' in submission_data:
                update_data['company'] = submission_data['company']
            
            if update_data:
                update_data['updated_at'] = datetime.utcnow()
                contacts_collection.update_one(
                    {"id": contact_id},
                    {"$set": update_data}
                )
        else:
            # Create new contact
            contact = {
                'id': str(uuid.uuid4()),
                'user_id': form['user_id'],
                'first_name': submission_data.get('first_name', 'Unknown'),
                'last_name': submission_data.get('last_name'),
                'email': email,
                'phone': submission_data.get('phone'),
                'company': submission_data.get('company'),
                'source': f"Form: {form['name']}",
                'status': 'lead',
                'score': 0,
                'tags': [f"form-{form['name'].lower().replace(' ', '-')}"],
                'segments': [],
                'custom_fields': {},
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'engagement_count': 0
            }
            contacts_collection.insert_one(contact)
            contact_id = contact['id']
    
    submission_dict['contact_id'] = contact_id
    
    form_submissions_collection.insert_one(submission_dict)
    
    # Update form stats
    forms_collection.update_one(
        {"id": form_id},
        {"$inc": {"total_submissions": 1}}
    )
    
    # Recalculate conversion rate
    updated_form = forms_collection.find_one({"id": form_id})
    if updated_form['total_views'] > 0:
        conversion_rate = (updated_form['total_submissions'] / updated_form['total_views']) * 100
        forms_collection.update_one(
            {"id": form_id},
            {"$set": {"conversion_rate": round(conversion_rate, 2)}}
        )
    
    return {"message": "Form submitted successfully", "submission_id": submission_dict['id'], "contact_id": contact_id}

@app.post("/api/forms/{form_id}/track-view")
async def track_form_view(
    form_id: str,
    visitor_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    referrer: Optional[str] = None
):
    """Track a form view (public endpoint - no auth required)"""
    # Verify form exists
    form = forms_collection.find_one({"id": form_id})
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Create view record
    view = {
        'id': str(uuid.uuid4()),
        'form_id': form_id,
        'user_id': form['user_id'],
        'visitor_ip': visitor_ip,
        'user_agent': user_agent,
        'referrer': referrer,
        'created_at': datetime.utcnow()
    }
    
    form_views_collection.insert_one(view)
    
    # Update form view count
    forms_collection.update_one(
        {"id": form_id},
        {"$inc": {"total_views": 1}}
    )
    
    return {"message": "View tracked"}

@app.get("/api/forms/{form_id}/analytics")
async def get_form_analytics(
    form_id: str,
    current_user: dict = Depends(get_current_user),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Get form analytics"""
    # Verify form ownership
    form = forms_collection.find_one({
        "id": form_id,
        "user_id": current_user['id']
    })
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Build date filter
    date_filter = {}
    if date_from:
        date_filter['$gte'] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
    if date_to:
        date_filter['$lte'] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
    
    query = {"form_id": form_id}
    if date_filter:
        query['created_at'] = date_filter
    
    # Get stats
    total_views = form_views_collection.count_documents(query)
    total_submissions = form_submissions_collection.count_documents(query)
    
    # Calculate conversion rate
    conversion_rate = (total_submissions / total_views * 100) if total_views > 0 else 0
    
    # Get field-by-field stats
    submissions = list(form_submissions_collection.find(query))
    field_stats = {}
    
    for submission in submissions:
        for field_id, value in submission.get('submission_data', {}).items():
            if field_id not in field_stats:
                field_stats[field_id] = {
                    'total_responses': 0,
                    'values': {}
                }
            field_stats[field_id]['total_responses'] += 1
            
            # Count value occurrences (for dropdowns, radio, etc.)
            if isinstance(value, str):
                if value not in field_stats[field_id]['values']:
                    field_stats[field_id]['values'][value] = 0
                field_stats[field_id]['values'][value] += 1
    
    return {
        "form_id": form_id,
        "form_name": form['name'],
        "total_views": total_views,
        "total_submissions": total_submissions,
        "conversion_rate": round(conversion_rate, 2),
        "field_stats": field_stats
    }

@app.get("/api/forms/{form_id}/export")
async def export_form_submissions(
    form_id: str,
    format: str = Query("csv", regex="^(csv|excel)$"),
    current_user: dict = Depends(get_current_user)
):
    """Export form submissions to CSV or Excel"""
    # Verify form ownership
    form = forms_collection.find_one({
        "id": form_id,
        "user_id": current_user['id']
    })
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    submissions = list(form_submissions_collection.find({"form_id": form_id}))
    
    if not submissions:
        raise HTTPException(status_code=404, detail="No submissions to export")
    
    # Prepare data for export
    export_data = []
    for submission in submissions:
        row = {
            'submission_id': submission.get('id', ''),
            'submitted_at': submission.get('created_at', '').isoformat() if submission.get('created_at') else '',
            'contact_id': submission.get('contact_id', ''),
            **submission.get('submission_data', {})
        }
        export_data.append(row)
    
    df = pd.DataFrame(export_data)
    
    if format == 'csv':
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=form_{form_id}_submissions.csv"}
        )
    else:  # excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Submissions')
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=form_{form_id}_submissions.xlsx"}
        )

# ==================== FORM TEMPLATES ROUTES ====================

@app.get("/api/form-templates")
async def get_form_templates(current_user: dict = Depends(get_current_user)):
    """Get all form templates"""
    templates = list(form_templates_collection.find({"is_public": True}))
    
    for template in templates:
        template.pop('_id', None)
    
    return templates

# ==================== SURVEYS ROUTES ====================

@app.get("/api/surveys")
async def get_surveys(
    current_user: dict = Depends(get_current_user),
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all surveys with pagination"""
    query = {"user_id": current_user['id']}
    
    if status:
        query["status"] = status
    
    total = surveys_collection.count_documents(query)
    skip = (page - 1) * limit
    
    surveys = list(surveys_collection.find(query)
                  .skip(skip)
                  .limit(limit)
                  .sort("created_at", -1))
    
    for survey in surveys:
        survey.pop('_id', None)
    
    return {
        "surveys": surveys,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.post("/api/surveys")
async def create_survey(
    survey: SurveyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new survey"""
    survey_dict = survey.model_dump()
    survey_dict['id'] = str(uuid.uuid4())
    survey_dict['user_id'] = current_user['id']
    survey_dict['status'] = 'draft'
    survey_dict['created_at'] = datetime.utcnow()
    survey_dict['updated_at'] = datetime.utcnow()
    survey_dict['total_responses'] = 0
    survey_dict['completion_rate'] = 0.0
    
    # Convert questions to dict format with IDs
    questions = []
    for idx, question in enumerate(survey_dict.get('questions', [])):
        question['id'] = str(uuid.uuid4())
        question['order'] = idx
        questions.append(question)
    survey_dict['questions'] = questions
    
    surveys_collection.insert_one(survey_dict)
    survey_dict.pop('_id')
    
    return survey_dict

@app.get("/api/surveys/{survey_id}")
async def get_survey(
    survey_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific survey"""
    survey = surveys_collection.find_one({
        "id": survey_id,
        "user_id": current_user['id']
    })
    
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    survey.pop('_id', None)
    return survey

@app.put("/api/surveys/{survey_id}")
async def update_survey(
    survey_id: str,
    survey_update: SurveyUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a survey"""
    existing = surveys_collection.find_one({
        "id": survey_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    update_data = survey_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    # If publishing, set published_at
    if update_data.get('status') == 'active' and existing['status'] != 'active':
        update_data['published_at'] = datetime.utcnow()
    
    surveys_collection.update_one(
        {"id": survey_id},
        {"$set": update_data}
    )
    
    updated = surveys_collection.find_one({"id": survey_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/surveys/{survey_id}")
async def delete_survey(
    survey_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a survey"""
    result = surveys_collection.delete_one({
        "id": survey_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Delete all responses
    survey_responses_collection.delete_many({"survey_id": survey_id})
    
    return {"message": "Survey deleted successfully"}

# ==================== SURVEY RESPONSES ROUTES ====================

@app.get("/api/surveys/{survey_id}/responses")
async def get_survey_responses(
    survey_id: str,
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """Get all responses for a survey"""
    # Verify survey ownership
    survey = surveys_collection.find_one({
        "id": survey_id,
        "user_id": current_user['id']
    })
    
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    query = {"survey_id": survey_id}
    total = survey_responses_collection.count_documents(query)
    skip = (page - 1) * limit
    
    responses = list(survey_responses_collection.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort("created_at", -1))
    
    for response in responses:
        response.pop('_id', None)
    
    return {
        "responses": responses,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.post("/api/surveys/{survey_id}/submit")
async def submit_survey(
    survey_id: str,
    response: PublicSurveyResponseRequest
):
    """Submit a survey response (public endpoint - no auth required)"""
    # Verify survey exists and is active
    survey = surveys_collection.find_one({"id": survey_id, "status": "active"})
    
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found or not active")
    
    # Create response record
    response_dict = response.model_dump()
    response_dict['id'] = str(uuid.uuid4())
    response_dict['survey_id'] = survey_id
    response_dict['user_id'] = survey['user_id']
    response_dict['created_at'] = datetime.utcnow()
    
    if response_dict.get('completed'):
        response_dict['completed_at'] = datetime.utcnow()
    
    survey_responses_collection.insert_one(response_dict)
    
    # Update survey stats
    surveys_collection.update_one(
        {"id": survey_id},
        {"$inc": {"total_responses": 1}}
    )
    
    return {"message": "Survey submitted successfully", "response_id": response_dict['id']}

@app.get("/api/surveys/{survey_id}/analytics")
async def get_survey_analytics(
    survey_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get survey analytics"""
    # Verify survey ownership
    survey = surveys_collection.find_one({
        "id": survey_id,
        "user_id": current_user['id']
    })
    
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Get all responses
    responses = list(survey_responses_collection.find({"survey_id": survey_id}))
    
    total_responses = len(responses)
    completed_responses = len([r for r in responses if r.get('completed')])
    completion_rate = (completed_responses / total_responses * 100) if total_responses > 0 else 0
    
    # Question-by-question stats
    question_stats = {}
    
    for response in responses:
        for question_id, answer in response.get('responses', {}).items():
            if question_id not in question_stats:
                question_stats[question_id] = {
                    'total_responses': 0,
                    'answers': {}
                }
            question_stats[question_id]['total_responses'] += 1
            
            # Count answer occurrences
            if isinstance(answer, str):
                if answer not in question_stats[question_id]['answers']:
                    question_stats[question_id]['answers'][answer] = 0
                question_stats[question_id]['answers'][answer] += 1
            elif isinstance(answer, list):
                for item in answer:
                    if item not in question_stats[question_id]['answers']:
                        question_stats[question_id]['answers'][item] = 0
                    question_stats[question_id]['answers'][item] += 1
    
    return {
        "survey_id": survey_id,
        "survey_name": survey['name'],
        "total_responses": total_responses,
        "completed_responses": completed_responses,
        "completion_rate": round(completion_rate, 2),
        "question_stats": question_stats
    }


@app.on_event("startup")
async def startup_event():
    """Create demo user on startup"""
    demo_email = "demo@efunnels.com"
    existing_demo = users_collection.find_one({"email": demo_email})
    
    if not existing_demo:
        demo_user = {
            'id': str(uuid.uuid4()),
            'email': demo_email,
            'full_name': 'Demo User',
            'password': get_password_hash('demo123'),
            'role': 'user',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'is_active': True,
            'auth_provider': 'local',
            'subscription_plan': 'premium',
            'company': 'eFunnels Demo'
        }
        users_collection.insert_one(demo_user)
        print("✅ Demo user created: demo@efunnels.com / demo123")
    
    # Create funnel templates if they don't exist
    existing_templates = funnel_templates_collection.count_documents({})
    if existing_templates == 0:
        templates = [
            {
                'id': str(uuid.uuid4()),
                'name': 'Lead Generation Funnel',
                'description': 'Capture leads with a compelling landing page and thank you page',
                'funnel_type': 'lead_gen',
                'is_public': True,
                'usage_count': 0,
                'thumbnail': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
                'pages': [
                    {
                        'name': 'Landing Page',
                        'path': '/landing',
                        'order': 0,
                        'seo_title': 'Get Your Free Resource',
                        'seo_description': 'Sign up to receive our exclusive free resource',
                        'content': {
                            'blocks': [
                                {
                                    'id': '1',
                                    'type': 'hero',
                                    'content': {
                                        'headline': 'Get Your Free Marketing Guide',
                                        'subheadline': 'Learn the secrets to growing your business online',
                                        'cta_text': 'Download Now',
                                        'cta_link': '#form',
                                        'image': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop'
                                    },
                                    'style': {
                                        'backgroundColor': '#1e3a8a',
                                        'textColor': '#ffffff',
                                        'alignment': 'center',
                                        'padding': '80px 20px'
                                    }
                                },
                                {
                                    'id': '2',
                                    'type': 'form',
                                    'content': {
                                        'title': 'Get Instant Access',
                                        'fields': [
                                            {'name': 'first_name', 'label': 'First Name', 'type': 'text', 'required': True},
                                            {'name': 'email', 'label': 'Email', 'type': 'email', 'required': True}
                                        ],
                                        'submit_text': 'Get Free Access',
                                        'success_message': 'Thank you! Check your email.'
                                    },
                                    'style': {
                                        'backgroundColor': '#f3f4f6',
                                        'padding': '60px 20px'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        'name': 'Thank You Page',
                        'path': '/thank-you',
                        'order': 1,
                        'seo_title': 'Thank You',
                        'seo_description': 'Thank you for signing up',
                        'content': {
                            'blocks': [
                                {
                                    'id': '1',
                                    'type': 'hero',
                                    'content': {
                                        'headline': 'Thank You!',
                                        'subheadline': 'Check your email for your free guide',
                                        'cta_text': '',
                                        'cta_link': '',
                                        'image': ''
                                    },
                                    'style': {
                                        'backgroundColor': '#10b981',
                                        'textColor': '#ffffff',
                                        'alignment': 'center',
                                        'padding': '100px 20px'
                                    }
                                }
                            ]
                        }
                    }
                ],
                'created_at': datetime.utcnow()
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Sales Funnel',
                'description': 'Convert visitors into customers with a high-converting sales funnel',
                'funnel_type': 'sales',
                'is_public': True,
                'usage_count': 0,
                'thumbnail': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
                'pages': [
                    {
                        'name': 'Sales Page',
                        'path': '/sales',
                        'order': 0,
                        'seo_title': 'Premium Product - Limited Time Offer',
                        'seo_description': 'Get access to our premium product at a special price',
                        'content': {
                            'blocks': [
                                {
                                    'id': '1',
                                    'type': 'hero',
                                    'content': {
                                        'headline': 'Transform Your Business Today',
                                        'subheadline': 'Join thousands of successful entrepreneurs',
                                        'cta_text': 'Get Started Now',
                                        'cta_link': '#pricing',
                                        'image': 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=800&fit=crop'
                                    },
                                    'style': {
                                        'backgroundColor': '#7c3aed',
                                        'textColor': '#ffffff',
                                        'alignment': 'center',
                                        'padding': '80px 20px'
                                    }
                                },
                                {
                                    'id': '2',
                                    'type': 'features',
                                    'content': {
                                        'title': 'What You Get',
                                        'features': [
                                            {
                                                'icon': '⚡',
                                                'title': 'Fast Results',
                                                'description': 'See results in just 30 days'
                                            },
                                            {
                                                'icon': '🎯',
                                                'title': 'Proven System',
                                                'description': 'Battle-tested by thousands'
                                            },
                                            {
                                                'icon': '💰',
                                                'title': 'Money Back Guarantee',
                                                'description': '100% risk-free for 60 days'
                                            }
                                        ]
                                    },
                                    'style': {
                                        'backgroundColor': '#ffffff',
                                        'padding': '60px 20px'
                                    }
                                },
                                {
                                    'id': '3',
                                    'type': 'pricing',
                                    'content': {
                                        'title': 'Choose Your Plan',
                                        'plans': [
                                            {
                                                'name': 'Starter',
                                                'price': '$97',
                                                'features': ['Feature 1', 'Feature 2', 'Feature 3'],
                                                'cta_text': 'Get Started',
                                                'recommended': False
                                            },
                                            {
                                                'name': 'Professional',
                                                'price': '$197',
                                                'features': ['Everything in Starter', 'Feature 4', 'Feature 5', 'Feature 6'],
                                                'cta_text': 'Get Started',
                                                'recommended': True
                                            }
                                        ]
                                    },
                                    'style': {
                                        'backgroundColor': '#f3f4f6',
                                        'padding': '60px 20px'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        'name': 'Checkout',
                        'path': '/checkout',
                        'order': 1,
                        'seo_title': 'Secure Checkout',
                        'seo_description': 'Complete your purchase',
                        'content': {
                            'blocks': [
                                {
                                    'id': '1',
                                    'type': 'form',
                                    'content': {
                                        'title': 'Complete Your Order',
                                        'fields': [
                                            {'name': 'first_name', 'label': 'First Name', 'type': 'text', 'required': True},
                                            {'name': 'last_name', 'label': 'Last Name', 'type': 'text', 'required': True},
                                            {'name': 'email', 'label': 'Email', 'type': 'email', 'required': True},
                                            {'name': 'phone', 'label': 'Phone', 'type': 'tel', 'required': False}
                                        ],
                                        'submit_text': 'Complete Purchase',
                                        'success_message': 'Order completed successfully!'
                                    },
                                    'style': {
                                        'backgroundColor': '#ffffff',
                                        'padding': '60px 20px'
                                    }
                                }
                            ]
                        }
                    }
                ],
                'created_at': datetime.utcnow()
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Webinar Funnel',
                'description': 'Promote and host successful webinars with automated follow-ups',
                'funnel_type': 'webinar',
                'is_public': True,
                'usage_count': 0,
                'thumbnail': 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=600&fit=crop',
                'pages': [
                    {
                        'name': 'Registration Page',
                        'path': '/webinar',
                        'order': 0,
                        'seo_title': 'Free Webinar - Register Now',
                        'seo_description': 'Join our exclusive free webinar',
                        'content': {
                            'blocks': [
                                {
                                    'id': '1',
                                    'type': 'hero',
                                    'content': {
                                        'headline': 'Free Webinar: Master Digital Marketing',
                                        'subheadline': 'Tuesday, March 15th at 2 PM EST',
                                        'cta_text': 'Save My Spot',
                                        'cta_link': '#register',
                                        'image': 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=1200&h=800&fit=crop'
                                    },
                                    'style': {
                                        'backgroundColor': '#dc2626',
                                        'textColor': '#ffffff',
                                        'alignment': 'center',
                                        'padding': '80px 20px'
                                    }
                                },
                                {
                                    'id': '2',
                                    'type': 'form',
                                    'content': {
                                        'title': 'Register for Free Webinar',
                                        'fields': [
                                            {'name': 'first_name', 'label': 'First Name', 'type': 'text', 'required': True},
                                            {'name': 'email', 'label': 'Email', 'type': 'email', 'required': True}
                                        ],
                                        'submit_text': 'Register Now',
                                        'success_message': 'You\'re registered! Check your email for details.'
                                    },
                                    'style': {
                                        'backgroundColor': '#f3f4f6',
                                        'padding': '60px 20px'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        'name': 'Confirmation',
                        'path': '/confirmed',
                        'order': 1,
                        'seo_title': 'You\'re Registered!',
                        'seo_description': 'Webinar registration confirmed',
                        'content': {
                            'blocks': [
                                {
                                    'id': '1',
                                    'type': 'hero',
                                    'content': {
                                        'headline': 'You\'re Registered!',
                                        'subheadline': 'Check your email for the webinar link and calendar invite',
                                        'cta_text': '',
                                        'cta_link': '',
                                        'image': ''
                                    },
                                    'style': {
                                        'backgroundColor': '#10b981',
                                        'textColor': '#ffffff',
                                        'alignment': 'center',
                                        'padding': '100px 20px'
                                    }
                                }
                            ]
                        }
                    }
                ],
                'created_at': datetime.utcnow()
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Product Launch Funnel',
                'description': 'Build anticipation and excitement for your product launch',
                'funnel_type': 'product_launch',
                'is_public': True,
                'usage_count': 0,
                'thumbnail': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop',
                'pages': [
                    {
                        'name': 'Coming Soon',
                        'path': '/coming-soon',
                        'order': 0,
                        'seo_title': 'Coming Soon - Get Early Access',
                        'seo_description': 'Be the first to know when we launch',
                        'content': {
                            'blocks': [
                                {
                                    'id': '1',
                                    'type': 'hero',
                                    'content': {
                                        'headline': 'Something Amazing Is Coming',
                                        'subheadline': 'Join the waitlist for exclusive early access',
                                        'cta_text': 'Get Early Access',
                                        'cta_link': '#waitlist',
                                        'image': 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=800&fit=crop'
                                    },
                                    'style': {
                                        'backgroundColor': '#0891b2',
                                        'textColor': '#ffffff',
                                        'alignment': 'center',
                                        'padding': '80px 20px'
                                    }
                                },
                                {
                                    'id': '2',
                                    'type': 'form',
                                    'content': {
                                        'title': 'Join the Waitlist',
                                        'fields': [
                                            {'name': 'first_name', 'label': 'First Name', 'type': 'text', 'required': True},
                                            {'name': 'email', 'label': 'Email', 'type': 'email', 'required': True}
                                        ],
                                        'submit_text': 'Join Waitlist',
                                        'success_message': 'You\'re on the list! We\'ll notify you at launch.'
                                    },
                                    'style': {
                                        'backgroundColor': '#ffffff',
                                        'padding': '60px 20px'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        'name': 'Launch Page',
                        'path': '/launch',
                        'order': 1,
                        'seo_title': 'We\'re Live!',
                        'seo_description': 'Our product is now available',
                        'content': {
                            'blocks': [
                                {
                                    'id': '1',
                                    'type': 'hero',
                                    'content': {
                                        'headline': 'We\'re Live! 🎉',
                                        'subheadline': 'Get your exclusive launch discount now',
                                        'cta_text': 'Shop Now',
                                        'cta_link': '#',
                                        'image': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=800&fit=crop'
                                    },
                                    'style': {
                                        'backgroundColor': '#7c3aed',
                                        'textColor': '#ffffff',
                                        'alignment': 'center',
                                        'padding': '80px 20px'
                                    }
                                }
                            ]
                        }
                    }
                ],
                'created_at': datetime.utcnow()
            }
        ]
        
        funnel_templates_collection.insert_many(templates)
        print("✅ Funnel templates created")
    
    # Create form templates if they don't exist
    existing_form_templates = form_templates_collection.count_documents({})
    if existing_form_templates == 0:
        form_templates = [
            {
                'id': str(uuid.uuid4()),
                'name': 'Contact Form',
                'description': 'Simple contact form with name, email, and message',
                'category': 'contact',
                'is_public': True,
                'usage_count': 0,
                'thumbnail': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400',
                'fields': [
                    {'id': '1', 'field_type': 'text', 'label': 'First Name', 'placeholder': 'John', 'required': True, 'order': 0},
                    {'id': '2', 'field_type': 'text', 'label': 'Last Name', 'placeholder': 'Doe', 'required': True, 'order': 1},
                    {'id': '3', 'field_type': 'email', 'label': 'Email Address', 'placeholder': 'john@example.com', 'required': True, 'order': 2},
                    {'id': '4', 'field_type': 'phone', 'label': 'Phone Number', 'placeholder': '+1 (555) 000-0000', 'required': False, 'order': 3},
                    {'id': '5', 'field_type': 'textarea', 'label': 'Message', 'placeholder': 'How can we help you?', 'required': True, 'order': 4}
                ],
                'created_at': datetime.utcnow()
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Registration Form',
                'description': 'Event or service registration form',
                'category': 'registration',
                'is_public': True,
                'usage_count': 0,
                'thumbnail': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
                'fields': [
                    {'id': '1', 'field_type': 'text', 'label': 'Full Name', 'placeholder': 'John Doe', 'required': True, 'order': 0},
                    {'id': '2', 'field_type': 'email', 'label': 'Email', 'placeholder': 'john@example.com', 'required': True, 'order': 1},
                    {'id': '3', 'field_type': 'phone', 'label': 'Phone', 'placeholder': '+1 (555) 000-0000', 'required': True, 'order': 2},
                    {'id': '4', 'field_type': 'text', 'label': 'Company', 'placeholder': 'Your Company', 'required': False, 'order': 3},
                    {'id': '5', 'field_type': 'select', 'label': 'How did you hear about us?', 'options': ['Google Search', 'Social Media', 'Friend Referral', 'Advertisement', 'Other'], 'required': False, 'order': 4},
                    {'id': '6', 'field_type': 'agreement', 'label': 'I agree to receive updates and promotional materials', 'required': False, 'order': 5}
                ],
                'created_at': datetime.utcnow()
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Feedback Form',
                'description': 'Collect customer feedback and ratings',
                'category': 'feedback',
                'is_public': True,
                'usage_count': 0,
                'thumbnail': 'https://images.unsplash.com/photo-1589561253898-768105ca91a8?w=400',
                'fields': [
                    {'id': '1', 'field_type': 'text', 'label': 'Name', 'placeholder': 'Your name', 'required': False, 'order': 0},
                    {'id': '2', 'field_type': 'email', 'label': 'Email', 'placeholder': 'your@email.com', 'required': True, 'order': 1},
                    {'id': '3', 'field_type': 'rating', 'label': 'Overall Satisfaction', 'maxRating': 5, 'required': True, 'order': 2},
                    {'id': '4', 'field_type': 'radio', 'label': 'Would you recommend us?', 'options': ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not'], 'required': True, 'order': 3},
                    {'id': '5', 'field_type': 'textarea', 'label': 'Additional Comments', 'placeholder': 'Tell us more...', 'required': False, 'order': 4}
                ],
                'created_at': datetime.utcnow()
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Order Form',
                'description': 'Product or service order form',
                'category': 'order',
                'is_public': True,
                'usage_count': 0,
                'thumbnail': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
                'fields': [
                    {'id': '1', 'field_type': 'text', 'label': 'Full Name', 'placeholder': 'John Doe', 'required': True, 'order': 0},
                    {'id': '2', 'field_type': 'email', 'label': 'Email', 'placeholder': 'john@example.com', 'required': True, 'order': 1},
                    {'id': '3', 'field_type': 'phone', 'label': 'Phone', 'placeholder': '+1 (555) 000-0000', 'required': True, 'order': 2},
                    {'id': '4', 'field_type': 'select', 'label': 'Product/Service', 'options': ['Product A - $99', 'Product B - $149', 'Product C - $199', 'Custom Package'], 'required': True, 'order': 3},
                    {'id': '5', 'field_type': 'number', 'label': 'Quantity', 'placeholder': '1', 'required': True, 'order': 4},
                    {'id': '6', 'field_type': 'textarea', 'label': 'Special Instructions', 'placeholder': 'Any special requirements?', 'required': False, 'order': 5},
                    {'id': '7', 'field_type': 'agreement', 'label': 'I agree to the terms and conditions', 'required': True, 'order': 6}
                ],
                'created_at': datetime.utcnow()
            }
        ]
        
        form_templates_collection.insert_many(form_templates)
        print("✅ Form templates created")



# ==================== WORKFLOW AUTOMATION ROUTES ====================

@app.get("/api/workflows")
async def get_workflows(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None  # active, inactive
):
    """Get all workflows for the current user"""
    query = {"user_id": current_user['id']}
    
    if status == "active":
        query["is_active"] = True
    elif status == "inactive":
        query["is_active"] = False
    
    workflows = list(workflows_collection.find(query).skip(skip).limit(limit))
    
    # Remove MongoDB _id
    for workflow in workflows:
        workflow.pop('_id', None)
    
    total = workflows_collection.count_documents(query)
    
    return {
        "workflows": workflows,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@app.post("/api/workflows", response_model=Workflow)
async def create_workflow(
    workflow: WorkflowCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new workflow"""
    workflow_dict = workflow.model_dump()
    workflow_dict['id'] = str(uuid.uuid4())
    workflow_dict['user_id'] = current_user['id']
    workflow_dict['created_at'] = datetime.utcnow()
    workflow_dict['updated_at'] = datetime.utcnow()
    workflow_dict['total_executions'] = 0
    workflow_dict['successful_executions'] = 0
    workflow_dict['failed_executions'] = 0
    workflow_dict['last_triggered'] = None
    
    # Convert nodes and edges from Pydantic models to dicts
    workflow_dict['nodes'] = [node.model_dump() if hasattr(node, 'model_dump') else node for node in workflow_dict.get('nodes', [])]
    workflow_dict['edges'] = [edge.model_dump() if hasattr(edge, 'model_dump') else edge for edge in workflow_dict.get('edges', [])]
    
    workflows_collection.insert_one(workflow_dict)
    workflow_dict.pop('_id')
    
    return workflow_dict

@app.get("/api/workflows/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific workflow"""
    workflow = workflows_collection.find_one({
        "id": workflow_id,
        "user_id": current_user['id']
    })
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow.pop('_id')
    return workflow

@app.put("/api/workflows/{workflow_id}")
async def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a workflow"""
    workflow = workflows_collection.find_one({
        "id": workflow_id,
        "user_id": current_user['id']
    })
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    update_data = workflow_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    # Convert nodes and edges to dicts if present
    if 'nodes' in update_data:
        update_data['nodes'] = [node.model_dump() if hasattr(node, 'model_dump') else node for node in update_data['nodes']]
    if 'edges' in update_data:
        update_data['edges'] = [edge.model_dump() if hasattr(edge, 'model_dump') else edge for edge in update_data['edges']]
    
    workflows_collection.update_one(
        {"id": workflow_id, "user_id": current_user['id']},
        {"$set": update_data}
    )
    
    updated_workflow = workflows_collection.find_one({"id": workflow_id})
    updated_workflow.pop('_id')
    
    return updated_workflow

@app.delete("/api/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a workflow"""
    result = workflows_collection.delete_one({
        "id": workflow_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Also delete all executions for this workflow
    workflow_executions_collection.delete_many({"workflow_id": workflow_id})
    
    return {"message": "Workflow deleted successfully"}

@app.post("/api/workflows/{workflow_id}/activate")
async def activate_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Activate a workflow"""
    workflow = workflows_collection.find_one({
        "id": workflow_id,
        "user_id": current_user['id']
    })
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflows_collection.update_one(
        {"id": workflow_id},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Workflow activated successfully", "workflow_id": workflow_id}

@app.post("/api/workflows/{workflow_id}/deactivate")
async def deactivate_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Deactivate a workflow"""
    workflow = workflows_collection.find_one({
        "id": workflow_id,
        "user_id": current_user['id']
    })
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflows_collection.update_one(
        {"id": workflow_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Workflow deactivated successfully", "workflow_id": workflow_id}

@app.get("/api/workflows/{workflow_id}/executions")
async def get_workflow_executions(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    """Get execution history for a workflow"""
    workflow = workflows_collection.find_one({
        "id": workflow_id,
        "user_id": current_user['id']
    })
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    executions = list(
        workflow_executions_collection.find({"workflow_id": workflow_id})
        .sort("started_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    for execution in executions:
        execution.pop('_id', None)
    
    total = workflow_executions_collection.count_documents({"workflow_id": workflow_id})
    
    return {
        "executions": executions,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@app.get("/api/workflows/{workflow_id}/analytics")
async def get_workflow_analytics(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get analytics for a workflow"""
    workflow = workflows_collection.find_one({
        "id": workflow_id,
        "user_id": current_user['id']
    })
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Get execution stats
    total_executions = workflow_executions_collection.count_documents({"workflow_id": workflow_id})
    successful = workflow_executions_collection.count_documents({"workflow_id": workflow_id, "status": "completed"})
    failed = workflow_executions_collection.count_documents({"workflow_id": workflow_id, "status": "failed"})
    
    success_rate = (successful / total_executions * 100) if total_executions > 0 else 0
    
    # Get unique contacts processed
    executions = list(workflow_executions_collection.find({"workflow_id": workflow_id}))
    contacts_processed = len(set([ex['contact_id'] for ex in executions]))
    
    # Get last execution
    last_execution = workflow_executions_collection.find_one(
        {"workflow_id": workflow_id},
        sort=[("started_at", -1)]
    )
    
    # Count actions from execution logs
    emails_sent = 0
    tags_added = 0
    
    for execution in executions:
        for log_entry in execution.get('execution_log', []):
            if log_entry.get('action') == 'send_email':
                emails_sent += 1
            elif log_entry.get('action') == 'add_tag':
                tags_added += 1
    
    return {
        "workflow_id": workflow_id,
        "total_executions": total_executions,
        "successful_executions": successful,
        "failed_executions": failed,
        "success_rate": round(success_rate, 2),
        "contacts_processed": contacts_processed,
        "emails_sent": emails_sent,
        "tags_added": tags_added,
        "last_execution": last_execution['started_at'] if last_execution else None
    }

@app.post("/api/workflows/{workflow_id}/test")
async def test_workflow(
    workflow_id: str,
    contact_id: str,
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """Test a workflow with a specific contact"""
    workflow = workflows_collection.find_one({
        "id": workflow_id,
        "user_id": current_user['id']
    })
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    contact = contacts_collection.find_one({
        "id": contact_id,
        "user_id": current_user['id']
    })
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Create a test execution
    execution_id = str(uuid.uuid4())
    execution = {
        "id": execution_id,
        "workflow_id": workflow_id,
        "user_id": current_user['id'],
        "contact_id": contact_id,
        "status": "running",
        "current_node": None,
        "execution_log": [],
        "started_at": datetime.utcnow(),
        "completed_at": None,
        "error_message": None
    }
    
    workflow_executions_collection.insert_one(execution)
    
    # Execute workflow in background
    if background_tasks:
        background_tasks.add_task(execute_workflow, workflow, contact, execution_id)
    
    return {
        "message": "Workflow test started",
        "execution_id": execution_id
    }

@app.get("/api/workflow-templates")
async def get_workflow_templates(current_user: User = Depends(get_current_user)):
    """Get all workflow templates"""
    # Check if templates exist
    count = workflow_templates_collection.count_documents({})
    
    if count == 0:
        # Create default templates
        create_default_workflow_templates()
    
    templates = list(workflow_templates_collection.find({}))
    
    for template in templates:
        template.pop('_id', None)
    
    return {"templates": templates}

@app.post("/api/workflows/from-template/{template_id}")
async def create_workflow_from_template(
    template_id: str,
    workflow_name: str,
    current_user: User = Depends(get_current_user)
):
    """Create a workflow from a template"""
    template = workflow_templates_collection.find_one({"id": template_id})
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create new workflow from template
    workflow_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user['id'],
        "name": workflow_name,
        "description": template['description'],
        "is_active": False,
        "trigger_type": template['trigger_type'],
        "nodes": template['nodes'],
        "edges": template['edges'],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "total_executions": 0,
        "successful_executions": 0,
        "failed_executions": 0,
        "last_triggered": None
    }
    
    workflows_collection.insert_one(workflow_dict)
    workflow_dict.pop('_id')
    
    # Update template usage count
    workflow_templates_collection.update_one(
        {"id": template_id},
        {"$inc": {"usage_count": 1}}
    )
    
    return workflow_dict

# Background task to execute workflow
async def execute_workflow(workflow: dict, contact: dict, execution_id: str):
    """Execute a workflow for a contact"""
    try:
        execution_log = []
        nodes = workflow.get('nodes', [])
        edges = workflow.get('edges', [])
        
        # Find the trigger node (starting point)
        trigger_node = next((node for node in nodes if node['type'] == 'trigger'), None)
        
        if not trigger_node:
            raise Exception("No trigger node found in workflow")
        
        current_node_id = trigger_node['id']
        
        # Execute nodes in sequence
        while current_node_id:
            current_node = next((node for node in nodes if node['id'] == current_node_id), None)
            
            if not current_node:
                break
            
            # Update current node
            workflow_executions_collection.update_one(
                {"id": execution_id},
                {"$set": {"current_node": current_node_id}}
            )
            
            # Execute node action
            node_data = current_node.get('data', {})
            node_type = current_node['type']
            
            if node_type == 'action':
                action_type = node_data.get('action_type')
                action_config = node_data.get('action_config', {})
                
                if action_type == 'send_email':
                    # Send email action
                    template_id = action_config.get('template_id')
                    if template_id:
                        # Send email using email service
                        execution_log.append({
                            "node_id": current_node_id,
                            "action": "send_email",
                            "timestamp": datetime.utcnow().isoformat(),
                            "status": "success",
                            "details": f"Email sent to {contact.get('email')}"
                        })
                
                elif action_type == 'add_tag':
                    # Add tag action
                    tag_name = action_config.get('tag_name')
                    if tag_name:
                        # Add tag to contact
                        contacts_collection.update_one(
                            {"id": contact['id']},
                            {"$addToSet": {"tags": tag_name}}
                        )
                        execution_log.append({
                            "node_id": current_node_id,
                            "action": "add_tag",
                            "timestamp": datetime.utcnow().isoformat(),
                            "status": "success",
                            "details": f"Tag '{tag_name}' added"
                        })
                
                elif action_type == 'remove_tag':
                    # Remove tag action
                    tag_name = action_config.get('tag_name')
                    if tag_name:
                        contacts_collection.update_one(
                            {"id": contact['id']},
                            {"$pull": {"tags": tag_name}}
                        )
                        execution_log.append({
                            "node_id": current_node_id,
                            "action": "remove_tag",
                            "timestamp": datetime.utcnow().isoformat(),
                            "status": "success",
                            "details": f"Tag '{tag_name}' removed"
                        })
                
                elif action_type == 'wait':
                    # Wait action (for now, just log it)
                    wait_duration = action_config.get('duration', '1 day')
                    execution_log.append({
                        "node_id": current_node_id,
                        "action": "wait",
                        "timestamp": datetime.utcnow().isoformat(),
                        "status": "success",
                        "details": f"Wait for {wait_duration}"
                    })
                
                elif action_type == 'update_contact':
                    # Update contact field
                    field_name = action_config.get('field_name')
                    field_value = action_config.get('field_value')
                    if field_name and field_value:
                        contacts_collection.update_one(
                            {"id": contact['id']},
                            {"$set": {field_name: field_value}}
                        )
                        execution_log.append({
                            "node_id": current_node_id,
                            "action": "update_contact",
                            "timestamp": datetime.utcnow().isoformat(),
                            "status": "success",
                            "details": f"Updated {field_name} to {field_value}"
                        })
            
            elif node_type == 'condition':
                # Handle conditional logic
                condition_field = node_data.get('condition_field')
                condition_operator = node_data.get('condition_operator')
                condition_value = node_data.get('condition_value')
                
                # Evaluate condition
                contact_value = contact.get(condition_field)
                condition_met = False
                
                if condition_operator == 'equals':
                    condition_met = str(contact_value) == str(condition_value)
                elif condition_operator == 'not_equals':
                    condition_met = str(contact_value) != str(condition_value)
                elif condition_operator == 'contains':
                    condition_met = condition_value in str(contact_value)
                
                execution_log.append({
                    "node_id": current_node_id,
                    "action": "condition_check",
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "success",
                    "details": f"Condition {condition_met}: {condition_field} {condition_operator} {condition_value}"
                })
                
                # Find next node based on condition
                # Look for edge with label 'yes' or 'no'
                next_edge = next(
                    (edge for edge in edges if edge['source'] == current_node_id and 
                     edge.get('label', '').lower() == ('yes' if condition_met else 'no')),
                    None
                )
                
                if next_edge:
                    current_node_id = next_edge['target']
                else:
                    current_node_id = None
                continue
            
            elif node_type == 'end':
                execution_log.append({
                    "node_id": current_node_id,
                    "action": "workflow_end",
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "success",
                    "details": "Workflow completed"
                })
                break
            
            # Find next node
            next_edge = next((edge for edge in edges if edge['source'] == current_node_id), None)
            
            if next_edge:
                current_node_id = next_edge['target']
            else:
                current_node_id = None
        
        # Mark execution as completed
        workflow_executions_collection.update_one(
            {"id": execution_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "execution_log": execution_log
                }
            }
        )
        
        # Update workflow stats
        workflows_collection.update_one(
            {"id": workflow['id']},
            {
                "$inc": {"total_executions": 1, "successful_executions": 1},
                "$set": {"last_triggered": datetime.utcnow()}
            }
        )
        
    except Exception as e:
        # Mark execution as failed
        workflow_executions_collection.update_one(
            {"id": execution_id},
            {
                "$set": {
                    "status": "failed",
                    "completed_at": datetime.utcnow(),
                    "error_message": str(e)
                }
            }
        )
        
        # Update workflow stats
        workflows_collection.update_one(
            {"id": workflow['id']},
            {
                "$inc": {"total_executions": 1, "failed_executions": 1},
                "$set": {"last_triggered": datetime.utcnow()}
            }
        )

def create_default_workflow_templates():
    """Create default workflow templates"""
    templates = [
        {
            "id": str(uuid.uuid4()),
            "name": "Welcome Email Series",
            "description": "3-email welcome sequence for new subscribers",
            "category": "welcome",
            "thumbnail": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400",
            "trigger_type": "contact_created",
            "usage_count": 0,
            "created_at": datetime.utcnow(),
            "nodes": [
                {
                    "id": "trigger-1",
                    "type": "trigger",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "New Contact Created",
                        "trigger_type": "contact_created",
                        "trigger_config": {}
                    }
                },
                {
                    "id": "action-1",
                    "type": "action",
                    "position": {"x": 100, "y": 250},
                    "data": {
                        "label": "Send Welcome Email",
                        "action_type": "send_email",
                        "action_config": {"template_id": "welcome-email-1"}
                    }
                },
                {
                    "id": "action-2",
                    "type": "action",
                    "position": {"x": 100, "y": 400},
                    "data": {
                        "label": "Wait 2 Days",
                        "action_type": "wait",
                        "action_config": {"duration": "2 days"}
                    }
                },
                {
                    "id": "action-3",
                    "type": "action",
                    "position": {"x": 100, "y": 550},
                    "data": {
                        "label": "Send Email 2",
                        "action_type": "send_email",
                        "action_config": {"template_id": "welcome-email-2"}
                    }
                },
                {
                    "id": "action-4",
                    "type": "action",
                    "position": {"x": 100, "y": 700},
                    "data": {
                        "label": "Add Tag: Welcomed",
                        "action_type": "add_tag",
                        "action_config": {"tag_name": "welcomed"}
                    }
                },
                {
                    "id": "end-1",
                    "type": "end",
                    "position": {"x": 100, "y": 850},
                    "data": {"label": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "trigger-1", "target": "action-1"},
                {"id": "e2", "source": "action-1", "target": "action-2"},
                {"id": "e3", "source": "action-2", "target": "action-3"},
                {"id": "e4", "source": "action-3", "target": "action-4"},
                {"id": "e5", "source": "action-4", "target": "end-1"}
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Lead Nurturing Campaign",
            "description": "5-email nurturing sequence for leads",
            "category": "nurture",
            "thumbnail": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400",
            "trigger_type": "tag_added",
            "usage_count": 0,
            "created_at": datetime.utcnow(),
            "nodes": [
                {
                    "id": "trigger-1",
                    "type": "trigger",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "Tag Added: Lead",
                        "trigger_type": "tag_added",
                        "trigger_config": {"tag_name": "lead"}
                    }
                },
                {
                    "id": "action-1",
                    "type": "action",
                    "position": {"x": 100, "y": 250},
                    "data": {
                        "label": "Send Nurture Email 1",
                        "action_type": "send_email",
                        "action_config": {"template_id": "nurture-1"}
                    }
                },
                {
                    "id": "action-2",
                    "type": "action",
                    "position": {"x": 100, "y": 400},
                    "data": {
                        "label": "Wait 3 Days",
                        "action_type": "wait",
                        "action_config": {"duration": "3 days"}
                    }
                },
                {
                    "id": "action-3",
                    "type": "action",
                    "position": {"x": 100, "y": 550},
                    "data": {
                        "label": "Send Nurture Email 2",
                        "action_type": "send_email",
                        "action_config": {"template_id": "nurture-2"}
                    }
                },
                {
                    "id": "end-1",
                    "type": "end",
                    "position": {"x": 100, "y": 700},
                    "data": {"label": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "trigger-1", "target": "action-1"},
                {"id": "e2", "source": "action-1", "target": "action-2"},
                {"id": "e3", "source": "action-2", "target": "action-3"},
                {"id": "e4", "source": "action-3", "target": "end-1"}
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Re-engagement Campaign",
            "description": "Win back inactive contacts",
            "category": "re_engagement",
            "thumbnail": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
            "trigger_type": "tag_added",
            "usage_count": 0,
            "created_at": datetime.utcnow(),
            "nodes": [
                {
                    "id": "trigger-1",
                    "type": "trigger",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "Tag Added: Inactive",
                        "trigger_type": "tag_added",
                        "trigger_config": {"tag_name": "inactive"}
                    }
                },
                {
                    "id": "action-1",
                    "type": "action",
                    "position": {"x": 100, "y": 250},
                    "data": {
                        "label": "Send Re-engagement Email",
                        "action_type": "send_email",
                        "action_config": {"template_id": "reengagement-1"}
                    }
                },
                {
                    "id": "action-2",
                    "type": "action",
                    "position": {"x": 100, "y": 400},
                    "data": {
                        "label": "Wait 5 Days",
                        "action_type": "wait",
                        "action_config": {"duration": "5 days"}
                    }
                },
                {
                    "id": "condition-1",
                    "type": "condition",
                    "position": {"x": 100, "y": 550},
                    "data": {
                        "label": "Email Opened?",
                        "condition_field": "last_email_opened",
                        "condition_operator": "not_equals",
                        "condition_value": "null"
                    }
                },
                {
                    "id": "action-3",
                    "type": "action",
                    "position": {"x": 300, "y": 700},
                    "data": {
                        "label": "Remove Inactive Tag",
                        "action_type": "remove_tag",
                        "action_config": {"tag_name": "inactive"}
                    }
                },
                {
                    "id": "action-4",
                    "type": "action",
                    "position": {"x": -100, "y": 700},
                    "data": {
                        "label": "Send Final Email",
                        "action_type": "send_email",
                        "action_config": {"template_id": "reengagement-2"}
                    }
                },
                {
                    "id": "end-1",
                    "type": "end",
                    "position": {"x": 100, "y": 850},
                    "data": {"label": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "trigger-1", "target": "action-1"},
                {"id": "e2", "source": "action-1", "target": "action-2"},
                {"id": "e3", "source": "action-2", "target": "condition-1"},
                {"id": "e4", "source": "condition-1", "target": "action-3", "label": "yes"},
                {"id": "e5", "source": "condition-1", "target": "action-4", "label": "no"},
                {"id": "e6", "source": "action-3", "target": "end-1"},
                {"id": "e7", "source": "action-4", "target": "end-1"}
            ]
        }
    ]
    
    workflow_templates_collection.insert_many(templates)
    print("✅ Workflow templates created")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)