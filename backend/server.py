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
    FunnelTemplate, TrackVisitRequest, FormSubmissionRequest, FunnelAnalyticsRequest
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
    funnel_visits_collection, funnel_conversions_collection
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)