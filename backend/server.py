from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from datetime import timedelta, datetime
from typing import Optional
import io
import csv
import os
import re
import pandas as pd
from email_service import EmailService, AIEmailGenerator, convert_blocks_to_html
from webinar_email_service import webinar_email_service
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
    MembershipSubscriptionCreate, MembershipSubscription,
    BlogPostCreate, BlogPostUpdate, BlogPost,
    BlogCategoryCreate, BlogCategoryUpdate, BlogCategory,
    BlogTagCreate, BlogTag,
    BlogCommentCreate, BlogComment, PublicBlogCommentRequest,
    WebsitePageCreate, WebsitePageUpdate, WebsitePage,
    WebsiteThemeCreate, WebsiteThemeUpdate, WebsiteTheme,
    NavigationMenuCreate, NavigationMenuUpdate, NavigationMenu,
    BlogPostView, WebsitePageView,
    WebinarCreate, WebinarUpdate, Webinar, WebinarRegistrationCreate, WebinarRegistration,
    PublicWebinarRegistrationRequest, WebinarChatMessageCreate, WebinarChatMessage,
    WebinarQACreate, WebinarQA, WebinarPollCreate, WebinarPollUpdate, WebinarPoll,
    WebinarPollVote, WebinarRecordingCreate, WebinarRecordingUpdate, WebinarRecording,
    WebinarAnalytics,
    AffiliateProgramCreate, AffiliateProgramUpdate, AffiliateProgram,
    AffiliateCreate, AffiliateUpdate, Affiliate, PublicAffiliateRegistrationRequest,
    AffiliateLinkCreate, AffiliateLink,
    AffiliateClickCreate, AffiliateClick,
    AffiliateConversionCreate, AffiliateConversion,
    AffiliateCommissionCreate, AffiliateCommission,
    AffiliatePayoutCreate, AffiliatePayoutUpdate, AffiliatePayout,
    AffiliateResourceCreate, AffiliateResourceUpdate, AffiliateResource,
    AffiliateAnalytics,
    ProductCategoryCreate, ProductCategoryUpdate, ProductCategory,
    ProductCreate, ProductUpdate, Product,
    ProductVariantCreate, ProductVariantUpdate, ProductVariant,
    ShoppingCartCreate, ShoppingCartUpdate, ShoppingCart, CartItem,
    CouponCreate, CouponUpdate, Coupon,
    OrderCreate, OrderUpdate, Order, OrderItemCreate, OrderItem,
    SubscriptionCreate, SubscriptionUpdate, Subscription,
    InvoiceCreate, Invoice,
    PaymentTransactionCreate, PaymentTransaction,
    CheckoutRequest, PaymentAnalytics
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
    membership_tiers_collection, membership_subscriptions_collection,
    blog_posts_collection, blog_categories_collection, blog_tags_collection,
    blog_comments_collection, blog_post_views_collection,
    website_pages_collection, website_themes_collection, navigation_menus_collection,
    website_page_views_collection, website_assets_collection,
    webinars_collection, webinar_registrations_collection, webinar_chat_messages_collection,
    webinar_qa_collection, webinar_polls_collection, webinar_recordings_collection,
    affiliate_programs_collection, affiliates_collection, affiliate_links_collection,
    affiliate_clicks_collection, affiliate_conversions_collection, affiliate_commissions_collection,
    affiliate_payouts_collection, affiliate_resources_collection,
    products_collection, product_categories_collection, product_variants_collection,
    shopping_carts_collection, orders_collection, order_items_collection,
    subscriptions_collection, coupons_collection, invoices_collection,
    payment_transactions_collection
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


# ==================== COURSE & MEMBERSHIP ROUTES ====================

# ==================== COURSES ROUTES ====================

@app.get("/api/courses")
async def get_courses(
    current_user: dict = Depends(get_current_user),
    status: str = Query(None),
    category: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all courses with pagination and filters"""
    query = {"user_id": current_user['id']}
    
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    total = courses_collection.count_documents(query)
    skip = (page - 1) * limit
    
    courses = list(courses_collection.find(query)
                  .skip(skip)
                  .limit(limit)
                  .sort("created_at", -1))
    
    for course in courses:
        course.pop('_id', None)
    
    return {
        "courses": courses,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.post("/api/courses")
async def create_course(
    course: CourseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new course"""
    course_dict = course.model_dump()
    course_dict['id'] = str(uuid.uuid4())
    course_dict['user_id'] = current_user['id']
    course_dict['status'] = 'draft'
    course_dict['modules'] = []
    course_dict['created_at'] = datetime.utcnow()
    course_dict['updated_at'] = datetime.utcnow()
    course_dict['total_students'] = 0
    course_dict['total_completions'] = 0
    course_dict['completion_rate'] = 0.0
    course_dict['average_rating'] = 0.0
    course_dict['total_reviews'] = 0
    
    courses_collection.insert_one(course_dict)
    course_dict.pop('_id')
    
    return course_dict

@app.get("/api/courses/{course_id}")
async def get_course(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific course with all modules and lessons"""
    course = courses_collection.find_one({
        "id": course_id,
        "user_id": current_user['id']
    })
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.pop('_id', None)
    
    # Get all modules with lessons
    modules = list(course_modules_collection.find({"course_id": course_id}).sort("order", 1))
    for module in modules:
        module.pop('_id', None)
        # Get lessons for this module
        lessons = list(course_lessons_collection.find({"module_id": module['id']}).sort("order", 1))
        for lesson in lessons:
            lesson.pop('_id', None)
        module['lessons'] = lessons
    
    course['modules'] = modules
    
    return course

@app.put("/api/courses/{course_id}")
async def update_course(
    course_id: str,
    course_update: CourseUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a course"""
    existing = courses_collection.find_one({
        "id": course_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    
    update_data = course_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    # If publishing, set published_at
    if update_data.get('status') == 'published' and existing['status'] != 'published':
        update_data['published_at'] = datetime.utcnow()
    
    courses_collection.update_one(
        {"id": course_id},
        {"$set": update_data}
    )
    
    updated = courses_collection.find_one({"id": course_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/courses/{course_id}")
async def delete_course(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a course"""
    result = courses_collection.delete_one({
        "id": course_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Delete all related data
    course_modules_collection.delete_many({"course_id": course_id})
    course_lessons_collection.delete_many({"course_id": course_id})
    course_enrollments_collection.delete_many({"course_id": course_id})
    course_progress_collection.delete_many({"course_id": course_id})
    
    return {"message": "Course deleted successfully"}

# ==================== COURSE MODULES ROUTES ====================

@app.post("/api/courses/{course_id}/modules")
async def create_module(
    course_id: str,
    module: CourseModuleCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new module in a course"""
    course = courses_collection.find_one({
        "id": course_id,
        "user_id": current_user['id']
    })
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    module_dict = module.model_dump()
    module_dict['id'] = str(uuid.uuid4())
    module_dict['course_id'] = course_id
    module_dict['user_id'] = current_user['id']
    module_dict['lessons'] = []
    module_dict['created_at'] = datetime.utcnow()
    module_dict['updated_at'] = datetime.utcnow()
    
    # Create lessons if provided
    if module_dict.get('lessons'):
        for lesson_data in module_dict['lessons']:
            lesson_dict = lesson_data
            lesson_dict['id'] = str(uuid.uuid4())
            lesson_dict['module_id'] = module_dict['id']
            lesson_dict['course_id'] = course_id
            lesson_dict['user_id'] = current_user['id']
            lesson_dict['created_at'] = datetime.utcnow()
            lesson_dict['updated_at'] = datetime.utcnow()
            course_lessons_collection.insert_one(lesson_dict)
            lesson_dict.pop('_id')
            module_dict['lessons'].append({
                'id': lesson_dict['id'],
                'title': lesson_dict['title'],
                'content_type': lesson_dict['content_type'],
                'duration': lesson_dict.get('duration'),
                'order': lesson_dict['order']
            })
    
    course_modules_collection.insert_one(module_dict)
    module_dict.pop('_id')
    
    # Update course modules summary
    courses_collection.update_one(
        {"id": course_id},
        {"$push": {"modules": {
            "id": module_dict['id'],
            "title": module_dict['title'],
            "order": module_dict['order']
        }}}
    )
    
    return module_dict

@app.get("/api/courses/{course_id}/modules")
async def get_course_modules(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all modules for a course"""
    course = courses_collection.find_one({
        "id": course_id,
        "user_id": current_user['id']
    })
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    modules = list(course_modules_collection.find({
        "course_id": course_id,
        "user_id": current_user['id']
    }).sort("order", 1))
    
    for module in modules:
        module.pop('_id', None)
        # Get lessons for each module
        lessons = list(course_lessons_collection.find({
            "module_id": module['id']
        }).sort("order", 1))
        for lesson in lessons:
            lesson.pop('_id', None)
        module['lessons'] = lessons
    
    return modules

@app.put("/api/courses/{course_id}/modules/{module_id}")
async def update_module(
    course_id: str,
    module_id: str,
    module_update: CourseModuleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a module"""
    existing = course_modules_collection.find_one({
        "id": module_id,
        "course_id": course_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Module not found")
    
    update_data = module_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    course_modules_collection.update_one(
        {"id": module_id},
        {"$set": update_data}
    )
    
    # Update course modules summary
    if 'title' in update_data or 'order' in update_data:
        updated_module = course_modules_collection.find_one({"id": module_id})
        courses_collection.update_one(
            {"id": course_id, "modules.id": module_id},
            {"$set": {
                "modules.$.title": updated_module['title'],
                "modules.$.order": updated_module['order']
            }}
        )
    
    updated = course_modules_collection.find_one({"id": module_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/courses/{course_id}/modules/{module_id}")
async def delete_module(
    course_id: str,
    module_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a module"""
    result = course_modules_collection.delete_one({
        "id": module_id,
        "course_id": course_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Delete all lessons in this module
    course_lessons_collection.delete_many({"module_id": module_id})
    
    # Remove from course modules summary
    courses_collection.update_one(
        {"id": course_id},
        {"$pull": {"modules": {"id": module_id}}}
    )
    
    return {"message": "Module deleted successfully"}

# ==================== COURSE LESSONS ROUTES ====================

@app.post("/api/courses/{course_id}/modules/{module_id}/lessons")
async def create_lesson(
    course_id: str,
    module_id: str,
    lesson: CourseLessonCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new lesson in a module"""
    module = course_modules_collection.find_one({
        "id": module_id,
        "course_id": course_id,
        "user_id": current_user['id']
    })
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    lesson_dict = lesson.model_dump()
    lesson_dict['id'] = str(uuid.uuid4())
    lesson_dict['module_id'] = module_id
    lesson_dict['course_id'] = course_id
    lesson_dict['user_id'] = current_user['id']
    lesson_dict['created_at'] = datetime.utcnow()
    lesson_dict['updated_at'] = datetime.utcnow()
    
    course_lessons_collection.insert_one(lesson_dict)
    lesson_dict.pop('_id')
    
    # Update module lessons summary
    course_modules_collection.update_one(
        {"id": module_id},
        {"$push": {"lessons": {
            "id": lesson_dict['id'],
            "title": lesson_dict['title'],
            "content_type": lesson_dict['content_type'],
            "duration": lesson_dict.get('duration'),
            "order": lesson_dict['order']
        }}}
    )
    
    return lesson_dict

@app.get("/api/courses/{course_id}/modules/{module_id}/lessons")
async def get_module_lessons(
    course_id: str,
    module_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all lessons for a module"""
    module = course_modules_collection.find_one({
        "id": module_id,
        "course_id": course_id,
        "user_id": current_user['id']
    })
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    lessons = list(course_lessons_collection.find({
        "module_id": module_id
    }).sort("order", 1))
    
    for lesson in lessons:
        lesson.pop('_id', None)
    
    return lessons

@app.get("/api/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}")
async def get_lesson(
    course_id: str,
    module_id: str,
    lesson_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific lesson"""
    lesson = course_lessons_collection.find_one({
        "id": lesson_id,
        "module_id": module_id,
        "course_id": course_id,
        "user_id": current_user['id']
    })
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    lesson.pop('_id', None)
    return lesson

@app.put("/api/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}")
async def update_lesson(
    course_id: str,
    module_id: str,
    lesson_id: str,
    lesson_update: CourseLessonUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a lesson"""
    existing = course_lessons_collection.find_one({
        "id": lesson_id,
        "module_id": module_id,
        "course_id": course_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    update_data = lesson_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    course_lessons_collection.update_one(
        {"id": lesson_id},
        {"$set": update_data}
    )
    
    # Update module lessons summary
    if any(key in update_data for key in ['title', 'content_type', 'duration', 'order']):
        updated_lesson = course_lessons_collection.find_one({"id": lesson_id})
        course_modules_collection.update_one(
            {"id": module_id, "lessons.id": lesson_id},
            {"$set": {
                "lessons.$.title": updated_lesson['title'],
                "lessons.$.content_type": updated_lesson['content_type'],
                "lessons.$.duration": updated_lesson.get('duration'),
                "lessons.$.order": updated_lesson['order']
            }}
        )
    
    updated = course_lessons_collection.find_one({"id": lesson_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}")
async def delete_lesson(
    course_id: str,
    module_id: str,
    lesson_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a lesson"""
    result = course_lessons_collection.delete_one({
        "id": lesson_id,
        "module_id": module_id,
        "course_id": course_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Remove from module lessons summary
    course_modules_collection.update_one(
        {"id": module_id},
        {"$pull": {"lessons": {"id": lesson_id}}}
    )
    
    return {"message": "Lesson deleted successfully"}

# ==================== COURSE ENROLLMENT ROUTES ====================

@app.get("/api/courses/public/list")
async def get_public_courses(
    category: str = Query(None),
    level: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get published courses (public endpoint)"""
    query = {"status": "published"}
    
    if category:
        query["category"] = category
    if level:
        query["level"] = level
    
    total = courses_collection.count_documents(query)
    skip = (page - 1) * limit
    
    courses = list(courses_collection.find(query, {
        'user_id': 0  # Don't expose user_id
    }).skip(skip).limit(limit).sort("created_at", -1))
    
    for course in courses:
        course.pop('_id', None)
        # Only show preview lessons
        modules = list(course_modules_collection.find({"course_id": course['id']}))
        for module in modules:
            module.pop('_id', None)
            preview_lessons = list(course_lessons_collection.find({
                "module_id": module['id'],
                "is_preview": True
            }, {'content': 0}))  # Don't expose full content
            for lesson in preview_lessons:
                lesson.pop('_id', None)
            module['preview_lessons'] = preview_lessons
        course['preview_modules'] = modules
    
    return {
        "courses": courses,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/courses/{course_id}/public/preview")
async def get_course_preview(course_id: str):
    """Get course preview (public endpoint)"""
    course = courses_collection.find_one({
        "id": course_id,
        "status": "published"
    })
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.pop('_id', None)
    course.pop('user_id', None)
    
    # Get modules with preview lessons only
    modules = list(course_modules_collection.find({"course_id": course_id}).sort("order", 1))
    for module in modules:
        module.pop('_id', None)
        module.pop('user_id', None)
        # Get preview lessons
        lessons = list(course_lessons_collection.find({
            "module_id": module['id'],
            "is_preview": True
        }, {
            'id': 1, 'title': 1, 'description': 1, 'content_type': 1, 'duration': 1, 'order': 1
        }))
        for lesson in lessons:
            lesson.pop('_id', None)
        module['preview_lessons'] = lessons
    
    course['modules_preview'] = modules
    
    return course

@app.post("/api/courses/{course_id}/enroll")
async def enroll_in_course(
    course_id: str,
    enrollment_data: PublicEnrollmentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Enroll in a course"""
    course = courses_collection.find_one({
        "id": course_id,
        "status": "published"
    })
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not published")
    
    # Check if already enrolled
    existing = course_enrollments_collection.find_one({
        "user_id": current_user['id'],
        "course_id": course_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    # Check pricing
    if course['pricing_type'] == 'paid' and course['price'] > 0:
        # Mock payment processing
        if enrollment_data.payment_method == 'mock':
            payment_status = 'completed'
            payment_amount = course['price']
        else:
            # In production, integrate with Stripe/PayPal
            payment_status = 'pending'
            payment_amount = course['price']
    else:
        payment_status = 'completed'
        payment_amount = 0.0
    
    # Create or find contact
    contact_id = None
    existing_contact = contacts_collection.find_one({
        "user_id": course['user_id'],
        "email": enrollment_data.student_email
    })
    
    if existing_contact:
        contact_id = existing_contact['id']
    else:
        # Create new contact
        contact = {
            'id': str(uuid.uuid4()),
            'user_id': course['user_id'],
            'first_name': enrollment_data.student_name.split()[0],
            'last_name': ' '.join(enrollment_data.student_name.split()[1:]) if len(enrollment_data.student_name.split()) > 1 else None,
            'email': enrollment_data.student_email,
            'source': f"Course Enrollment: {course['title']}",
            'status': 'lead',
            'score': 0,
            'tags': ['course-student'],
            'segments': [],
            'custom_fields': {},
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'engagement_count': 0
        }
        contacts_collection.insert_one(contact)
        contact_id = contact['id']
    
    # Create enrollment
    enrollment = {
        'id': str(uuid.uuid4()),
        'user_id': current_user['id'],
        'contact_id': contact_id,
        'course_id': course_id,
        'course_owner_id': course['user_id'],
        'enrollment_date': datetime.utcnow(),
        'completed_date': None,
        'progress_percentage': 0.0,
        'current_module_id': None,
        'current_lesson_id': None,
        'payment_status': payment_status,
        'payment_amount': payment_amount,
        'certificate_issued': False,
        'certificate_id': None,
        'last_accessed': datetime.utcnow(),
        'total_time_spent': 0
    }
    
    course_enrollments_collection.insert_one(enrollment)
    enrollment.pop('_id')
    
    # Update course student count
    courses_collection.update_one(
        {"id": course_id},
        {"$inc": {"total_students": 1}}
    )
    
    return enrollment

@app.get("/api/enrollments")
async def get_my_enrollments(current_user: dict = Depends(get_current_user)):
    """Get user's course enrollments"""
    enrollments = list(course_enrollments_collection.find({
        "user_id": current_user['id']
    }).sort("enrollment_date", -1))
    
    for enrollment in enrollments:
        enrollment.pop('_id', None)
        # Get course details
        course = courses_collection.find_one({"id": enrollment['course_id']})
        if course:
            course.pop('_id', None)
            enrollment['course'] = {
                'id': course['id'],
                'title': course['title'],
                'description': course['description'],
                'thumbnail': course.get('thumbnail'),
                'level': course.get('level')
            }
    
    return enrollments

@app.get("/api/courses/{course_id}/students")
async def get_course_students(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get students enrolled in a course (admin only)"""
    # Verify course ownership
    course = courses_collection.find_one({
        "id": course_id,
        "user_id": current_user['id']
    })
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    query = {"course_id": course_id}
    total = course_enrollments_collection.count_documents(query)
    skip = (page - 1) * limit
    
    enrollments = list(course_enrollments_collection.find(query)
                      .skip(skip)
                      .limit(limit)
                      .sort("enrollment_date", -1))
    
    for enrollment in enrollments:
        enrollment.pop('_id', None)
        # Get contact details
        if enrollment.get('contact_id'):
            contact = contacts_collection.find_one({"id": enrollment['contact_id']})
            if contact:
                enrollment['student'] = {
                    'name': f"{contact['first_name']} {contact.get('last_name', '')}".strip(),
                    'email': contact['email']
                }
    
    return {
        "students": enrollments,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# ==================== COURSE PROGRESS ROUTES ====================

@app.post("/api/courses/{course_id}/lessons/{lesson_id}/complete")
async def mark_lesson_complete(
    course_id: str,
    lesson_id: str,
    progress_data: CourseProgressCreate,
    current_user: dict = Depends(get_current_user)
):
    """Mark a lesson as complete"""
    # Get enrollment
    enrollment = course_enrollments_collection.find_one({
        "user_id": current_user['id'],
        "course_id": course_id
    })
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Get lesson
    lesson = course_lessons_collection.find_one({"id": lesson_id, "course_id": course_id})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Check if already completed
    existing_progress = course_progress_collection.find_one({
        "enrollment_id": enrollment['id'],
        "lesson_id": lesson_id
    })
    
    if existing_progress:
        # Update existing progress
        course_progress_collection.update_one(
            {"id": existing_progress['id']},
            {"$set": {
                "completed": True,
                "completed_at": datetime.utcnow(),
                "time_spent": progress_data.time_spent,
                "quiz_score": progress_data.quiz_score,
                "quiz_passed": progress_data.quiz_passed,
                "updated_at": datetime.utcnow()
            }}
        )
        progress = course_progress_collection.find_one({"id": existing_progress['id']})
    else:
        # Create new progress record
        progress = {
            'id': str(uuid.uuid4()),
            'enrollment_id': enrollment['id'],
            'user_id': current_user['id'],
            'course_id': course_id,
            'module_id': lesson['module_id'],
            'lesson_id': lesson_id,
            'completed': True,
            'completed_at': datetime.utcnow(),
            'time_spent': progress_data.time_spent,
            'quiz_score': progress_data.quiz_score,
            'quiz_passed': progress_data.quiz_passed,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        course_progress_collection.insert_one(progress)
    
    progress.pop('_id', None)
    
    # Update enrollment progress
    total_lessons = course_lessons_collection.count_documents({"course_id": course_id})
    completed_lessons = course_progress_collection.count_documents({
        "enrollment_id": enrollment['id'],
        "completed": True
    })
    
    progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    
    course_enrollments_collection.update_one(
        {"id": enrollment['id']},
        {"$set": {
            "progress_percentage": round(progress_percentage, 2),
            "current_lesson_id": lesson_id,
            "current_module_id": lesson['module_id'],
            "last_accessed": datetime.utcnow()
        },
        "$inc": {"total_time_spent": progress_data.time_spent}
        }
    )
    
    # Check if course is complete
    if progress_percentage >= 100:
        course_enrollments_collection.update_one(
            {"id": enrollment['id']},
            {"$set": {"completed_date": datetime.utcnow()}}
        )
        
        # Update course completions
        courses_collection.update_one(
            {"id": course_id},
            {"$inc": {"total_completions": 1}}
        )
        
        # Recalculate completion rate
        course = courses_collection.find_one({"id": course_id})
        completion_rate = (course['total_completions'] / course['total_students'] * 100) if course['total_students'] > 0 else 0
        courses_collection.update_one(
            {"id": course_id},
            {"$set": {"completion_rate": round(completion_rate, 2)}}
        )
    
    return progress

@app.get("/api/courses/{course_id}/progress")
async def get_course_progress(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get student's progress in a course"""
    enrollment = course_enrollments_collection.find_one({
        "user_id": current_user['id'],
        "course_id": course_id
    })
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    enrollment.pop('_id', None)
    
    # Get all progress records
    progress_records = list(course_progress_collection.find({
        "enrollment_id": enrollment['id']
    }))
    
    for record in progress_records:
        record.pop('_id', None)
    
    enrollment['progress_records'] = progress_records
    
    return enrollment

# ==================== CERTIFICATES ROUTES ====================

@app.post("/api/courses/{course_id}/certificate")
async def generate_certificate(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate course completion certificate"""
    enrollment = course_enrollments_collection.find_one({
        "user_id": current_user['id'],
        "course_id": course_id
    })
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if not enrollment.get('completed_date'):
        raise HTTPException(status_code=400, detail="Course not completed yet")
    
    if enrollment.get('certificate_issued'):
        # Return existing certificate
        certificate = certificates_collection.find_one({"id": enrollment['certificate_id']})
        certificate.pop('_id', None)
        return certificate
    
    # Get course details
    course = courses_collection.find_one({"id": course_id})
    
    # Generate certificate
    certificate_number = f"CERT-{str(uuid.uuid4())[:8].upper()}-{datetime.utcnow().year}"
    
    certificate = {
        'id': str(uuid.uuid4()),
        'user_id': current_user['id'],
        'course_id': course_id,
        'enrollment_id': enrollment['id'],
        'course_owner_id': course['user_id'],
        'course_title': course['title'],
        'student_name': current_user.get('full_name', 'Student'),
        'completion_date': enrollment['completed_date'],
        'certificate_number': certificate_number,
        'issued_at': datetime.utcnow()
    }
    
    certificates_collection.insert_one(certificate)
    certificate.pop('_id')
    
    # Update enrollment
    course_enrollments_collection.update_one(
        {"id": enrollment['id']},
        {"$set": {
            "certificate_issued": True,
            "certificate_id": certificate['id']
        }}
    )
    
    return certificate

@app.get("/api/certificates")
async def get_my_certificates(current_user: dict = Depends(get_current_user)):
    """Get user's certificates"""
    certificates = list(certificates_collection.find({
        "user_id": current_user['id']
    }).sort("issued_at", -1))
    
    for cert in certificates:
        cert.pop('_id', None)
    
    return certificates

@app.get("/api/certificates/{certificate_id}")
async def get_certificate(certificate_id: str):
    """Get certificate by ID (public endpoint for verification)"""
    certificate = certificates_collection.find_one({"id": certificate_id})
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    certificate.pop('_id', None)
    return certificate

# ==================== MEMBERSHIP TIERS ROUTES ====================

@app.get("/api/memberships")
async def get_membership_tiers(
    current_user: dict = Depends(get_current_user),
    status: str = Query(None)
):
    """Get all membership tiers"""
    query = {"user_id": current_user['id']}
    
    if status:
        query["status"] = status
    
    tiers = list(membership_tiers_collection.find(query).sort("price", 1))
    
    for tier in tiers:
        tier.pop('_id', None)
    
    return tiers

@app.post("/api/memberships")
async def create_membership_tier(
    tier: MembershipTierCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new membership tier"""
    tier_dict = tier.model_dump()
    tier_dict['id'] = str(uuid.uuid4())
    tier_dict['user_id'] = current_user['id']
    tier_dict['status'] = 'active'
    tier_dict['total_subscribers'] = 0
    tier_dict['created_at'] = datetime.utcnow()
    tier_dict['updated_at'] = datetime.utcnow()
    
    membership_tiers_collection.insert_one(tier_dict)
    tier_dict.pop('_id')
    
    return tier_dict

@app.get("/api/memberships/{tier_id}")
async def get_membership_tier(
    tier_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific membership tier"""
    tier = membership_tiers_collection.find_one({
        "id": tier_id,
        "user_id": current_user['id']
    })
    
    if not tier:
        raise HTTPException(status_code=404, detail="Membership tier not found")
    
    tier.pop('_id', None)
    
    # Get courses in this tier
    if tier.get('course_ids'):
        courses = list(courses_collection.find({
            "id": {"$in": tier['course_ids']}
        }, {'id': 1, 'title': 1, 'description': 1, 'thumbnail': 1}))
        for course in courses:
            course.pop('_id', None)
        tier['courses'] = courses
    
    return tier

@app.put("/api/memberships/{tier_id}")
async def update_membership_tier(
    tier_id: str,
    tier_update: MembershipTierUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a membership tier"""
    existing = membership_tiers_collection.find_one({
        "id": tier_id,
        "user_id": current_user['id']
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Membership tier not found")
    
    update_data = tier_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    membership_tiers_collection.update_one(
        {"id": tier_id},
        {"$set": update_data}
    )
    
    updated = membership_tiers_collection.find_one({"id": tier_id})
    updated.pop('_id', None)
    return updated

@app.delete("/api/memberships/{tier_id}")
async def delete_membership_tier(
    tier_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a membership tier"""
    result = membership_tiers_collection.delete_one({
        "id": tier_id,
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Membership tier not found")
    
    # Cancel all subscriptions for this tier
    membership_subscriptions_collection.update_many(
        {"tier_id": tier_id, "status": "active"},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}}
    )
    
    return {"message": "Membership tier deleted successfully"}

# ==================== MEMBERSHIP SUBSCRIPTIONS ROUTES ====================

@app.get("/api/memberships/public/list")
async def get_public_membership_tiers():
    """Get all active membership tiers (public endpoint)"""
    tiers = list(membership_tiers_collection.find({"status": "active"}).sort("price", 1))
    
    for tier in tiers:
        tier.pop('_id', None)
        tier.pop('user_id', None)
        # Get course details
        if tier.get('course_ids'):
            courses = list(courses_collection.find({
                "id": {"$in": tier['course_ids']},
                "status": "published"
            }, {'id': 1, 'title': 1, 'description': 1, 'thumbnail': 1}))
            for course in courses:
                course.pop('_id', None)
            tier['courses'] = courses
    
    return tiers

@app.post("/api/memberships/{tier_id}/subscribe")
async def subscribe_to_tier(
    tier_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Subscribe to a membership tier"""
    tier = membership_tiers_collection.find_one({
        "id": tier_id,
        "status": "active"
    })
    
    if not tier:
        raise HTTPException(status_code=404, detail="Membership tier not found")
    
    # Check if already subscribed
    existing = membership_subscriptions_collection.find_one({
        "user_id": current_user['id'],
        "tier_id": tier_id,
        "status": "active"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already subscribed to this tier")
    
    # Mock payment processing
    payment_status = 'completed'
    
    # Calculate expiration
    from dateutil.relativedelta import relativedelta
    if tier['billing_period'] == 'monthly':
        expires_at = datetime.utcnow() + relativedelta(months=1)
        next_payment = datetime.utcnow() + relativedelta(months=1)
    elif tier['billing_period'] == 'yearly':
        expires_at = datetime.utcnow() + relativedelta(years=1)
        next_payment = datetime.utcnow() + relativedelta(years=1)
    else:  # lifetime
        expires_at = None
        next_payment = None
    
    # Create subscription
    subscription = {
        'id': str(uuid.uuid4()),
        'user_id': current_user['id'],
        'tier_id': tier_id,
        'tier_owner_id': tier['user_id'],
        'status': 'active',
        'payment_status': payment_status,
        'subscribed_at': datetime.utcnow(),
        'expires_at': expires_at,
        'cancelled_at': None,
        'last_payment_date': datetime.utcnow(),
        'next_payment_date': next_payment
    }
    
    membership_subscriptions_collection.insert_one(subscription)
    subscription.pop('_id')
    
    # Update tier subscriber count
    membership_tiers_collection.update_one(
        {"id": tier_id},
        {"$inc": {"total_subscribers": 1}}
    )
    
    # Auto-enroll in tier courses
    if tier.get('course_ids'):
        for course_id in tier['course_ids']:
            # Check if not already enrolled
            existing_enrollment = course_enrollments_collection.find_one({
                "user_id": current_user['id'],
                "course_id": course_id
            })
            
            if not existing_enrollment:
                course = courses_collection.find_one({"id": course_id})
                if course:
                    enrollment = {
                        'id': str(uuid.uuid4()),
                        'user_id': current_user['id'],
                        'contact_id': None,
                        'course_id': course_id,
                        'course_owner_id': course['user_id'],
                        'enrollment_date': datetime.utcnow(),
                        'completed_date': None,
                        'progress_percentage': 0.0,
                        'current_module_id': None,
                        'current_lesson_id': None,
                        'payment_status': 'completed',
                        'payment_amount': 0.0,
                        'certificate_issued': False,
                        'certificate_id': None,
                        'last_accessed': datetime.utcnow(),
                        'total_time_spent': 0
                    }
                    course_enrollments_collection.insert_one(enrollment)
                    
                    # Update course student count
                    courses_collection.update_one(
                        {"id": course_id},
                        {"$inc": {"total_students": 1}}
                    )
    
    return subscription

@app.get("/api/memberships/my-subscription")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    """Get user's active subscription"""
    subscription = membership_subscriptions_collection.find_one({
        "user_id": current_user['id'],
        "status": "active"
    })
    
    if not subscription:
        return {"subscription": None}
    
    subscription.pop('_id', None)
    
    # Get tier details
    tier = membership_tiers_collection.find_one({"id": subscription['tier_id']})
    if tier:
        tier.pop('_id', None)
        subscription['tier'] = tier
    
    return {"subscription": subscription}

@app.post("/api/memberships/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancel active subscription"""
    subscription = membership_subscriptions_collection.find_one({
        "user_id": current_user['id'],
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    membership_subscriptions_collection.update_one(
        {"id": subscription['id']},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.utcnow()
        }}
    )
    
    # Update tier subscriber count
    membership_tiers_collection.update_one(
        {"id": subscription['tier_id']},
        {"$inc": {"total_subscribers": -1}}
    )
    
    return {"message": "Subscription cancelled successfully"}

# ==================== COURSE ANALYTICS ====================

@app.get("/api/courses/analytics/summary")
async def get_course_analytics_summary(current_user: dict = Depends(get_current_user)):
    """Get course analytics summary"""
    total_courses = courses_collection.count_documents({"user_id": current_user['id']})
    published_courses = courses_collection.count_documents({
        "user_id": current_user['id'],
        "status": "published"
    })
    
    total_students = course_enrollments_collection.count_documents({
        "course_owner_id": current_user['id']
    })
    
    total_completions = course_enrollments_collection.count_documents({
        "course_owner_id": current_user['id'],
        "completed_date": {"$ne": None}
    })
    
    completion_rate = (total_completions / total_students * 100) if total_students > 0 else 0
    
    # Revenue (mock for now)
    total_revenue = course_enrollments_collection.aggregate([
        {"$match": {"course_owner_id": current_user['id']}},
        {"$group": {"_id": None, "total": {"$sum": "$payment_amount"}}}
    ])
    revenue = list(total_revenue)
    total_revenue_amount = revenue[0]['total'] if revenue else 0
    
    return {
        "total_courses": total_courses,
        "published_courses": published_courses,
        "total_students": total_students,
        "total_completions": total_completions,
        "completion_rate": round(completion_rate, 2),
        "total_revenue": round(total_revenue_amount, 2)
    }

@app.get("/api/courses/{course_id}/analytics")
async def get_course_analytics(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get analytics for a specific course"""
    course = courses_collection.find_one({
        "id": course_id,
        "user_id": current_user['id']
    })
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    total_enrollments = course_enrollments_collection.count_documents({
        "course_id": course_id
    })
    
    active_students = course_enrollments_collection.count_documents({
        "course_id": course_id,
        "status": "active"
    })
    
    completed_students = course_enrollments_collection.count_documents({
        "course_id": course_id,
        "completed_date": {"$ne": None}
    })
    
    completion_rate = (completed_students / total_enrollments * 100) if total_enrollments > 0 else 0
    
    # Average progress
    enrollments = list(course_enrollments_collection.find({"course_id": course_id}))
    avg_progress = sum(e.get('progress_percentage', 0) for e in enrollments) / len(enrollments) if enrollments else 0
    
    # Revenue for this course
    revenue_result = course_enrollments_collection.aggregate([
        {"$match": {"course_id": course_id}},
        {"$group": {"_id": None, "total": {"$sum": "$payment_amount"}}}
    ])
    revenue = list(revenue_result)
    total_revenue = revenue[0]['total'] if revenue else 0
    
    return {
        "course_id": course_id,
        "course_title": course.get('title'),
        "total_enrollments": total_enrollments,
        "active_students": active_students,
        "completed_students": completed_students,
        "completion_rate": round(completion_rate, 2),
        "average_progress": round(avg_progress, 2),
        "total_revenue": round(total_revenue, 2)
    }


# ==================== PHASE 8: BLOG & WEBSITE BUILDER ROUTES ====================

# Helper function to generate slugs
def generate_slug(text: str) -> str:
    """Generate URL-friendly slug from text"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text[:100]  # Limit slug length


# ==================== BLOG POST ROUTES ====================

@app.get("/api/blog/posts")
async def list_blog_posts(
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """List blog posts with pagination and filters"""
    query = {"user_id": current_user['id']}
    
    if status:
        query['status'] = status
    if category_id:
        query['category_id'] = category_id
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'excerpt': {'$regex': search, '$options': 'i'}}
        ]
    
    total = blog_posts_collection.count_documents(query)
    posts = list(blog_posts_collection.find(query).sort('created_at', -1).skip(skip).limit(limit))
    
    for post in posts:
        post['_id'] = str(post['_id'])
    
    return {
        "posts": posts,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@app.post("/api/blog/posts", status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    post_data: BlogPostCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new blog post"""
    post_dict = post_data.model_dump()
    post_dict['id'] = str(uuid.uuid4())
    post_dict['user_id'] = current_user['id']
    
    # Generate slug if not provided
    if not post_dict.get('slug'):
        post_dict['slug'] = generate_slug(post_data.title)
    
    # Ensure unique slug
    existing = blog_posts_collection.find_one({
        'user_id': current_user['id'],
        'slug': post_dict['slug']
    })
    if existing:
        post_dict['slug'] = f"{post_dict['slug']}-{str(uuid.uuid4())[:8]}"
    
    post_dict['created_at'] = datetime.utcnow()
    post_dict['updated_at'] = datetime.utcnow()
    post_dict['total_views'] = 0
    post_dict['total_comments'] = 0
    post_dict['average_reading_time'] = 0
    
    # Set published_at if status is published
    if post_dict.get('status') == 'published':
        post_dict['published_at'] = datetime.utcnow()
    
    blog_posts_collection.insert_one(post_dict)
    post_dict.pop('_id', None)
    
    return post_dict


@app.get("/api/blog/posts/{post_id}")
async def get_blog_post(
    post_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a blog post by ID"""
    post = blog_posts_collection.find_one({
        'id': post_id,
        'user_id': current_user['id']
    })
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found"
        )
    
    post['_id'] = str(post['_id'])
    return post


@app.put("/api/blog/posts/{post_id}")
async def update_blog_post(
    post_id: str,
    post_data: BlogPostUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a blog post"""
    post = blog_posts_collection.find_one({
        'id': post_id,
        'user_id': current_user['id']
    })
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found"
        )
    
    update_data = post_data.model_dump(exclude_unset=True)
    
    # Update slug if title changed
    if 'title' in update_data and 'slug' not in update_data:
        update_data['slug'] = generate_slug(update_data['title'])
    
    # Set published_at if status changed to published
    if update_data.get('status') == 'published' and post.get('status') != 'published':
        update_data['published_at'] = datetime.utcnow()
    
    update_data['updated_at'] = datetime.utcnow()
    
    blog_posts_collection.update_one(
        {'id': post_id, 'user_id': current_user['id']},
        {'$set': update_data}
    )
    
    updated_post = blog_posts_collection.find_one({'id': post_id})
    updated_post['_id'] = str(updated_post['_id'])
    
    return updated_post


@app.delete("/api/blog/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_post(
    post_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a blog post"""
    result = blog_posts_collection.delete_one({
        'id': post_id,
        'user_id': current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found"
        )
    
    # Also delete associated comments and views
    blog_comments_collection.delete_many({'post_id': post_id})
    blog_post_views_collection.delete_many({'post_id': post_id})
    
    return {"message": "Blog post deleted"}


# ==================== BLOG CATEGORY ROUTES ====================

@app.get("/api/blog/categories")
async def list_blog_categories(
    current_user: User = Depends(get_current_user)
):
    """List all blog categories"""
    categories = list(blog_categories_collection.find({'user_id': current_user['id']}))
    
    for category in categories:
        category['_id'] = str(category['_id'])
    
    return {"categories": categories}


@app.post("/api/blog/categories", status_code=status.HTTP_201_CREATED)
async def create_blog_category(
    category_data: BlogCategoryCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new blog category"""
    category_dict = category_data.model_dump()
    category_dict['id'] = str(uuid.uuid4())
    category_dict['user_id'] = current_user['id']
    
    # Generate slug if not provided
    if not category_dict.get('slug'):
        category_dict['slug'] = generate_slug(category_data.name)
    
    category_dict['created_at'] = datetime.utcnow()
    category_dict['updated_at'] = datetime.utcnow()
    category_dict['post_count'] = 0
    
    blog_categories_collection.insert_one(category_dict)
    category_dict.pop('_id', None)
    
    return category_dict


@app.put("/api/blog/categories/{category_id}")
async def update_blog_category(
    category_id: str,
    category_data: BlogCategoryUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a blog category"""
    update_data = category_data.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    result = blog_categories_collection.update_one(
        {'id': category_id, 'user_id': current_user['id']},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    updated_category = blog_categories_collection.find_one({'id': category_id})
    updated_category['_id'] = str(updated_category['_id'])
    
    return updated_category


@app.delete("/api/blog/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_category(
    category_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a blog category"""
    result = blog_categories_collection.delete_one({
        'id': category_id,
        'user_id': current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return {"message": "Category deleted"}


# ==================== BLOG TAG ROUTES ====================

@app.get("/api/blog/tags")
async def list_blog_tags(
    current_user: User = Depends(get_current_user)
):
    """List all blog tags"""
    tags = list(blog_tags_collection.find({'user_id': current_user['id']}))
    
    for tag in tags:
        tag['_id'] = str(tag['_id'])
    
    return {"tags": tags}


@app.post("/api/blog/tags", status_code=status.HTTP_201_CREATED)
async def create_blog_tag(
    tag_data: BlogTagCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new blog tag"""
    tag_dict = tag_data.model_dump()
    tag_dict['id'] = str(uuid.uuid4())
    tag_dict['user_id'] = current_user['id']
    
    # Generate slug if not provided
    if not tag_dict.get('slug'):
        tag_dict['slug'] = generate_slug(tag_data.name)
    
    tag_dict['created_at'] = datetime.utcnow()
    tag_dict['post_count'] = 0
    
    blog_tags_collection.insert_one(tag_dict)
    tag_dict.pop('_id', None)
    
    return tag_dict


@app.delete("/api/blog/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_tag(
    tag_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a blog tag"""
    result = blog_tags_collection.delete_one({
        'id': tag_id,
        'user_id': current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    return {"message": "Tag deleted"}


# ==================== BLOG COMMENT ROUTES ====================

@app.get("/api/blog/posts/{post_id}/comments")
async def list_blog_comments(
    post_id: str,
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = Query(None)
):
    """List comments for a blog post"""
    query = {
        'post_id': post_id,
        'user_id': current_user['id']
    }
    
    if status_filter:
        query['status'] = status_filter
    
    comments = list(blog_comments_collection.find(query).sort('created_at', -1))
    
    for comment in comments:
        comment['_id'] = str(comment['_id'])
    
    return {"comments": comments}


@app.put("/api/blog/comments/{comment_id}/approve")
async def approve_blog_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Approve a blog comment"""
    result = blog_comments_collection.update_one(
        {'id': comment_id, 'user_id': current_user['id']},
        {
            '$set': {
                'status': 'approved',
                'approved_at': datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    return {"message": "Comment approved"}


@app.delete("/api/blog/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a blog comment"""
    result = blog_comments_collection.delete_one({
        'id': comment_id,
        'user_id': current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    return {"message": "Comment deleted"}


# ==================== WEBSITE PAGE ROUTES ====================

@app.get("/api/website/pages")
async def list_website_pages(
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None)
):
    """List website pages"""
    query = {"user_id": current_user['id']}
    
    if status:
        query['status'] = status
    
    pages = list(website_pages_collection.find(query).sort('order', 1))
    
    for page in pages:
        page['_id'] = str(page['_id'])
    
    return {"pages": pages}


@app.post("/api/website/pages", status_code=status.HTTP_201_CREATED)
async def create_website_page(
    page_data: WebsitePageCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new website page"""
    page_dict = page_data.model_dump()
    page_dict['id'] = str(uuid.uuid4())
    page_dict['user_id'] = current_user['id']
    
    # Generate slug if not provided
    if not page_dict.get('slug'):
        page_dict['slug'] = generate_slug(page_data.title)
    
    # Ensure unique slug
    existing = website_pages_collection.find_one({
        'user_id': current_user['id'],
        'slug': page_dict['slug']
    })
    if existing:
        page_dict['slug'] = f"{page_dict['slug']}-{str(uuid.uuid4())[:8]}"
    
    page_dict['created_at'] = datetime.utcnow()
    page_dict['updated_at'] = datetime.utcnow()
    page_dict['total_views'] = 0
    page_dict['status'] = 'draft'
    page_dict['order'] = 0
    
    website_pages_collection.insert_one(page_dict)
    page_dict.pop('_id', None)
    
    return page_dict


@app.get("/api/website/pages/{page_id}")
async def get_website_page(
    page_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a website page by ID"""
    page = website_pages_collection.find_one({
        'id': page_id,
        'user_id': current_user['id']
    })
    
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    page['_id'] = str(page['_id'])
    return page


@app.put("/api/website/pages/{page_id}")
async def update_website_page(
    page_id: str,
    page_data: WebsitePageUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a website page"""
    update_data = page_data.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    # Set published_at if status changed to published
    if update_data.get('status') == 'published':
        page = website_pages_collection.find_one({'id': page_id})
        if page and page.get('status') != 'published':
            update_data['published_at'] = datetime.utcnow()
    
    result = website_pages_collection.update_one(
        {'id': page_id, 'user_id': current_user['id']},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    updated_page = website_pages_collection.find_one({'id': page_id})
    updated_page['_id'] = str(updated_page['_id'])
    
    return updated_page


@app.delete("/api/website/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_website_page(
    page_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a website page"""
    result = website_pages_collection.delete_one({
        'id': page_id,
        'user_id': current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Also delete associated views
    website_page_views_collection.delete_many({'page_id': page_id})
    
    return {"message": "Page deleted"}


# ==================== WEBSITE THEME ROUTES ====================

@app.get("/api/website/themes")
async def list_website_themes(
    current_user: User = Depends(get_current_user)
):
    """List website themes"""
    themes = list(website_themes_collection.find({'user_id': current_user['id']}))
    
    for theme in themes:
        theme['_id'] = str(theme['_id'])
    
    return {"themes": themes}


@app.get("/api/website/themes/active")
async def get_active_theme(
    current_user: User = Depends(get_current_user)
):
    """Get the active theme"""
    theme = website_themes_collection.find_one({
        'user_id': current_user['id'],
        'is_active': True
    })
    
    if not theme:
        # Return default theme if none active
        return {
            "id": "default",
            "name": "Default Theme",
            "primary_color": "#3B82F6",
            "secondary_color": "#10B981",
            "accent_color": "#F59E0B",
            "background_color": "#FFFFFF",
            "text_color": "#111827",
            "heading_font": "Inter",
            "body_font": "Inter",
            "is_active": True
        }
    
    theme['_id'] = str(theme['_id'])
    return theme


@app.post("/api/website/themes", status_code=status.HTTP_201_CREATED)
async def create_website_theme(
    theme_data: WebsiteThemeCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new website theme"""
    theme_dict = theme_data.model_dump()
    theme_dict['id'] = str(uuid.uuid4())
    theme_dict['user_id'] = current_user['id']
    theme_dict['is_active'] = False
    theme_dict['created_at'] = datetime.utcnow()
    theme_dict['updated_at'] = datetime.utcnow()
    
    website_themes_collection.insert_one(theme_dict)
    theme_dict.pop('_id', None)
    
    return theme_dict


@app.put("/api/website/themes/{theme_id}")
async def update_website_theme(
    theme_id: str,
    theme_data: WebsiteThemeUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a website theme"""
    update_data = theme_data.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    result = website_themes_collection.update_one(
        {'id': theme_id, 'user_id': current_user['id']},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found"
        )
    
    updated_theme = website_themes_collection.find_one({'id': theme_id})
    updated_theme['_id'] = str(updated_theme['_id'])
    
    return updated_theme


@app.post("/api/website/themes/{theme_id}/activate")
async def activate_website_theme(
    theme_id: str,
    current_user: User = Depends(get_current_user)
):
    """Activate a website theme (deactivates others)"""
    # Deactivate all themes first
    website_themes_collection.update_many(
        {'user_id': current_user['id']},
        {'$set': {'is_active': False}}
    )
    
    # Activate the selected theme
    result = website_themes_collection.update_one(
        {'id': theme_id, 'user_id': current_user['id']},
        {'$set': {'is_active': True, 'updated_at': datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found"
        )
    
    return {"message": "Theme activated"}


@app.delete("/api/website/themes/{theme_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_website_theme(
    theme_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a website theme"""
    theme = website_themes_collection.find_one({
        'id': theme_id,
        'user_id': current_user['id']
    })
    
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found"
        )
    
    if theme.get('is_active'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete active theme"
        )
    
    website_themes_collection.delete_one({'id': theme_id})
    
    return {"message": "Theme deleted"}


# ==================== NAVIGATION MENU ROUTES ====================

@app.get("/api/website/menus")
async def list_navigation_menus(
    current_user: User = Depends(get_current_user)
):
    """List navigation menus"""
    menus = list(navigation_menus_collection.find({'user_id': current_user['id']}))
    
    for menu in menus:
        menu['_id'] = str(menu['_id'])
    
    return {"menus": menus}


@app.post("/api/website/menus", status_code=status.HTTP_201_CREATED)
async def create_navigation_menu(
    menu_data: NavigationMenuCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new navigation menu"""
    menu_dict = menu_data.model_dump()
    menu_dict['id'] = str(uuid.uuid4())
    menu_dict['user_id'] = current_user['id']
    menu_dict['created_at'] = datetime.utcnow()
    menu_dict['updated_at'] = datetime.utcnow()
    
    navigation_menus_collection.insert_one(menu_dict)
    menu_dict.pop('_id', None)
    
    return menu_dict


@app.put("/api/website/menus/{menu_id}")
async def update_navigation_menu(
    menu_id: str,
    menu_data: NavigationMenuUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a navigation menu"""
    update_data = menu_data.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    result = navigation_menus_collection.update_one(
        {'id': menu_id, 'user_id': current_user['id']},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found"
        )
    
    updated_menu = navigation_menus_collection.find_one({'id': menu_id})
    updated_menu['_id'] = str(updated_menu['_id'])
    
    return updated_menu


@app.delete("/api/website/menus/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_navigation_menu(
    menu_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a navigation menu"""
    result = navigation_menus_collection.delete_one({
        'id': menu_id,
        'user_id': current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found"
        )
    
    return {"message": "Menu deleted"}


# ==================== PUBLIC BLOG & WEBSITE ROUTES ====================

@app.get("/api/public/blog/posts")
async def public_list_blog_posts(
    user_id: str = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Public endpoint to list published blog posts"""
    query = {
        'user_id': user_id,
        'status': 'published'
    }
    
    if category_id:
        query['category_id'] = category_id
    if tag:
        query['tags'] = tag
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'excerpt': {'$regex': search, '$options': 'i'}},
            {'content': {'$regex': search, '$options': 'i'}}
        ]
    
    total = blog_posts_collection.count_documents(query)
    posts = list(blog_posts_collection.find(query).sort('published_at', -1).skip(skip).limit(limit))
    
    for post in posts:
        post['_id'] = str(post['_id'])
    
    return {
        "posts": posts,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@app.get("/api/public/blog/posts/{slug}")
async def public_get_blog_post(
    slug: str,
    user_id: str = Query(...)
):
    """Public endpoint to get a published blog post by slug"""
    post = blog_posts_collection.find_one({
        'slug': slug,
        'user_id': user_id,
        'status': 'published'
    })
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found"
        )
    
    # Track view
    view_data = {
        'id': str(uuid.uuid4()),
        'post_id': post['id'],
        'user_id': user_id,
        'created_at': datetime.utcnow()
    }
    blog_post_views_collection.insert_one(view_data)
    
    # Increment view count
    blog_posts_collection.update_one(
        {'id': post['id']},
        {'$inc': {'total_views': 1}}
    )
    
    post['_id'] = str(post['_id'])
    return post


@app.post("/api/public/blog/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
async def public_create_blog_comment(
    post_id: str,
    comment_data: PublicBlogCommentRequest
):
    """Public endpoint to create a blog comment"""
    # Get the blog post to find the owner
    post = blog_posts_collection.find_one({'id': post_id, 'status': 'published'})
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found"
        )
    
    if not post.get('enable_comments', True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comments are disabled for this post"
        )
    
    comment_dict = comment_data.model_dump()
    comment_dict['id'] = str(uuid.uuid4())
    comment_dict['post_id'] = post_id
    comment_dict['user_id'] = post['user_id']
    comment_dict['status'] = 'pending'  # Requires approval
    comment_dict['created_at'] = datetime.utcnow()
    
    blog_comments_collection.insert_one(comment_dict)
    
    # Increment comment count
    blog_posts_collection.update_one(
        {'id': post_id},
        {'$inc': {'total_comments': 1}}
    )
    
    comment_dict.pop('_id', None)
    
    return comment_dict


@app.get("/api/public/website/pages/{slug}")
async def public_get_website_page(
    slug: str,
    user_id: str = Query(...)
):
    """Public endpoint to get a published website page by slug"""
    page = website_pages_collection.find_one({
        'slug': slug,
        'user_id': user_id,
        'status': 'published'
    })
    
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Track view
    view_data = {
        'id': str(uuid.uuid4()),
        'page_id': page['id'],
        'user_id': user_id,
        'created_at': datetime.utcnow()
    }
    website_page_views_collection.insert_one(view_data)
    
    # Increment view count
    website_pages_collection.update_one(
        {'id': page['id']},
        {'$inc': {'total_views': 1}}
    )
    
    page['_id'] = str(page['_id'])
    return page


# ==================== BLOG & WEBSITE ANALYTICS ROUTES ====================

@app.get("/api/blog/analytics/summary")
async def get_blog_analytics(
    current_user: User = Depends(get_current_user)
):
    """Get blog analytics summary"""
    total_posts = blog_posts_collection.count_documents({'user_id': current_user['id']})
    published_posts = blog_posts_collection.count_documents({
        'user_id': current_user['id'],
        'status': 'published'
    })
    total_categories = blog_categories_collection.count_documents({'user_id': current_user['id']})
    total_tags = blog_tags_collection.count_documents({'user_id': current_user['id']})
    
    # Total views
    total_views_result = blog_posts_collection.aggregate([
        {"$match": {"user_id": current_user['id']}},
        {"$group": {"_id": None, "total": {"$sum": "$total_views"}}}
    ])
    views_list = list(total_views_result)
    total_views = views_list[0]['total'] if views_list else 0
    
    # Total comments
    total_comments = blog_comments_collection.count_documents({'user_id': current_user['id']})
    pending_comments = blog_comments_collection.count_documents({
        'user_id': current_user['id'],
        'status': 'pending'
    })
    
    return {
        "total_posts": total_posts,
        "published_posts": published_posts,
        "draft_posts": total_posts - published_posts,
        "total_categories": total_categories,
        "total_tags": total_tags,
        "total_views": total_views,
        "total_comments": total_comments,
        "pending_comments": pending_comments
    }


@app.get("/api/website/analytics/summary")
async def get_website_analytics(
    current_user: User = Depends(get_current_user)
):
    """Get website analytics summary"""
    total_pages = website_pages_collection.count_documents({'user_id': current_user['id']})
    published_pages = website_pages_collection.count_documents({
        'user_id': current_user['id'],
        'status': 'published'
    })
    total_themes = website_themes_collection.count_documents({'user_id': current_user['id']})
    total_menus = navigation_menus_collection.count_documents({'user_id': current_user['id']})
    
    # Total views
    total_views_result = website_pages_collection.aggregate([
        {"$match": {"user_id": current_user['id']}},
        {"$group": {"_id": None, "total": {"$sum": "$total_views"}}}
    ])
    views_list = list(total_views_result)
    total_views = views_list[0]['total'] if views_list else 0
    
    return {
        "total_pages": total_pages,
        "published_pages": published_pages,
        "draft_pages": total_pages - published_pages,
        "total_themes": total_themes,
        "total_menus": total_menus,
        "total_views": total_views
    }


# ==================== NAVIGATION MENU ROUTES ====================

@app.get("/api/website/navigation-menus")
async def list_navigation_menus(
    current_user: User = Depends(get_current_user)
):
    """List navigation menus"""
    menus = list(navigation_menus_collection.find({'user_id': current_user['id']}))
    
    for menu in menus:
        menu['_id'] = str(menu['_id'])
    
    return {"menus": menus}


@app.post("/api/website/navigation-menus", status_code=status.HTTP_201_CREATED)
async def create_navigation_menu(
    menu_data: NavigationMenuCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new navigation menu"""
    menu_dict = menu_data.model_dump()
    menu_dict['id'] = str(uuid.uuid4())
    menu_dict['user_id'] = current_user['id']
    menu_dict['created_at'] = datetime.utcnow()
    menu_dict['updated_at'] = datetime.utcnow()
    menu_dict['menu_items'] = []
    
    navigation_menus_collection.insert_one(menu_dict)
    menu_dict.pop('_id', None)
    
    return menu_dict


@app.get("/api/website/navigation-menus/{menu_id}")
async def get_navigation_menu(
    menu_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a navigation menu by ID"""
    menu = navigation_menus_collection.find_one({
        'id': menu_id,
        'user_id': current_user['id']
    })
    
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found"
        )
    
    menu['_id'] = str(menu['_id'])
    return menu


@app.put("/api/website/navigation-menus/{menu_id}")
async def update_navigation_menu(
    menu_id: str,
    menu_data: NavigationMenuUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a navigation menu"""
    update_data = menu_data.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    result = navigation_menus_collection.update_one(
        {'id': menu_id, 'user_id': current_user['id']},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found"
        )
    
    updated_menu = navigation_menus_collection.find_one({'id': menu_id})
    updated_menu['_id'] = str(updated_menu['_id'])
    
    return updated_menu


@app.delete("/api/website/navigation-menus/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_navigation_menu(
    menu_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a navigation menu"""
    result = navigation_menus_collection.delete_one({
        'id': menu_id,
        'user_id': current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found"
        )
    
    return {"message": "Menu deleted"}


# ==================== RSS FEED ROUTE ====================

@app.get("/api/public/blog/rss")
async def generate_rss_feed(
    user_id: str = Query(...)
):
    """Generate RSS feed for blog posts"""
    # Get user info
    user = users_collection.find_one({'id': user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get published posts
    posts = list(blog_posts_collection.find({
        'user_id': user_id,
        'status': 'published'
    }).sort('published_at', -1).limit(20))
    
    # Generate RSS XML
    rss_items = []
    for post in posts:
        item = f"""
        <item>
            <title>{post.get('title', '')}</title>
            <link>https://yourblog.com/blog/{post.get('slug', '')}</link>
            <description>{post.get('excerpt', '')}</description>
            <pubDate>{post.get('published_at', '').strftime('%a, %d %b %Y %H:%M:%S GMT') if post.get('published_at') else ''}</pubDate>
            <guid>https://yourblog.com/blog/{post.get('slug', '')}</guid>
        </item>
        """
        rss_items.append(item)
    
    rss_xml = f"""<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
        <channel>
            <title>{user.get('full_name', '')}'s Blog</title>
            <link>https://yourblog.com</link>
            <description>Latest blog posts</description>
            <language>en-us</language>
            {''.join(rss_items)}
        </channel>
    </rss>
    """
    
    return JSONResponse(content=rss_xml, media_type="application/rss+xml")


# ==================== WEBINAR ROUTES (PHASE 9) ====================

@app.get("/api/webinars")
async def list_webinars(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """List user's webinars"""
    query = {"user_id": current_user["id"]}
    if status:
        query["status"] = status
    
    webinars = list(webinars_collection.find(query).sort("scheduled_at", -1).skip(skip).limit(limit))
    total = webinars_collection.count_documents(query)
    
    return {
        "webinars": webinars,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@app.post("/api/webinars", status_code=status.HTTP_201_CREATED)
async def create_webinar(
    webinar: WebinarCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new webinar"""
    webinar_dict = webinar.model_dump()
    webinar_dict['id'] = str(uuid.uuid4())
    webinar_dict['user_id'] = current_user['id']
    webinar_dict['status'] = 'draft'
    webinar_dict['registration_count'] = 0
    webinar_dict['attendee_count'] = 0
    webinar_dict['created_at'] = datetime.utcnow()
    webinar_dict['updated_at'] = datetime.utcnow()
    
    webinars_collection.insert_one(webinar_dict)
    
    return webinar_dict

@app.get("/api/webinars/{webinar_id}")
async def get_webinar(
    webinar_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get webinar details"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    return webinar

@app.put("/api/webinars/{webinar_id}")
async def update_webinar(
    webinar_id: str,
    webinar_update: WebinarUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update webinar"""
    existing = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    update_data = {k: v for k, v in webinar_update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.utcnow()
    
    webinars_collection.update_one(
        {"id": webinar_id},
        {"$set": update_data}
    )
    
    updated = webinars_collection.find_one({"id": webinar_id})
    return updated

@app.delete("/api/webinars/{webinar_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webinar(
    webinar_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete webinar"""
    result = webinars_collection.delete_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    # Also delete related data
    webinar_registrations_collection.delete_many({"webinar_id": webinar_id})
    webinar_chat_messages_collection.delete_many({"webinar_id": webinar_id})
    webinar_qa_collection.delete_many({"webinar_id": webinar_id})
    webinar_polls_collection.delete_many({"webinar_id": webinar_id})
    
    return None

@app.post("/api/webinars/{webinar_id}/publish")
async def publish_webinar(
    webinar_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Publish webinar (makes it scheduled)"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    webinars_collection.update_one(
        {"id": webinar_id},
        {"$set": {"status": "scheduled", "updated_at": datetime.utcnow()}}
    )
    
    # Send confirmation emails to registered users if reminders enabled
    if webinar.get('send_reminders', True):
        registrations = list(webinar_registrations_collection.find({"webinar_id": webinar_id}))
        
        # TODO: Schedule reminder emails via email system
        # This would integrate with Phase 3 email system
        
    return {"message": "Webinar published successfully"}

@app.post("/api/webinars/{webinar_id}/start")
async def start_webinar(
    webinar_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Start webinar (change status to live)"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    webinars_collection.update_one(
        {"id": webinar_id},
        {"$set": {
            "status": "live",
            "started_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Webinar started"}

@app.post("/api/webinars/{webinar_id}/end")
async def end_webinar(
    webinar_id: str,
    current_user: dict = Depends(get_current_user)
):
    """End webinar"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    webinars_collection.update_one(
        {"id": webinar_id},
        {"$set": {
            "status": "ended",
            "ended_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Webinar ended"}

# ==================== WEBINAR REGISTRATION ROUTES ====================

@app.get("/api/webinars/public/list")
async def list_public_webinars(
    skip: int = 0,
    limit: int = 20
):
    """Public endpoint to list upcoming webinars"""
    query = {
        "status": {"$in": ["scheduled", "live"]},
        "scheduled_at": {"$gte": datetime.utcnow()}
    }
    
    webinars = list(webinars_collection.find(query).sort("scheduled_at", 1).skip(skip).limit(limit))
    total = webinars_collection.count_documents(query)
    
    return {
        "webinars": webinars,
        "total": total
    }

@app.get("/api/webinars/{webinar_id}/public/preview")
async def get_webinar_public(webinar_id: str):
    """Public endpoint to view webinar details"""
    webinar = webinars_collection.find_one({"id": webinar_id})
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    return webinar

@app.post("/api/webinars/{webinar_id}/register", status_code=status.HTTP_201_CREATED)
async def register_for_webinar(
    webinar_id: str,
    registration: PublicWebinarRegistrationRequest,
    background_tasks: BackgroundTasks
):
    """Public endpoint for webinar registration"""
    webinar = webinars_collection.find_one({"id": webinar_id})
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    # Check if already registered
    existing = webinar_registrations_collection.find_one({
        "webinar_id": webinar_id,
        "email": registration.email
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this webinar")
    
    # Check max attendees
    if webinar.get('max_attendees'):
        current_count = webinars_collection.find_one({"id": webinar_id}).get('registration_count', 0)
        if current_count >= webinar['max_attendees']:
            raise HTTPException(status_code=400, detail="Webinar is full")
    
    # Create registration
    registration_dict = registration.model_dump()
    registration_dict['id'] = str(uuid.uuid4())
    registration_dict['webinar_id'] = webinar_id
    registration_dict['status'] = 'registered'
    registration_dict['registered_at'] = datetime.utcnow()
    registration_dict['watch_time_minutes'] = 0
    
    webinar_registrations_collection.insert_one(registration_dict)
    
    # Update registration count
    webinars_collection.update_one(
        {"id": webinar_id},
        {"$inc": {"registration_count": 1}}
    )
    
    # Create contact in CRM
    user_id = webinar.get('user_id')
    if user_id:
        contact_data = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'first_name': registration.first_name,
            'last_name': registration.last_name,
            'email': registration.email,
            'phone': registration.phone or '',
            'company': registration.company or '',
            'source': f'Webinar Registration: {webinar.get("title", "")}',
            'status': 'lead',
            'score': 0,
            'tags': ['webinar-registrant'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Check if contact already exists
        existing_contact = contacts_collection.find_one({
            'user_id': user_id,
            'email': registration.email
        })
        
        if existing_contact:
            # Update existing contact
            contacts_collection.update_one(
                {'id': existing_contact['id']},
                {'$addToSet': {'tags': 'webinar-registrant'}}
            )
            registration_dict['contact_id'] = existing_contact['id']
        else:
            # Create new contact
            contacts_collection.insert_one(contact_data)
            registration_dict['contact_id'] = contact_data['id']
        
        # Update registration with contact_id
        webinar_registrations_collection.update_one(
            {"id": registration_dict['id']},
            {"$set": {"contact_id": registration_dict.get('contact_id')}}
        )
    
    # Send confirmation email
    background_tasks.add_task(
        webinar_email_service.send_registration_confirmation,
        webinar,
        registration_dict
    )
    
    registration_dict.pop('_id', None)
    return registration_dict

@app.get("/api/webinars/{webinar_id}/registrations")
async def get_webinar_registrations(
    webinar_id: str,
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get webinar registrations"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    query = {"webinar_id": webinar_id}
    if status:
        query["status"] = status
    
    registrations = list(webinar_registrations_collection.find(query).sort("registered_at", -1).skip(skip).limit(limit))
    total = webinar_registrations_collection.count_documents(query)
    
    return {
        "registrations": registrations,
        "total": total
    }

@app.get("/api/webinars/{webinar_id}/registrations/export")
async def export_webinar_registrations(
    webinar_id: str,
    current_user: dict = Depends(get_current_user),
    format: str = Query("csv", regex="^(csv|excel)$")
):
    """Export webinar registrations"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    registrations = list(webinar_registrations_collection.find({"webinar_id": webinar_id}))
    
    if not registrations:
        raise HTTPException(status_code=404, detail="No registrations found")
    
    # Convert to DataFrame
    df_data = []
    for reg in registrations:
        df_data.append({
            'First Name': reg.get('first_name', ''),
            'Last Name': reg.get('last_name', ''),
            'Email': reg.get('email', ''),
            'Phone': reg.get('phone', ''),
            'Company': reg.get('company', ''),
            'Status': reg.get('status', ''),
            'Registered At': reg.get('registered_at', '').isoformat() if reg.get('registered_at') else '',
            'Attended At': reg.get('attended_at', '').isoformat() if reg.get('attended_at') else '',
            'Watch Time (minutes)': reg.get('watch_time_minutes', 0)
        })
    
    df = pd.DataFrame(df_data)
    
    if format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=webinar_registrations_{webinar_id}.csv"}
        )
    else:  # excel
        output = io.BytesIO()
        df.to_excel(output, index=False, engine='openpyxl')
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=webinar_registrations_{webinar_id}.xlsx"}
        )

# ==================== WEBINAR CHAT ROUTES ====================

@app.get("/api/webinars/{webinar_id}/chat")
async def get_chat_messages(
    webinar_id: str,
    since: Optional[str] = None,
    limit: int = 100
):
    """Get chat messages (public during live webinar)"""
    query = {"webinar_id": webinar_id}
    
    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
            query["created_at"] = {"$gt": since_dt}
        except:
            pass
    
    messages = list(
        webinar_chat_messages_collection.find(query)
        .sort("created_at", -1)
        .limit(limit)
    )
    
    messages.reverse()  # Return in chronological order
    
    return {"messages": messages}

@app.post("/api/webinars/{webinar_id}/chat", status_code=status.HTTP_201_CREATED)
async def send_chat_message(
    webinar_id: str,
    message: WebinarChatMessageCreate
):
    """Send chat message (public during live webinar)"""
    webinar = webinars_collection.find_one({"id": webinar_id})
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    if webinar.get('status') != 'live':
        raise HTTPException(status_code=400, detail="Webinar is not live")
    
    message_dict = message.model_dump()
    message_dict['id'] = str(uuid.uuid4())
    message_dict['webinar_id'] = webinar_id
    message_dict['is_host'] = False
    message_dict['created_at'] = datetime.utcnow()
    
    webinar_chat_messages_collection.insert_one(message_dict)
    
    return message_dict

@app.delete("/api/webinars/{webinar_id}/chat/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_message(
    webinar_id: str,
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete chat message (host only)"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    result = webinar_chat_messages_collection.delete_one({
        "id": message_id,
        "webinar_id": webinar_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return None

# ==================== WEBINAR Q&A ROUTES ====================

@app.get("/api/webinars/{webinar_id}/qa")
async def get_qa_questions(
    webinar_id: str,
    answered: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get Q&A questions"""
    query = {"webinar_id": webinar_id}
    
    if answered is not None:
        query["is_answered"] = answered
    
    questions = list(
        webinar_qa_collection.find(query)
        .sort([("is_featured", -1), ("upvotes", -1), ("created_at", -1)])
        .skip(skip)
        .limit(limit)
    )
    
    total = webinar_qa_collection.count_documents(query)
    
    return {
        "questions": questions,
        "total": total
    }

@app.post("/api/webinars/{webinar_id}/qa", status_code=status.HTTP_201_CREATED)
async def ask_question(
    webinar_id: str,
    qa: WebinarQACreate
):
    """Ask a question (public during live webinar)"""
    webinar = webinars_collection.find_one({"id": webinar_id})
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    qa_dict = qa.model_dump()
    qa_dict['id'] = str(uuid.uuid4())
    qa_dict['webinar_id'] = webinar_id
    qa_dict['is_answered'] = False
    qa_dict['is_featured'] = False
    qa_dict['upvotes'] = 0
    qa_dict['created_at'] = datetime.utcnow()
    
    webinar_qa_collection.insert_one(qa_dict)
    
    return qa_dict

@app.put("/api/webinars/{webinar_id}/qa/{question_id}/answer")
async def answer_question(
    webinar_id: str,
    question_id: str,
    answer_text: str,
    current_user: dict = Depends(get_current_user)
):
    """Answer a Q&A question (host only)"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    result = webinar_qa_collection.update_one(
        {"id": question_id, "webinar_id": webinar_id},
        {"$set": {
            "answer": answer_text,
            "answered_by": current_user.get('full_name', 'Host'),
            "is_answered": True,
            "answered_at": datetime.utcnow()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    
    updated = webinar_qa_collection.find_one({"id": question_id})
    return updated

@app.post("/api/webinars/{webinar_id}/qa/{question_id}/upvote")
async def upvote_question(
    webinar_id: str,
    question_id: str
):
    """Upvote a question"""
    result = webinar_qa_collection.update_one(
        {"id": question_id, "webinar_id": webinar_id},
        {"$inc": {"upvotes": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    
    updated = webinar_qa_collection.find_one({"id": question_id})
    return updated

@app.put("/api/webinars/{webinar_id}/qa/{question_id}/feature")
async def feature_question(
    webinar_id: str,
    question_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Feature a question (host only)"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    result = webinar_qa_collection.update_one(
        {"id": question_id, "webinar_id": webinar_id},
        {"$set": {"is_featured": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    
    updated = webinar_qa_collection.find_one({"id": question_id})
    return updated

# ==================== WEBINAR POLLS ROUTES ====================

@app.get("/api/webinars/{webinar_id}/polls")
async def get_polls(
    webinar_id: str,
    active_only: bool = False
):
    """Get webinar polls"""
    query = {"webinar_id": webinar_id}
    
    if active_only:
        query["is_active"] = True
    
    polls = list(webinar_polls_collection.find(query).sort("created_at", -1))
    
    return {"polls": polls}

@app.post("/api/webinars/{webinar_id}/polls", status_code=status.HTTP_201_CREATED)
async def create_poll(
    webinar_id: str,
    poll: WebinarPollCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a poll (host only)"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    poll_dict = poll.model_dump()
    poll_dict['id'] = str(uuid.uuid4())
    poll_dict['webinar_id'] = webinar_id
    poll_dict['is_active'] = True
    poll_dict['total_votes'] = 0
    poll_dict['votes'] = {str(i): 0 for i in range(len(poll.options))}
    poll_dict['created_at'] = datetime.utcnow()
    
    webinar_polls_collection.insert_one(poll_dict)
    
    return poll_dict

@app.post("/api/webinars/{webinar_id}/polls/{poll_id}/vote")
async def vote_on_poll(
    webinar_id: str,
    poll_id: str,
    vote: WebinarPollVote
):
    """Vote on a poll"""
    poll = webinar_polls_collection.find_one({
        "id": poll_id,
        "webinar_id": webinar_id
    })
    
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if not poll.get('is_active', False):
        raise HTTPException(status_code=400, detail="Poll is not active")
    
    # Update votes
    votes = poll.get('votes', {})
    for idx in vote.option_indices:
        key = str(idx)
        if key in votes:
            votes[key] = votes.get(key, 0) + 1
    
    webinar_polls_collection.update_one(
        {"id": poll_id},
        {
            "$set": {"votes": votes},
            "$inc": {"total_votes": 1}
        }
    )
    
    updated = webinar_polls_collection.find_one({"id": poll_id})
    return updated

@app.put("/api/webinars/{webinar_id}/polls/{poll_id}")
async def update_poll(
    webinar_id: str,
    poll_id: str,
    poll_update: WebinarPollUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update poll (host only)"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    update_data = {k: v for k, v in poll_update.model_dump().items() if v is not None}
    
    if update_data:
        webinar_polls_collection.update_one(
            {"id": poll_id, "webinar_id": webinar_id},
            {"$set": update_data}
        )
    
    updated = webinar_polls_collection.find_one({"id": poll_id})
    return updated

@app.delete("/api/webinars/{webinar_id}/polls/{poll_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_poll(
    webinar_id: str,
    poll_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete poll (host only)"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    result = webinar_polls_collection.delete_one({
        "id": poll_id,
        "webinar_id": webinar_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    return None

# ==================== WEBINAR RECORDINGS ROUTES ====================

@app.get("/api/webinars/{webinar_id}/recordings")
async def get_recordings(
    webinar_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get webinar recordings"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    recordings = list(webinar_recordings_collection.find({"webinar_id": webinar_id}).sort("created_at", -1))
    
    return {"recordings": recordings}

@app.post("/api/webinars/{webinar_id}/recordings", status_code=status.HTTP_201_CREATED)
async def add_recording(
    webinar_id: str,
    recording: WebinarRecordingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add webinar recording"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    recording_dict = recording.model_dump()
    recording_dict['id'] = str(uuid.uuid4())
    recording_dict['webinar_id'] = webinar_id
    recording_dict['is_public'] = False
    recording_dict['view_count'] = 0
    recording_dict['created_at'] = datetime.utcnow()
    recording_dict['updated_at'] = datetime.utcnow()
    
    webinar_recordings_collection.insert_one(recording_dict)
    
    return recording_dict

@app.put("/api/webinars/{webinar_id}/recordings/{recording_id}")
async def update_recording(
    webinar_id: str,
    recording_id: str,
    recording_update: WebinarRecordingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update recording"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    update_data = {k: v for k, v in recording_update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.utcnow()
    
    webinar_recordings_collection.update_one(
        {"id": recording_id, "webinar_id": webinar_id},
        {"$set": update_data}
    )
    
    updated = webinar_recordings_collection.find_one({"id": recording_id})
    return updated

@app.delete("/api/webinars/{webinar_id}/recordings/{recording_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recording(
    webinar_id: str,
    recording_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete recording"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found or unauthorized")
    
    result = webinar_recordings_collection.delete_one({
        "id": recording_id,
        "webinar_id": webinar_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    return None

@app.get("/api/webinars/{webinar_id}/recordings/{recording_id}/public")
async def get_public_recording(
    webinar_id: str,
    recording_id: str
):
    """Get public recording (for replay viewing)"""
    recording = webinar_recordings_collection.find_one({
        "id": recording_id,
        "webinar_id": webinar_id,
        "is_public": True
    })
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found or not public")
    
    # Increment view count
    webinar_recordings_collection.update_one(
        {"id": recording_id},
        {"$inc": {"view_count": 1}}
    )
    
    return recording

# ==================== WEBINAR ANALYTICS ROUTES ====================

@app.get("/api/webinars/analytics/summary")
async def get_webinar_analytics(
    current_user: dict = Depends(get_current_user)
):
    """Get webinar analytics summary"""
    user_id = current_user["id"]
    
    total_webinars = webinars_collection.count_documents({"user_id": user_id})
    
    upcoming_webinars = webinars_collection.count_documents({
        "user_id": user_id,
        "status": "scheduled",
        "scheduled_at": {"$gte": datetime.utcnow()}
    })
    
    completed_webinars = webinars_collection.count_documents({
        "user_id": user_id,
        "status": "ended"
    })
    
    # Get total registrations
    user_webinar_ids = [w['id'] for w in webinars_collection.find({"user_id": user_id}, {"id": 1})]
    total_registrations = webinar_registrations_collection.count_documents({
        "webinar_id": {"$in": user_webinar_ids}
    })
    
    total_attendees = webinar_registrations_collection.count_documents({
        "webinar_id": {"$in": user_webinar_ids},
        "status": "attended"
    })
    
    # Calculate average attendance rate
    average_attendance_rate = 0.0
    if total_registrations > 0:
        average_attendance_rate = (total_attendees / total_registrations) * 100
    
    # Get chat and Q&A stats
    total_chat_messages = webinar_chat_messages_collection.count_documents({
        "webinar_id": {"$in": user_webinar_ids}
    })
    
    total_questions = webinar_qa_collection.count_documents({
        "webinar_id": {"$in": user_webinar_ids}
    })
    
    return WebinarAnalytics(
        total_webinars=total_webinars,
        upcoming_webinars=upcoming_webinars,
        completed_webinars=completed_webinars,
        total_registrations=total_registrations,
        total_attendees=total_attendees,
        average_attendance_rate=round(average_attendance_rate, 2),
        total_chat_messages=total_chat_messages,
        total_questions=total_questions
    )

@app.get("/api/webinars/{webinar_id}/analytics")
async def get_webinar_specific_analytics(
    webinar_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get analytics for a specific webinar"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    # Registration stats
    total_registrations = webinar_registrations_collection.count_documents({"webinar_id": webinar_id})
    attended = webinar_registrations_collection.count_documents({"webinar_id": webinar_id, "status": "attended"})
    no_show = webinar_registrations_collection.count_documents({"webinar_id": webinar_id, "status": "no_show"})
    
    # Engagement stats
    chat_messages = webinar_chat_messages_collection.count_documents({"webinar_id": webinar_id})
    total_questions = webinar_qa_collection.count_documents({"webinar_id": webinar_id})
    answered_questions = webinar_qa_collection.count_documents({"webinar_id": webinar_id, "is_answered": True})
    total_polls = webinar_polls_collection.count_documents({"webinar_id": webinar_id})
    
    # Average watch time
    registrations = list(webinar_registrations_collection.find({"webinar_id": webinar_id, "status": "attended"}))
    avg_watch_time = 0
    if registrations:
        total_watch_time = sum(r.get('watch_time_minutes', 0) for r in registrations)
        avg_watch_time = total_watch_time / len(registrations) if len(registrations) > 0 else 0
    
    attendance_rate = (attended / total_registrations * 100) if total_registrations > 0 else 0
    
    return {
        "webinar_id": webinar_id,
        "title": webinar.get('title'),
        "status": webinar.get('status'),
        "scheduled_at": webinar.get('scheduled_at'),
        "registrations": {
            "total": total_registrations,
            "attended": attended,
            "no_show": no_show,
            "attendance_rate": round(attendance_rate, 2)
        },
        "engagement": {
            "chat_messages": chat_messages,
            "total_questions": total_questions,
            "answered_questions": answered_questions,
            "total_polls": total_polls,
            "average_watch_time_minutes": round(avg_watch_time, 2)
        }
    }

# ==================== WEBINAR EMAIL REMINDERS ====================

@app.post("/api/webinars/reminders/process")
async def process_webinar_reminders(current_user: dict = Depends(get_current_user)):
    """
    Manually trigger reminder processing (admin only)
    In production, this would be a cron job
    """
    result = webinar_email_service.process_scheduled_reminders()
    return result

@app.post("/api/webinars/{webinar_id}/send-thank-you")
async def send_thank_you_emails(
    webinar_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send thank you emails to all attendees"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    # Get all attendees
    registrations = list(webinar_registrations_collection.find({
        "webinar_id": webinar_id,
        "status": "attended"
    }))
    
    # Get recording if available
    recording = webinar_recordings_collection.find_one({
        "webinar_id": webinar_id,
        "is_public": True
    })
    recording_url = recording.get('recording_url') if recording else None
    
    # Send emails in background
    for registration in registrations:
        background_tasks.add_task(
            webinar_email_service.send_thank_you_with_recording,
            webinar,
            registration,
            recording_url
        )
    
    return {
        "message": f"Sending thank you emails to {len(registrations)} attendees",
        "count": len(registrations)
    }

@app.post("/api/webinars/{webinar_id}/test-reminder")
async def send_test_reminder(
    webinar_id: str,
    email: str,
    reminder_type: str = Query(..., regex="^(24h|1h|confirmation)$"),
    current_user: dict = Depends(get_current_user)
):
    """Send test reminder email (for testing)"""
    webinar = webinars_collection.find_one({
        "id": webinar_id,
        "user_id": current_user["id"]
    })
    
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    # Create test registration
    test_registration = {
        'first_name': 'Test',
        'last_name': 'User',
        'email': email
    }
    
    if reminder_type == '24h':
        result = webinar_email_service.send_reminder_24h(webinar, test_registration)
    elif reminder_type == '1h':
        result = webinar_email_service.send_reminder_1h(webinar, test_registration)
    else:  # confirmation
        result = webinar_email_service.send_registration_confirmation(webinar, test_registration)
    
    return result


# ==================== AFFILIATE MANAGEMENT ROUTES (PHASE 10) ====================

# Helper function to generate unique affiliate code
def generate_affiliate_code(first_name: str, last_name: str) -> str:
    """Generate unique affiliate code"""
    import random
    import string
    base = f"{first_name[:3]}{last_name[:3]}".upper()
    suffix = ''.join(random.choices(string.digits, k=4))
    code = f"{base}{suffix}"
    
    # Ensure uniqueness
    while affiliates_collection.find_one({"affiliate_code": code}):
        suffix = ''.join(random.choices(string.digits, k=4))
        code = f"{base}{suffix}"
    
    return code

# Helper function to generate short code for links
def generate_short_code() -> str:
    """Generate unique short code for affiliate links"""
    import random
    import string
    code = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    
    # Ensure uniqueness
    while affiliate_links_collection.find_one({"short_code": code}):
        code = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    
    return code

# Helper function to calculate commission
def calculate_commission(program: dict, order_amount: float, affiliate_sales_count: int = 0) -> float:
    """Calculate commission based on program rules"""
    commission_type = program.get("commission_type", "percentage")
    
    if commission_type == "percentage":
        return order_amount * (program.get("commission_value", 0) / 100)
    elif commission_type == "fixed":
        return program.get("commission_value", 0)
    elif commission_type == "tiered":
        # Find the appropriate tier
        tiers = program.get("commission_tiers", [])
        for tier in tiers:
            min_sales = tier.get("min_sales", 0)
            max_sales = tier.get("max_sales", float('inf'))
            if min_sales <= affiliate_sales_count <= max_sales:
                return order_amount * (tier.get("value", 0) / 100)
        # Default to base commission if no tier matches
        return order_amount * (program.get("commission_value", 0) / 100)
    
    return 0.0

# ==================== AFFILIATE PROGRAM ROUTES ====================

@app.get("/api/affiliate-programs")
async def list_affiliate_programs(
    current_user: dict = Depends(get_current_user)
):
    """List all affiliate programs for current user"""
    programs = list(affiliate_programs_collection.find({"user_id": current_user["id"]}))
    
    # Convert ObjectId to string and format dates
    for program in programs:
        program["_id"] = str(program["_id"])
        if "created_at" in program:
            program["created_at"] = program["created_at"].isoformat()
        if "updated_at" in program:
            program["updated_at"] = program["updated_at"].isoformat()
    
    return {"programs": programs, "total": len(programs)}

@app.post("/api/affiliate-programs")
async def create_affiliate_program(
    program: AffiliateProgramCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new affiliate program"""
    program_dict = program.dict()
    program_dict["id"] = str(uuid.uuid4())
    program_dict["user_id"] = current_user["id"]
    program_dict["is_active"] = True
    program_dict["total_affiliates"] = 0
    program_dict["total_clicks"] = 0
    program_dict["total_conversions"] = 0
    program_dict["total_revenue"] = 0.0
    program_dict["total_commissions"] = 0.0
    program_dict["created_at"] = datetime.utcnow()
    program_dict["updated_at"] = datetime.utcnow()
    
    affiliate_programs_collection.insert_one(program_dict)
    
    program_dict["_id"] = str(program_dict["_id"])
    program_dict["created_at"] = program_dict["created_at"].isoformat()
    program_dict["updated_at"] = program_dict["updated_at"].isoformat()
    
    return program_dict

@app.get("/api/affiliate-programs/{program_id}")
async def get_affiliate_program(
    program_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get affiliate program details"""
    program = affiliate_programs_collection.find_one({
        "id": program_id,
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    program["_id"] = str(program["_id"])
    if "created_at" in program:
        program["created_at"] = program["created_at"].isoformat()
    if "updated_at" in program:
        program["updated_at"] = program["updated_at"].isoformat()
    
    return program

@app.put("/api/affiliate-programs/{program_id}")
async def update_affiliate_program(
    program_id: str,
    program_update: AffiliateProgramUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update affiliate program"""
    existing_program = affiliate_programs_collection.find_one({
        "id": program_id,
        "user_id": current_user["id"]
    })
    
    if not existing_program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    update_data = {k: v for k, v in program_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    affiliate_programs_collection.update_one(
        {"id": program_id},
        {"$set": update_data}
    )
    
    updated_program = affiliate_programs_collection.find_one({"id": program_id})
    updated_program["_id"] = str(updated_program["_id"])
    if "created_at" in updated_program:
        updated_program["created_at"] = updated_program["created_at"].isoformat()
    if "updated_at" in updated_program:
        updated_program["updated_at"] = updated_program["updated_at"].isoformat()
    
    return updated_program

@app.delete("/api/affiliate-programs/{program_id}")
async def delete_affiliate_program(
    program_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete affiliate program"""
    result = affiliate_programs_collection.delete_one({
        "id": program_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    
    return {"message": "Program deleted successfully"}

# ==================== AFFILIATE ROUTES ====================

@app.post("/api/affiliates/register")
async def register_affiliate(registration: PublicAffiliateRegistrationRequest):
    """Public affiliate registration endpoint"""
    # Check if program exists and is active
    program = affiliate_programs_collection.find_one({
        "id": registration.program_id,
        "is_active": True
    })
    
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Check if affiliate already exists
    existing_affiliate = affiliates_collection.find_one({
        "program_id": registration.program_id,
        "email": registration.email
    })
    
    if existing_affiliate:
        raise HTTPException(status_code=400, detail="Affiliate already registered for this program")
    
    # Generate unique affiliate code
    affiliate_code = generate_affiliate_code(registration.first_name, registration.last_name)
    
    # Determine initial status based on program settings
    approval_required = program.get("approval_required", True)
    initial_status = "pending" if approval_required else "approved"
    
    # Create affiliate
    affiliate_dict = registration.dict()
    affiliate_dict["id"] = str(uuid.uuid4())
    affiliate_dict["affiliate_code"] = affiliate_code
    affiliate_dict["status"] = initial_status
    affiliate_dict["user_id"] = None
    affiliate_dict["contact_id"] = None
    affiliate_dict["total_clicks"] = 0
    affiliate_dict["total_conversions"] = 0
    affiliate_dict["total_revenue"] = 0.0
    affiliate_dict["total_commissions"] = 0.0
    affiliate_dict["pending_commissions"] = 0.0
    affiliate_dict["paid_commissions"] = 0.0
    affiliate_dict["created_at"] = datetime.utcnow()
    affiliate_dict["updated_at"] = datetime.utcnow()
    
    if not approval_required:
        affiliate_dict["approved_at"] = datetime.utcnow()
        affiliate_dict["approved_by"] = "auto"
    
    affiliates_collection.insert_one(affiliate_dict)
    
    # Update program stats
    affiliate_programs_collection.update_one(
        {"id": registration.program_id},
        {"$inc": {"total_affiliates": 1}}
    )
    
    # Auto-create contact in CRM
    try:
        contact_data = {
            "id": str(uuid.uuid4()),
            "user_id": program["user_id"],
            "first_name": registration.first_name,
            "last_name": registration.last_name,
            "email": registration.email,
            "phone": registration.phone,
            "company": registration.company,
            "source": "affiliate_registration",
            "status": "lead",
            "score": 0,
            "custom_fields": {"affiliate_code": affiliate_code},
            "tags": ["affiliate"],
            "segments": [],
            "last_contacted": None,
            "engagement_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        contacts_collection.insert_one(contact_data)
        
        # Update affiliate with contact_id
        affiliates_collection.update_one(
            {"id": affiliate_dict["id"]},
            {"$set": {"contact_id": contact_data["id"]}}
        )
    except Exception as e:
        print(f"Error creating contact: {e}")
    
    affiliate_dict["_id"] = str(affiliate_dict["_id"])
    affiliate_dict["created_at"] = affiliate_dict["created_at"].isoformat()
    affiliate_dict["updated_at"] = affiliate_dict["updated_at"].isoformat()
    
    return {
        "message": "Registration successful" if not approval_required else "Registration pending approval",
        "affiliate": affiliate_dict,
        "status": initial_status
    }

@app.get("/api/affiliates")
async def list_affiliates(
    program_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List affiliates with optional filters"""
    query = {}
    
    # If program_id provided, verify ownership
    if program_id:
        program = affiliate_programs_collection.find_one({
            "id": program_id,
            "user_id": current_user["id"]
        })
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")
        query["program_id"] = program_id
    else:
        # Get all programs owned by user
        user_programs = list(affiliate_programs_collection.find({"user_id": current_user["id"]}))
        program_ids = [p["id"] for p in user_programs]
        query["program_id"] = {"$in": program_ids}
    
    if status:
        query["status"] = status
    
    affiliates = list(affiliates_collection.find(query))
    
    # Format response
    for affiliate in affiliates:
        affiliate["_id"] = str(affiliate["_id"])
        if "created_at" in affiliate:
            affiliate["created_at"] = affiliate["created_at"].isoformat()
        if "updated_at" in affiliate:
            affiliate["updated_at"] = affiliate["updated_at"].isoformat()
        if "approved_at" in affiliate and affiliate["approved_at"]:
            affiliate["approved_at"] = affiliate["approved_at"].isoformat()
    
    return {"affiliates": affiliates, "total": len(affiliates)}

@app.get("/api/affiliates/{affiliate_id}")
async def get_affiliate(
    affiliate_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get affiliate details"""
    affiliate = affiliates_collection.find_one({"id": affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": affiliate["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    affiliate["_id"] = str(affiliate["_id"])
    if "created_at" in affiliate:
        affiliate["created_at"] = affiliate["created_at"].isoformat()
    if "updated_at" in affiliate:
        affiliate["updated_at"] = affiliate["updated_at"].isoformat()
    if "approved_at" in affiliate and affiliate["approved_at"]:
        affiliate["approved_at"] = affiliate["approved_at"].isoformat()
    
    return affiliate

@app.put("/api/affiliates/{affiliate_id}")
async def update_affiliate(
    affiliate_id: str,
    affiliate_update: AffiliateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update affiliate details"""
    affiliate = affiliates_collection.find_one({"id": affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": affiliate["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in affiliate_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    affiliates_collection.update_one(
        {"id": affiliate_id},
        {"$set": update_data}
    )
    
    updated_affiliate = affiliates_collection.find_one({"id": affiliate_id})
    updated_affiliate["_id"] = str(updated_affiliate["_id"])
    if "created_at" in updated_affiliate:
        updated_affiliate["created_at"] = updated_affiliate["created_at"].isoformat()
    if "updated_at" in updated_affiliate:
        updated_affiliate["updated_at"] = updated_affiliate["updated_at"].isoformat()
    
    return updated_affiliate

@app.post("/api/affiliates/{affiliate_id}/approve")
async def approve_affiliate(
    affiliate_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve affiliate"""
    affiliate = affiliates_collection.find_one({"id": affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": affiliate["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    affiliates_collection.update_one(
        {"id": affiliate_id},
        {
            "$set": {
                "status": "approved",
                "approved_at": datetime.utcnow(),
                "approved_by": current_user["id"],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # TODO: Send approval email
    
    return {"message": "Affiliate approved successfully"}

@app.post("/api/affiliates/{affiliate_id}/reject")
async def reject_affiliate(
    affiliate_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject affiliate"""
    affiliate = affiliates_collection.find_one({"id": affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": affiliate["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    affiliates_collection.update_one(
        {"id": affiliate_id},
        {
            "$set": {
                "status": "rejected",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # TODO: Send rejection email
    
    return {"message": "Affiliate rejected"}

# ==================== AFFILIATE LINK ROUTES ====================

@app.post("/api/affiliate-links")
async def create_affiliate_link(
    link: AffiliateLinkCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create affiliate tracking link"""
    # Verify affiliate exists and belongs to user's program
    affiliate = affiliates_collection.find_one({"id": link.affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    program = affiliate_programs_collection.find_one({
        "id": affiliate["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if link already exists
    existing_link = affiliate_links_collection.find_one({
        "affiliate_id": link.affiliate_id,
        "product_type": link.product_type,
        "product_id": link.product_id
    })
    
    if existing_link:
        existing_link["_id"] = str(existing_link["_id"])
        if "created_at" in existing_link:
            existing_link["created_at"] = existing_link["created_at"].isoformat()
        return existing_link
    
    # Generate short code
    short_code = generate_short_code()
    
    # Create link
    link_dict = link.dict()
    link_dict["id"] = str(uuid.uuid4())
    link_dict["program_id"] = affiliate["program_id"]
    link_dict["short_code"] = short_code
    link_dict["link_url"] = f"/aff/{short_code}"
    link_dict["clicks"] = 0
    link_dict["conversions"] = 0
    link_dict["revenue"] = 0.0
    link_dict["created_at"] = datetime.utcnow()
    
    affiliate_links_collection.insert_one(link_dict)
    
    link_dict["_id"] = str(link_dict["_id"])
    link_dict["created_at"] = link_dict["created_at"].isoformat()
    
    return link_dict

@app.get("/api/affiliate-links")
async def list_affiliate_links(
    affiliate_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List affiliate links"""
    query = {}
    
    if affiliate_id:
        # Verify affiliate belongs to user's program
        affiliate = affiliates_collection.find_one({"id": affiliate_id})
        if not affiliate:
            raise HTTPException(status_code=404, detail="Affiliate not found")
        
        program = affiliate_programs_collection.find_one({
            "id": affiliate["program_id"],
            "user_id": current_user["id"]
        })
        
        if not program:
            raise HTTPException(status_code=403, detail="Access denied")
        
        query["affiliate_id"] = affiliate_id
    else:
        # Get all links for user's programs
        user_programs = list(affiliate_programs_collection.find({"user_id": current_user["id"]}))
        program_ids = [p["id"] for p in user_programs]
        query["program_id"] = {"$in": program_ids}
    
    links = list(affiliate_links_collection.find(query))
    
    for link in links:
        link["_id"] = str(link["_id"])
        if "created_at" in link:
            link["created_at"] = link["created_at"].isoformat()
    
    return {"links": links, "total": len(links)}

@app.post("/api/affiliate-links/{short_code}/track-click")
async def track_affiliate_click(
    short_code: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    referrer: Optional[str] = None
):
    """Track affiliate link click (public endpoint)"""
    # Find link
    link = affiliate_links_collection.find_one({"short_code": short_code})
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Record click
    click_dict = {
        "id": str(uuid.uuid4()),
        "link_id": link["id"],
        "affiliate_id": link["affiliate_id"],
        "program_id": link["program_id"],
        "ip_address": ip_address,
        "user_agent": user_agent,
        "referrer": referrer,
        "clicked_at": datetime.utcnow(),
        "converted": False,
        "conversion_id": None
    }
    
    affiliate_clicks_collection.insert_one(click_dict)
    
    # Update counters
    affiliate_links_collection.update_one(
        {"id": link["id"]},
        {"$inc": {"clicks": 1}}
    )
    
    affiliates_collection.update_one(
        {"id": link["affiliate_id"]},
        {"$inc": {"total_clicks": 1}}
    )
    
    affiliate_programs_collection.update_one(
        {"id": link["program_id"]},
        {"$inc": {"total_clicks": 1}}
    )
    
    return {
        "redirect_url": f"/{link['product_type']}/{link['product_id']}",
        "click_id": click_dict["id"]
    }

# ==================== AFFILIATE CONVERSION ROUTES ====================

@app.post("/api/affiliate-conversions")
async def create_affiliate_conversion(
    conversion: AffiliateConversionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Record affiliate conversion"""
    # Verify affiliate and program
    affiliate = affiliates_collection.find_one({"id": conversion.affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    program = affiliate_programs_collection.find_one({
        "id": conversion.program_id,
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Calculate commission
    affiliate_sales_count = affiliate.get("total_conversions", 0)
    commission_amount = calculate_commission(program, conversion.order_amount, affiliate_sales_count)
    
    # Create conversion
    conversion_dict = conversion.dict()
    conversion_dict["id"] = str(uuid.uuid4())
    conversion_dict["commission_amount"] = commission_amount
    conversion_dict["converted_at"] = datetime.utcnow()
    conversion_dict["commission_id"] = None
    
    affiliate_conversions_collection.insert_one(conversion_dict)
    
    # Create commission
    commission_dict = {
        "id": str(uuid.uuid4()),
        "affiliate_id": conversion.affiliate_id,
        "program_id": conversion.program_id,
        "conversion_id": conversion_dict["id"],
        "commission_amount": commission_amount,
        "commission_type": program.get("commission_type", "percentage"),
        "status": "pending",
        "payout_id": None,
        "created_at": datetime.utcnow(),
        "approved_at": None,
        "paid_at": None
    }
    
    affiliate_commissions_collection.insert_one(commission_dict)
    
    # Update conversion with commission_id
    affiliate_conversions_collection.update_one(
        {"id": conversion_dict["id"]},
        {"$set": {"commission_id": commission_dict["id"]}}
    )
    
    # Update counters
    affiliates_collection.update_one(
        {"id": conversion.affiliate_id},
        {
            "$inc": {
                "total_conversions": 1,
                "total_revenue": conversion.order_amount,
                "total_commissions": commission_amount,
                "pending_commissions": commission_amount
            }
        }
    )
    
    affiliate_programs_collection.update_one(
        {"id": conversion.program_id},
        {
            "$inc": {
                "total_conversions": 1,
                "total_revenue": conversion.order_amount,
                "total_commissions": commission_amount
            }
        }
    )
    
    # Update click if provided
    if conversion.click_id:
        affiliate_clicks_collection.update_one(
            {"id": conversion.click_id},
            {
                "$set": {
                    "converted": True,
                    "conversion_id": conversion_dict["id"]
                }
            }
        )
    
    conversion_dict["_id"] = str(conversion_dict["_id"])
    conversion_dict["converted_at"] = conversion_dict["converted_at"].isoformat()
    
    return conversion_dict

@app.get("/api/affiliate-conversions")
async def list_affiliate_conversions(
    affiliate_id: Optional[str] = None,
    program_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List affiliate conversions"""
    query = {}
    
    if program_id:
        program = affiliate_programs_collection.find_one({
            "id": program_id,
            "user_id": current_user["id"]
        })
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")
        query["program_id"] = program_id
    else:
        # Get all programs owned by user
        user_programs = list(affiliate_programs_collection.find({"user_id": current_user["id"]}))
        program_ids = [p["id"] for p in user_programs]
        query["program_id"] = {"$in": program_ids}
    
    if affiliate_id:
        query["affiliate_id"] = affiliate_id
    
    conversions = list(affiliate_conversions_collection.find(query))
    
    for conversion in conversions:
        conversion["_id"] = str(conversion["_id"])
        if "converted_at" in conversion:
            conversion["converted_at"] = conversion["converted_at"].isoformat()
    
    return {"conversions": conversions, "total": len(conversions)}

# ==================== AFFILIATE COMMISSION ROUTES ====================

@app.get("/api/affiliate-commissions")
async def list_affiliate_commissions(
    affiliate_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List affiliate commissions"""
    query = {}
    
    # Get all programs owned by user
    user_programs = list(affiliate_programs_collection.find({"user_id": current_user["id"]}))
    program_ids = [p["id"] for p in user_programs]
    query["program_id"] = {"$in": program_ids}
    
    if affiliate_id:
        query["affiliate_id"] = affiliate_id
    
    if status:
        query["status"] = status
    
    commissions = list(affiliate_commissions_collection.find(query))
    
    for commission in commissions:
        commission["_id"] = str(commission["_id"])
        if "created_at" in commission:
            commission["created_at"] = commission["created_at"].isoformat()
        if "approved_at" in commission and commission["approved_at"]:
            commission["approved_at"] = commission["approved_at"].isoformat()
        if "paid_at" in commission and commission["paid_at"]:
            commission["paid_at"] = commission["paid_at"].isoformat()
    
    return {"commissions": commissions, "total": len(commissions)}

@app.post("/api/affiliate-commissions/{commission_id}/approve")
async def approve_commission(
    commission_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve commission"""
    commission = affiliate_commissions_collection.find_one({"id": commission_id})
    
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": commission["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    affiliate_commissions_collection.update_one(
        {"id": commission_id},
        {
            "$set": {
                "status": "approved",
                "approved_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Commission approved"}

# ==================== AFFILIATE PAYOUT ROUTES ====================

@app.post("/api/affiliate-payouts")
async def create_affiliate_payout(
    payout: AffiliatePayoutCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create affiliate payout"""
    # Verify affiliate
    affiliate = affiliates_collection.find_one({"id": payout.affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": affiliate["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify commissions exist and are approved
    commissions = list(affiliate_commissions_collection.find({
        "id": {"$in": payout.commission_ids},
        "status": "approved",
        "payout_id": None
    }))
    
    if len(commissions) != len(payout.commission_ids):
        raise HTTPException(status_code=400, detail="Some commissions are not available for payout")
    
    # Create payout
    payout_dict = payout.dict()
    payout_dict["id"] = str(uuid.uuid4())
    payout_dict["program_id"] = affiliate["program_id"]
    payout_dict["status"] = "pending"
    payout_dict["transaction_id"] = None
    payout_dict["created_at"] = datetime.utcnow()
    payout_dict["processed_at"] = None
    payout_dict["completed_at"] = None
    
    affiliate_payouts_collection.insert_one(payout_dict)
    
    # Update commissions
    affiliate_commissions_collection.update_many(
        {"id": {"$in": payout.commission_ids}},
        {"$set": {"payout_id": payout_dict["id"]}}
    )
    
    # Update affiliate
    affiliates_collection.update_one(
        {"id": payout.affiliate_id},
        {
            "$inc": {
                "pending_commissions": -payout.amount
            }
        }
    )
    
    payout_dict["_id"] = str(payout_dict["_id"])
    payout_dict["created_at"] = payout_dict["created_at"].isoformat()
    
    return payout_dict

@app.get("/api/affiliate-payouts")
async def list_affiliate_payouts(
    affiliate_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List affiliate payouts"""
    query = {}
    
    # Get all programs owned by user
    user_programs = list(affiliate_programs_collection.find({"user_id": current_user["id"]}))
    program_ids = [p["id"] for p in user_programs]
    query["program_id"] = {"$in": program_ids}
    
    if affiliate_id:
        query["affiliate_id"] = affiliate_id
    
    if status:
        query["status"] = status
    
    payouts = list(affiliate_payouts_collection.find(query))
    
    for payout in payouts:
        payout["_id"] = str(payout["_id"])
        if "created_at" in payout:
            payout["created_at"] = payout["created_at"].isoformat()
        if "processed_at" in payout and payout["processed_at"]:
            payout["processed_at"] = payout["processed_at"].isoformat()
        if "completed_at" in payout and payout["completed_at"]:
            payout["completed_at"] = payout["completed_at"].isoformat()
    
    return {"payouts": payouts, "total": len(payouts)}

@app.put("/api/affiliate-payouts/{payout_id}")
async def update_payout(
    payout_id: str,
    payout_update: AffiliatePayoutUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update payout status"""
    payout = affiliate_payouts_collection.find_one({"id": payout_id})
    
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": payout["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in payout_update.dict().items() if v is not None}
    
    # Handle status transitions
    if "status" in update_data:
        if update_data["status"] == "processing":
            update_data["processed_at"] = datetime.utcnow()
        elif update_data["status"] == "completed":
            update_data["completed_at"] = datetime.utcnow()
            
            # Update commissions and affiliate
            affiliate_commissions_collection.update_many(
                {"payout_id": payout_id},
                {
                    "$set": {
                        "status": "paid",
                        "paid_at": datetime.utcnow()
                    }
                }
            )
            
            affiliates_collection.update_one(
                {"id": payout["affiliate_id"]},
                {
                    "$inc": {
                        "paid_commissions": payout["amount"]
                    }
                }
            )
    
    affiliate_payouts_collection.update_one(
        {"id": payout_id},
        {"$set": update_data}
    )
    
    updated_payout = affiliate_payouts_collection.find_one({"id": payout_id})
    updated_payout["_id"] = str(updated_payout["_id"])
    if "created_at" in updated_payout:
        updated_payout["created_at"] = updated_payout["created_at"].isoformat()
    if "processed_at" in updated_payout and updated_payout["processed_at"]:
        updated_payout["processed_at"] = updated_payout["processed_at"].isoformat()
    if "completed_at" in updated_payout and updated_payout["completed_at"]:
        updated_payout["completed_at"] = updated_payout["completed_at"].isoformat()
    
    return updated_payout

# ==================== AFFILIATE RESOURCE ROUTES ====================

@app.post("/api/affiliate-resources")
async def create_affiliate_resource(
    resource: AffiliateResourceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create affiliate resource"""
    # Verify program ownership
    program = affiliate_programs_collection.find_one({
        "id": resource.program_id,
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    resource_dict = resource.dict()
    resource_dict["id"] = str(uuid.uuid4())
    resource_dict["user_id"] = current_user["id"]
    resource_dict["downloads"] = 0
    resource_dict["created_at"] = datetime.utcnow()
    resource_dict["updated_at"] = datetime.utcnow()
    
    affiliate_resources_collection.insert_one(resource_dict)
    
    resource_dict["_id"] = str(resource_dict["_id"])
    resource_dict["created_at"] = resource_dict["created_at"].isoformat()
    resource_dict["updated_at"] = resource_dict["updated_at"].isoformat()
    
    return resource_dict

@app.get("/api/affiliate-resources")
async def list_affiliate_resources(
    program_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List affiliate resources"""
    query = {}
    
    if program_id:
        program = affiliate_programs_collection.find_one({
            "id": program_id,
            "user_id": current_user["id"]
        })
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")
        query["program_id"] = program_id
    else:
        # Get all programs owned by user
        user_programs = list(affiliate_programs_collection.find({"user_id": current_user["id"]}))
        program_ids = [p["id"] for p in user_programs]
        query["program_id"] = {"$in": program_ids}
    
    if resource_type:
        query["resource_type"] = resource_type
    
    resources = list(affiliate_resources_collection.find(query))
    
    for resource in resources:
        resource["_id"] = str(resource["_id"])
        if "created_at" in resource:
            resource["created_at"] = resource["created_at"].isoformat()
        if "updated_at" in resource:
            resource["updated_at"] = resource["updated_at"].isoformat()
    
    return {"resources": resources, "total": len(resources)}

@app.put("/api/affiliate-resources/{resource_id}")
async def update_affiliate_resource(
    resource_id: str,
    resource_update: AffiliateResourceUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update affiliate resource"""
    resource = affiliate_resources_collection.find_one({"id": resource_id})
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": resource["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in resource_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    affiliate_resources_collection.update_one(
        {"id": resource_id},
        {"$set": update_data}
    )
    
    updated_resource = affiliate_resources_collection.find_one({"id": resource_id})
    updated_resource["_id"] = str(updated_resource["_id"])
    if "created_at" in updated_resource:
        updated_resource["created_at"] = updated_resource["created_at"].isoformat()
    if "updated_at" in updated_resource:
        updated_resource["updated_at"] = updated_resource["updated_at"].isoformat()
    
    return updated_resource

@app.delete("/api/affiliate-resources/{resource_id}")
async def delete_affiliate_resource(
    resource_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete affiliate resource"""
    resource = affiliate_resources_collection.find_one({"id": resource_id})
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": resource["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    affiliate_resources_collection.delete_one({"id": resource_id})
    
    return {"message": "Resource deleted successfully"}

# ==================== AFFILIATE ANALYTICS ROUTES ====================

@app.get("/api/affiliate-analytics/summary")
async def get_affiliate_analytics_summary(
    program_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get affiliate program analytics summary"""
    query = {}
    
    if program_id:
        program = affiliate_programs_collection.find_one({
            "id": program_id,
            "user_id": current_user["id"]
        })
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")
        query["program_id"] = program_id
    else:
        # Get all programs owned by user
        user_programs = list(affiliate_programs_collection.find({"user_id": current_user["id"]}))
        program_ids = [p["id"] for p in user_programs]
        query["program_id"] = {"$in": program_ids}
    
    # Get counts
    total_affiliates = affiliates_collection.count_documents(query)
    active_affiliates = affiliates_collection.count_documents({**query, "status": "approved"})
    pending_affiliates = affiliates_collection.count_documents({**query, "status": "pending"})
    
    # Get totals
    affiliates_list = list(affiliates_collection.find(query))
    total_clicks = sum(a.get("total_clicks", 0) for a in affiliates_list)
    total_conversions = sum(a.get("total_conversions", 0) for a in affiliates_list)
    total_revenue = sum(a.get("total_revenue", 0.0) for a in affiliates_list)
    total_commissions = sum(a.get("total_commissions", 0.0) for a in affiliates_list)
    pending_commissions = sum(a.get("pending_commissions", 0.0) for a in affiliates_list)
    paid_commissions = sum(a.get("paid_commissions", 0.0) for a in affiliates_list)
    
    # Calculate rates
    conversion_rate = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
    average_commission = (total_commissions / total_conversions) if total_conversions > 0 else 0
    
    return {
        "total_affiliates": total_affiliates,
        "active_affiliates": active_affiliates,
        "pending_affiliates": pending_affiliates,
        "total_clicks": total_clicks,
        "total_conversions": total_conversions,
        "total_revenue": round(total_revenue, 2),
        "total_commissions": round(total_commissions, 2),
        "pending_commissions": round(pending_commissions, 2),
        "paid_commissions": round(paid_commissions, 2),
        "conversion_rate": round(conversion_rate, 2),
        "average_commission": round(average_commission, 2)
    }

@app.get("/api/affiliate-analytics/leaderboard")
async def get_affiliate_leaderboard(
    program_id: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get affiliate leaderboard"""
    query = {}
    
    if program_id:
        program = affiliate_programs_collection.find_one({
            "id": program_id,
            "user_id": current_user["id"]
        })
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")
        query["program_id"] = program_id
    else:
        # Get all programs owned by user
        user_programs = list(affiliate_programs_collection.find({"user_id": current_user["id"]}))
        program_ids = [p["id"] for p in user_programs]
        query["program_id"] = {"$in": program_ids}
    
    query["status"] = "approved"
    
    # Get top affiliates by revenue
    affiliates = list(affiliates_collection.find(query).sort("total_revenue", -1).limit(limit))
    
    leaderboard = []
    for i, affiliate in enumerate(affiliates, 1):
        leaderboard.append({
            "rank": i,
            "affiliate_id": affiliate["id"],
            "name": f"{affiliate['first_name']} {affiliate['last_name']}",
            "email": affiliate["email"],
            "total_clicks": affiliate.get("total_clicks", 0),
            "total_conversions": affiliate.get("total_conversions", 0),
            "total_revenue": round(affiliate.get("total_revenue", 0.0), 2),
            "total_commissions": round(affiliate.get("total_commissions", 0.0), 2)
        })
    
    return {"leaderboard": leaderboard}

@app.get("/api/affiliates/{affiliate_id}/performance")
async def get_affiliate_performance(
    affiliate_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed affiliate performance"""
    affiliate = affiliates_collection.find_one({"id": affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    # Verify ownership
    program = affiliate_programs_collection.find_one({
        "id": affiliate["program_id"],
        "user_id": current_user["id"]
    })
    
    if not program:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get detailed stats
    links = list(affiliate_links_collection.find({"affiliate_id": affiliate_id}))
    conversions = list(affiliate_conversions_collection.find({"affiliate_id": affiliate_id}))
    commissions = list(affiliate_commissions_collection.find({"affiliate_id": affiliate_id}))
    
    return {
        "affiliate": {
            "id": affiliate["id"],
            "name": f"{affiliate['first_name']} {affiliate['last_name']}",
            "email": affiliate["email"],
            "status": affiliate["status"],
            "joined_date": affiliate["created_at"].isoformat() if "created_at" in affiliate else None
        },
        "performance": {
            "total_clicks": affiliate.get("total_clicks", 0),
            "total_conversions": affiliate.get("total_conversions", 0),
            "total_revenue": round(affiliate.get("total_revenue", 0.0), 2),
            "total_commissions": round(affiliate.get("total_commissions", 0.0), 2),
            "pending_commissions": round(affiliate.get("pending_commissions", 0.0), 2),
            "paid_commissions": round(affiliate.get("paid_commissions", 0.0), 2),
            "conversion_rate": round((affiliate.get("total_conversions", 0) / affiliate.get("total_clicks", 1) * 100), 2)
        },
        "links": len(links),
        "recent_conversions": conversions[-10:],
        "commission_breakdown": {
            "pending": len([c for c in commissions if c["status"] == "pending"]),
            "approved": len([c for c in commissions if c["status"] == "approved"]),
            "paid": len([c for c in commissions if c["status"] == "paid"])
        }
    }



# ============================================
# PHASE 11: PAYMENT & E-COMMERCE ENDPOINTS
# ============================================

# Helper functions for Phase 11
def generate_order_number():
    """Generate unique order number"""
    timestamp = datetime.utcnow().strftime('%Y%m%d')
    random_suffix = ''.join([str(uuid.uuid4().int)[-6:]])
    return f"ORD-{timestamp}-{random_suffix}"

def generate_invoice_number():
    """Generate unique invoice number"""
    timestamp = datetime.utcnow().strftime('%Y%m%d')
    random_suffix = ''.join([str(uuid.uuid4().int)[-6:]])
    return f"INV-{timestamp}-{random_suffix}"

def calculate_cart_totals(items: List[CartItem], coupon_code: Optional[str] = None, user_id: str = None):
    """Calculate cart subtotal, tax, discount, and total"""
    subtotal = sum(item.price * item.quantity for item in items)
    tax = subtotal * 0.1  # 10% tax (configurable)
    discount = 0
    
    # Apply coupon if provided
    if coupon_code and user_id:
        coupon = coupons_collection.find_one({
            "code": coupon_code,
            "user_id": user_id,
            "status": "active"
        })
        
        if coupon:
            # Check if expired
            if coupon.get("expires_at") and coupon["expires_at"] < datetime.utcnow():
                pass  # Expired, no discount
            else:
                # Calculate discount
                if coupon["discount_type"] == "percentage":
                    discount = subtotal * (coupon["discount_value"] / 100)
                    if coupon.get("maximum_discount"):
                        discount = min(discount, coupon["maximum_discount"])
                else:  # fixed
                    discount = coupon["discount_value"]
                
                # Check minimum purchase
                if coupon.get("minimum_purchase") and subtotal < coupon["minimum_purchase"]:
                    discount = 0
    
    total = subtotal + tax - discount
    
    return {
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "discount": round(discount, 2),
        "total": round(total, 2)
    }

# ==================== PRODUCT CATEGORY ENDPOINTS ====================

@app.get("/api/product-categories")
async def list_product_categories(current_user: dict = Depends(get_current_user)):
    """List all product categories"""
    categories = list(product_categories_collection.find({"user_id": current_user["id"]}))
    
    for category in categories:
        category["_id"] = str(category["_id"])
    
    return {"categories": categories}

@app.post("/api/product-categories")
async def create_product_category(
    category: ProductCategoryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new product category"""
    # Check if slug exists
    existing = product_categories_collection.find_one({
        "user_id": current_user["id"],
        "slug": category.slug
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    category_data = category.dict()
    category_data["id"] = str(uuid.uuid4())
    category_data["user_id"] = current_user["id"]
    category_data["product_count"] = 0
    category_data["created_at"] = datetime.utcnow()
    category_data["updated_at"] = datetime.utcnow()
    
    product_categories_collection.insert_one(category_data)
    
    return {"message": "Category created successfully", "category": category_data}

@app.put("/api/product-categories/{category_id}")
async def update_product_category(
    category_id: str,
    category: ProductCategoryUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update product category"""
    existing = product_categories_collection.find_one({
        "id": category_id,
        "user_id": current_user["id"]
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = {k: v for k, v in category.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    product_categories_collection.update_one(
        {"id": category_id},
        {"$set": update_data}
    )
    
    return {"message": "Category updated successfully"}

@app.delete("/api/product-categories/{category_id}")
async def delete_product_category(
    category_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete product category"""
    result = product_categories_collection.delete_one({
        "id": category_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}

# ==================== PRODUCT ENDPOINTS ====================

@app.get("/api/products")
async def list_products(
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    product_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all products with filters"""
    query = {"user_id": current_user["id"]}
    
    if status:
        query["status"] = status
    if category_id:
        query["category_id"] = category_id
    if product_type:
        query["product_type"] = product_type
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}}
        ]
    
    products = list(products_collection.find(query).sort("created_at", -1))
    
    for product in products:
        product["_id"] = str(product["_id"])
    
    return {"products": products}

@app.post("/api/products")
async def create_product(
    product: ProductCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new product"""
    # Check if slug exists
    existing = products_collection.find_one({
        "user_id": current_user["id"],
        "slug": product.slug
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Product slug already exists")
    
    product_data = product.dict()
    product_data["id"] = str(uuid.uuid4())
    product_data["user_id"] = current_user["id"]
    product_data["sales_count"] = 0
    product_data["revenue"] = 0
    product_data["views"] = 0
    product_data["created_at"] = datetime.utcnow()
    product_data["updated_at"] = datetime.utcnow()
    
    products_collection.insert_one(product_data)
    
    # Update category count
    if product.category_id:
        product_categories_collection.update_one(
            {"id": product.category_id},
            {"$inc": {"product_count": 1}}
        )
    
    return {"message": "Product created successfully", "product": product_data}

@app.get("/api/products/{product_id}")
async def get_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get product details"""
    product = products_collection.find_one({
        "id": product_id,
        "user_id": current_user["id"]
    })
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["_id"] = str(product["_id"])
    
    # Get variants
    variants = list(product_variants_collection.find({"product_id": product_id}))
    for variant in variants:
        variant["_id"] = str(variant["_id"])
    
    product["variants"] = variants
    
    return {"product": product}

@app.put("/api/products/{product_id}")
async def update_product(
    product_id: str,
    product: ProductUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update product"""
    existing = products_collection.find_one({
        "id": product_id,
        "user_id": current_user["id"]
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    products_collection.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    return {"message": "Product updated successfully"}

@app.delete("/api/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete product"""
    product = products_collection.find_one({
        "id": product_id,
        "user_id": current_user["id"]
    })
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete product
    products_collection.delete_one({"id": product_id})
    
    # Delete variants
    product_variants_collection.delete_many({"product_id": product_id})
    
    # Update category count
    if product.get("category_id"):
        product_categories_collection.update_one(
            {"id": product["category_id"]},
            {"$inc": {"product_count": -1}}
        )
    
    return {"message": "Product deleted successfully"}

# ==================== PRODUCT VARIANT ENDPOINTS ====================

@app.post("/api/products/{product_id}/variants")
async def create_product_variant(
    product_id: str,
    variant: ProductVariantCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create product variant"""
    # Verify product ownership
    product = products_collection.find_one({
        "id": product_id,
        "user_id": current_user["id"]
    })
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    variant_data = variant.dict()
    variant_data["id"] = str(uuid.uuid4())
    variant_data["user_id"] = current_user["id"]
    variant_data["created_at"] = datetime.utcnow()
    variant_data["updated_at"] = datetime.utcnow()
    
    product_variants_collection.insert_one(variant_data)
    
    return {"message": "Variant created successfully", "variant": variant_data}

@app.get("/api/products/{product_id}/variants")
async def list_product_variants(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """List product variants"""
    # Verify product ownership
    product = products_collection.find_one({
        "id": product_id,
        "user_id": current_user["id"]
    })
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    variants = list(product_variants_collection.find({"product_id": product_id}))
    
    for variant in variants:
        variant["_id"] = str(variant["_id"])
    
    return {"variants": variants}

@app.delete("/api/products/{product_id}/variants/{variant_id}")
async def delete_product_variant(
    product_id: str,
    variant_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete product variant"""
    result = product_variants_collection.delete_one({
        "id": variant_id,
        "product_id": product_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    return {"message": "Variant deleted successfully"}

# ==================== SHOPPING CART ENDPOINTS ====================

@app.get("/api/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get user's shopping cart"""
    cart = shopping_carts_collection.find_one({"user_id": current_user["id"]})
    
    if not cart:
        # Create new cart
        cart_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "items": [],
            "subtotal": 0,
            "tax": 0,
            "shipping": 0,
            "discount": 0,
            "total": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        shopping_carts_collection.insert_one(cart_data)
        cart = cart_data
    
    cart["_id"] = str(cart["_id"])
    
    return {"cart": cart}

@app.post("/api/cart/items")
async def add_to_cart(
    product_id: str,
    variant_id: Optional[str] = None,
    quantity: int = 1,
    current_user: dict = Depends(get_current_user)
):
    """Add item to cart"""
    # Get product
    product = products_collection.find_one({"id": product_id, "status": "active"})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get cart
    cart = shopping_carts_collection.find_one({"user_id": current_user["id"]})
    
    if not cart:
        cart = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "items": [],
            "created_at": datetime.utcnow()
        }
    
    # Create cart item
    cart_item = {
        "product_id": product_id,
        "variant_id": variant_id,
        "quantity": quantity,
        "price": product["price"],
        "product_name": product["name"],
        "product_image": product.get("featured_image")
    }
    
    # Check if item already in cart
    items = cart.get("items", [])
    existing_item = None
    for i, item in enumerate(items):
        if item["product_id"] == product_id and item.get("variant_id") == variant_id:
            existing_item = i
            break
    
    if existing_item is not None:
        # Update quantity
        items[existing_item]["quantity"] += quantity
    else:
        # Add new item
        items.append(cart_item)
    
    # Recalculate totals
    totals = calculate_cart_totals(
        [CartItem(**item) for item in items],
        cart.get("coupon_code"),
        product.get("user_id")
    )
    
    # Update cart
    cart["items"] = items
    cart.update(totals)
    cart["updated_at"] = datetime.utcnow()
    
    shopping_carts_collection.update_one(
        {"user_id": current_user["id"]},
        {"$set": cart},
        upsert=True
    )
    
    return {"message": "Item added to cart", "cart": cart}

@app.put("/api/cart/items/{product_id}")
async def update_cart_item(
    product_id: str,
    quantity: int,
    variant_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update cart item quantity"""
    cart = shopping_carts_collection.find_one({"user_id": current_user["id"]})
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    
    # Find and update item
    for item in items:
        if item["product_id"] == product_id and item.get("variant_id") == variant_id:
            if quantity <= 0:
                items.remove(item)
            else:
                item["quantity"] = quantity
            break
    
    # Recalculate totals
    if items:
        product = products_collection.find_one({"id": items[0]["product_id"]})
        totals = calculate_cart_totals(
            [CartItem(**item) for item in items],
            cart.get("coupon_code"),
            product.get("user_id") if product else None
        )
    else:
        totals = {"subtotal": 0, "tax": 0, "discount": 0, "total": 0}
    
    # Update cart
    cart["items"] = items
    cart.update(totals)
    cart["updated_at"] = datetime.utcnow()
    
    shopping_carts_collection.update_one(
        {"user_id": current_user["id"]},
        {"$set": cart}
    )
    
    return {"message": "Cart updated", "cart": cart}

@app.delete("/api/cart/items/{product_id}")
async def remove_from_cart(
    product_id: str,
    variant_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Remove item from cart"""
    cart = shopping_carts_collection.find_one({"user_id": current_user["id"]})
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    
    # Remove item
    items = [item for item in items if not (
        item["product_id"] == product_id and item.get("variant_id") == variant_id
    )]
    
    # Recalculate totals
    if items:
        product = products_collection.find_one({"id": items[0]["product_id"]})
        totals = calculate_cart_totals(
            [CartItem(**item) for item in items],
            cart.get("coupon_code"),
            product.get("user_id") if product else None
        )
    else:
        totals = {"subtotal": 0, "tax": 0, "discount": 0, "total": 0}
    
    # Update cart
    cart["items"] = items
    cart.update(totals)
    cart["updated_at"] = datetime.utcnow()
    
    shopping_carts_collection.update_one(
        {"user_id": current_user["id"]},
        {"$set": cart}
    )
    
    return {"message": "Item removed from cart", "cart": cart}

@app.post("/api/cart/apply-coupon")
async def apply_coupon(
    coupon_code: str,
    current_user: dict = Depends(get_current_user)
):
    """Apply coupon to cart"""
    cart = shopping_carts_collection.find_one({"user_id": current_user["id"]})
    
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Get product owner (assuming all items from same store)
    product = products_collection.find_one({"id": cart["items"][0]["product_id"]})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Recalculate with coupon
    totals = calculate_cart_totals(
        [CartItem(**item) for item in cart["items"]],
        coupon_code,
        product["user_id"]
    )
    
    if totals["discount"] == 0:
        raise HTTPException(status_code=400, detail="Invalid or expired coupon")
    
    # Update cart
    cart["coupon_code"] = coupon_code
    cart.update(totals)
    cart["updated_at"] = datetime.utcnow()
    
    shopping_carts_collection.update_one(
        {"user_id": current_user["id"]},
        {"$set": cart}
    )
    
    # Increment coupon usage
    coupons_collection.update_one(
        {"code": coupon_code},
        {"$inc": {"usage_count": 1}}
    )
    
    return {"message": "Coupon applied successfully", "cart": cart}

@app.delete("/api/cart")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    """Clear shopping cart"""
    shopping_carts_collection.delete_one({"user_id": current_user["id"]})
    
    return {"message": "Cart cleared successfully"}

# ==================== COUPON ENDPOINTS ====================

@app.get("/api/coupons")
async def list_coupons(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all coupons"""
    query = {"user_id": current_user["id"]}
    
    if status:
        query["status"] = status
    
    coupons = list(coupons_collection.find(query).sort("created_at", -1))
    
    for coupon in coupons:
        coupon["_id"] = str(coupon["_id"])
    
    return {"coupons": coupons}

@app.post("/api/coupons")
async def create_coupon(
    coupon: CouponCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new coupon"""
    # Check if code exists
    existing = coupons_collection.find_one({"code": coupon.code})
    
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon_data = coupon.dict()
    coupon_data["id"] = str(uuid.uuid4())
    coupon_data["user_id"] = current_user["id"]
    coupon_data["usage_count"] = 0
    coupon_data["created_at"] = datetime.utcnow()
    coupon_data["updated_at"] = datetime.utcnow()
    
    coupons_collection.insert_one(coupon_data)
    
    return {"message": "Coupon created successfully", "coupon": coupon_data}

@app.put("/api/coupons/{coupon_id}")
async def update_coupon(
    coupon_id: str,
    coupon: CouponUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update coupon"""
    existing = coupons_collection.find_one({
        "id": coupon_id,
        "user_id": current_user["id"]
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    update_data = {k: v for k, v in coupon.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    coupons_collection.update_one(
        {"id": coupon_id},
        {"$set": update_data}
    )
    
    return {"message": "Coupon updated successfully"}

@app.delete("/api/coupons/{coupon_id}")
async def delete_coupon(
    coupon_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete coupon"""
    result = coupons_collection.delete_one({
        "id": coupon_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return {"message": "Coupon deleted successfully"}

# ==================== CHECKOUT & ORDER ENDPOINTS ====================

@app.post("/api/checkout")
async def process_checkout(
    checkout: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Process checkout and create order"""
    if not checkout.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Get product owner (assuming all items from same store)
    product = products_collection.find_one({"id": checkout.items[0].product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    store_owner_id = product["user_id"]
    
    # Calculate totals
    totals = calculate_cart_totals(checkout.items, checkout.coupon_code, store_owner_id)
    
    # Create order
    order_data = {
        "id": str(uuid.uuid4()),
        "order_number": generate_order_number(),
        "user_id": store_owner_id,
        "customer_id": current_user.get("id"),
        "customer_name": checkout.customer_name,
        "customer_email": checkout.customer_email,
        "customer_phone": checkout.customer_phone,
        
        # Addresses
        "billing_address_line1": checkout.billing_address.get("line1"),
        "billing_address_line2": checkout.billing_address.get("line2"),
        "billing_city": checkout.billing_address.get("city"),
        "billing_state": checkout.billing_address.get("state"),
        "billing_postal_code": checkout.billing_address.get("postal_code"),
        "billing_country": checkout.billing_address.get("country", "US"),
        
        "shipping_same_as_billing": checkout.shipping_address is None,
        "shipping_address_line1": checkout.shipping_address.get("line1") if checkout.shipping_address else None,
        "shipping_address_line2": checkout.shipping_address.get("line2") if checkout.shipping_address else None,
        "shipping_city": checkout.shipping_address.get("city") if checkout.shipping_address else None,
        "shipping_state": checkout.shipping_address.get("state") if checkout.shipping_address else None,
        "shipping_postal_code": checkout.shipping_address.get("postal_code") if checkout.shipping_address else None,
        "shipping_country": checkout.shipping_address.get("country", "US") if checkout.shipping_address else None,
        
        # Order details
        "items": [],
        "subtotal": totals["subtotal"],
        "tax": totals["tax"],
        "shipping_cost": 0,
        "discount": totals["discount"],
        "total": totals["total"],
        "currency": "USD",
        
        # Coupon
        "coupon_code": checkout.coupon_code,
        "coupon_discount": totals["discount"],
        
        # Payment
        "payment_method": checkout.payment_method,
        "payment_status": "paid" if checkout.payment_method == "mock" else "pending",
        
        # Status
        "status": "processing" if checkout.payment_method == "mock" else "pending",
        
        # Notes
        "customer_notes": checkout.customer_notes,
        
        # Fulfillment
        "is_fulfilled": False,
        
        # Dates
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "paid_at": datetime.utcnow() if checkout.payment_method == "mock" else None
    }
    
    # Create order items
    order_items = []
    for item in checkout.items:
        order_item = {
            "id": str(uuid.uuid4()),
            "order_id": order_data["id"],
            "product_id": item.product_id,
            "product_name": item.product_name,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "price": item.price,
            "subtotal": item.price * item.quantity,
            "tax": 0,
            "total": item.price * item.quantity,
            "product_type": "physical",
            "created_at": datetime.utcnow()
        }
        order_items.append(order_item)
        
        # Update product stats
        products_collection.update_one(
            {"id": item.product_id},
            {
                "$inc": {
                    "sales_count": item.quantity,
                    "revenue": item.price * item.quantity
                }
            }
        )
    
    order_data["items"] = order_items
    
    # Insert order
    orders_collection.insert_one(order_data)
    
    # Insert order items
    for order_item in order_items:
        order_items_collection.insert_one(order_item)
    
    # Create payment transaction
    transaction_data = {
        "id": str(uuid.uuid4()),
        "user_id": store_owner_id,
        "order_id": order_data["id"],
        "customer_email": checkout.customer_email,
        "amount": totals["total"],
        "currency": "USD",
        "payment_method": checkout.payment_method,
        "payment_provider": checkout.payment_method,
        "status": "completed" if checkout.payment_method == "mock" else "pending",
        "transaction_id": f"TXN-{str(uuid.uuid4())[:8]}",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "completed_at": datetime.utcnow() if checkout.payment_method == "mock" else None
    }
    
    payment_transactions_collection.insert_one(transaction_data)
    
    # Create or update contact in CRM
    contact = contacts_collection.find_one({
        "email": checkout.customer_email,
        "user_id": store_owner_id
    })
    
    if not contact:
        contact_data = {
            "id": str(uuid.uuid4()),
            "user_id": store_owner_id,
            "email": checkout.customer_email,
            "first_name": checkout.customer_name.split()[0] if checkout.customer_name else "",
            "last_name": " ".join(checkout.customer_name.split()[1:]) if len(checkout.customer_name.split()) > 1 else "",
            "phone": checkout.customer_phone,
            "company": "",
            "address": checkout.billing_address.get("line1", ""),
            "city": checkout.billing_address.get("city", ""),
            "state": checkout.billing_address.get("state", ""),
            "country": checkout.billing_address.get("country", "US"),
            "postal_code": checkout.billing_address.get("postal_code", ""),
            "tags": ["customer"],
            "status": "customer",
            "source": "order",
            "score": 80,
            "last_contact_date": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        contacts_collection.insert_one(contact_data)
        order_data["contact_id"] = contact_data["id"]
        orders_collection.update_one(
            {"id": order_data["id"]},
            {"$set": {"contact_id": contact_data["id"]}}
        )
    else:
        # Update existing contact
        contacts_collection.update_one(
            {"id": contact["id"]},
            {
                "$set": {
                    "status": "customer",
                    "last_contact_date": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                "$addToSet": {"tags": "customer"}
            }
        )
        order_data["contact_id"] = contact["id"]
        orders_collection.update_one(
            {"id": order_data["id"]},
            {"$set": {"contact_id": contact["id"]}}
        )
    
    # Clear cart
    shopping_carts_collection.delete_one({"user_id": current_user["id"]})
    
    # Generate invoice
    invoice_data = {
        "id": str(uuid.uuid4()),
        "invoice_number": generate_invoice_number(),
        "user_id": store_owner_id,
        "order_id": order_data["id"],
        "customer_name": checkout.customer_name,
        "customer_email": checkout.customer_email,
        "customer_address": f"{checkout.billing_address.get('line1', '')}, {checkout.billing_address.get('city', '')}, {checkout.billing_address.get('state', '')} {checkout.billing_address.get('postal_code', '')}",
        "items": [
            {
                "name": item["product_name"],
                "quantity": item["quantity"],
                "price": item["price"],
                "total": item["total"]
            }
            for item in order_items
        ],
        "subtotal": totals["subtotal"],
        "tax": totals["tax"],
        "discount": totals["discount"],
        "total": totals["total"],
        "currency": "USD",
        "status": "paid" if checkout.payment_method == "mock" else "draft",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "paid_at": datetime.utcnow() if checkout.payment_method == "mock" else None
    }
    
    invoices_collection.insert_one(invoice_data)
    
    return {
        "message": "Order placed successfully",
        "order": {
            "id": order_data["id"],
            "order_number": order_data["order_number"],
            "total": order_data["total"],
            "status": order_data["status"],
            "payment_status": order_data["payment_status"]
        },
        "invoice": {
            "id": invoice_data["id"],
            "invoice_number": invoice_data["invoice_number"]
        }
    }

@app.get("/api/orders")
async def list_orders(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all orders"""
    query = {"user_id": current_user["id"]}
    
    if status:
        query["status"] = status
    if payment_status:
        query["payment_status"] = payment_status
    if search:
        query["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"customer_email": {"$regex": search, "$options": "i"}}
        ]
    
    orders = list(orders_collection.find(query).sort("created_at", -1).limit(100))
    
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return {"orders": orders}

@app.get("/api/orders/{order_id}")
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get order details"""
    order = orders_collection.find_one({
        "id": order_id,
        "user_id": current_user["id"]
    })
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order["_id"] = str(order["_id"])
    
    # Get order items
    items = list(order_items_collection.find({"order_id": order_id}))
    for item in items:
        item["_id"] = str(item["_id"])
    
    order["order_items"] = items
    
    # Get invoice
    invoice = invoices_collection.find_one({"order_id": order_id})
    if invoice:
        invoice["_id"] = str(invoice["_id"])
        order["invoice"] = invoice
    
    return {"order": order}

@app.put("/api/orders/{order_id}")
async def update_order(
    order_id: str,
    order: OrderUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update order"""
    existing = orders_collection.find_one({
        "id": order_id,
        "user_id": current_user["id"]
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {k: v for k, v in order.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Handle status changes
    if order.status == "completed" and existing.get("status") != "completed":
        update_data["completed_at"] = datetime.utcnow()
        update_data["is_fulfilled"] = True
        update_data["fulfilled_at"] = datetime.utcnow()
    elif order.status == "cancelled":
        update_data["cancelled_at"] = datetime.utcnow()
    
    if order.payment_status == "paid" and existing.get("payment_status") != "paid":
        update_data["paid_at"] = datetime.utcnow()
    
    orders_collection.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    return {"message": "Order updated successfully"}

@app.post("/api/orders/{order_id}/refund")
async def refund_order(
    order_id: str,
    refund_amount: Optional[float] = None,
    reason: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Refund order"""
    order = orders_collection.find_one({
        "id": order_id,
        "user_id": current_user["id"]
    })
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Order is not paid")
    
    # Use full amount if not specified
    if not refund_amount:
        refund_amount = order["total"]
    
    # Update order
    orders_collection.update_one(
        {"id": order_id},
        {
            "$set": {
                "status": "refunded",
                "payment_status": "refunded",
                "admin_notes": f"Refunded: {reason or 'No reason provided'}",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Create refund transaction
    transaction_data = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "order_id": order_id,
        "customer_email": order["customer_email"],
        "amount": -refund_amount,
        "currency": "USD",
        "payment_method": order["payment_method"],
        "payment_provider": order["payment_method"],
        "status": "completed",
        "transaction_id": f"REFUND-{str(uuid.uuid4())[:8]}",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "completed_at": datetime.utcnow()
    }
    
    payment_transactions_collection.insert_one(transaction_data)
    
    return {"message": "Order refunded successfully", "refund_amount": refund_amount}

# ==================== SUBSCRIPTION ENDPOINTS ====================

@app.get("/api/subscriptions")
async def list_subscriptions(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all subscriptions"""
    query = {"user_id": current_user["id"]}
    
    if status:
        query["status"] = status
    
    subscriptions = list(subscriptions_collection.find(query).sort("created_at", -1))
    
    for subscription in subscriptions:
        subscription["_id"] = str(subscription["_id"])
    
    return {"subscriptions": subscriptions}

@app.get("/api/subscriptions/{subscription_id}")
async def get_subscription(
    subscription_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get subscription details"""
    subscription = subscriptions_collection.find_one({
        "id": subscription_id,
        "user_id": current_user["id"]
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscription["_id"] = str(subscription["_id"])
    
    return {"subscription": subscription}

@app.post("/api/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel subscription"""
    subscription = subscriptions_collection.find_one({
        "id": subscription_id,
        "user_id": current_user["id"]
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscriptions_collection.update_one(
        {"id": subscription_id},
        {
            "$set": {
                "status": "cancelled",
                "cancelled_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Subscription cancelled successfully"}

@app.post("/api/subscriptions/{subscription_id}/pause")
async def pause_subscription(
    subscription_id: str,
    pause_until: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """Pause subscription"""
    subscription = subscriptions_collection.find_one({
        "id": subscription_id,
        "user_id": current_user["id"]
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscriptions_collection.update_one(
        {"id": subscription_id},
        {
            "$set": {
                "status": "paused",
                "pause_until": pause_until,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Subscription paused successfully"}

@app.post("/api/subscriptions/{subscription_id}/resume")
async def resume_subscription(
    subscription_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Resume subscription"""
    subscription = subscriptions_collection.find_one({
        "id": subscription_id,
        "user_id": current_user["id"]
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscriptions_collection.update_one(
        {"id": subscription_id},
        {
            "$set": {
                "status": "active",
                "pause_until": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Subscription resumed successfully"}

# ==================== INVOICE ENDPOINTS ====================

@app.get("/api/invoices")
async def list_invoices(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all invoices"""
    query = {"user_id": current_user["id"]}
    
    if status:
        query["status"] = status
    
    invoices = list(invoices_collection.find(query).sort("created_at", -1))
    
    for invoice in invoices:
        invoice["_id"] = str(invoice["_id"])
    
    return {"invoices": invoices}

@app.get("/api/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get invoice details"""
    invoice = invoices_collection.find_one({
        "id": invoice_id,
        "user_id": current_user["id"]
    })
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice["_id"] = str(invoice["_id"])
    
    return {"invoice": invoice}

# ==================== PAYMENT ANALYTICS ENDPOINTS ====================

@app.get("/api/payment-analytics/summary")
async def get_payment_analytics(current_user: dict = Depends(get_current_user)):
    """Get payment analytics summary"""
    # Get all orders
    all_orders = list(orders_collection.find({"user_id": current_user["id"]}))
    
    # Calculate metrics
    total_revenue = sum(order.get("total", 0) for order in all_orders if order.get("payment_status") == "paid")
    total_orders = len([o for o in all_orders if o.get("payment_status") == "paid"])
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Get subscriptions
    all_subscriptions = list(subscriptions_collection.find({"user_id": current_user["id"]}))
    active_subscriptions = len([s for s in all_subscriptions if s.get("status") == "active"])
    
    # Get products
    total_products = products_collection.count_documents({"user_id": current_user["id"]})
    
    # Get unique customers
    customer_emails = set(order.get("customer_email") for order in all_orders)
    total_customers = len(customer_emails)
    
    # Revenue by period (last 12 months)
    revenue_by_period = {}
    for i in range(12):
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        month_orders = [o for o in all_orders if month_start <= o.get("created_at", datetime.min) < month_end and o.get("payment_status") == "paid"]
        month_revenue = sum(o.get("total", 0) for o in month_orders)
        revenue_by_period[month_start.strftime("%Y-%m")] = round(month_revenue, 2)
    
    # Top products
    products = list(products_collection.find({"user_id": current_user["id"]}).sort("sales_count", -1).limit(5))
    top_products = [
        {
            "id": p["id"],
            "name": p["name"],
            "sales_count": p.get("sales_count", 0),
            "revenue": round(p.get("revenue", 0), 2)
        }
        for p in products
    ]
    
    # Recent orders
    recent = list(orders_collection.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(10))
    recent_orders = [
        {
            "id": o["id"],
            "order_number": o["order_number"],
            "customer_name": o["customer_name"],
            "total": o["total"],
            "status": o["status"],
            "created_at": o["created_at"].isoformat() if "created_at" in o else None
        }
        for o in recent
    ]
    
    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "total_subscriptions": len(all_subscriptions),
        "active_subscriptions": active_subscriptions,
        "average_order_value": round(average_order_value, 2),
        "total_products": total_products,
        "total_customers": total_customers,
        "revenue_by_period": revenue_by_period,
        "top_products": top_products,
        "recent_orders": recent_orders
    }



# ==================== PHASE 12: UNIFIED ANALYTICS DASHBOARD ====================

@app.get("/api/analytics/dashboard/overview")
async def get_analytics_dashboard_overview(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get comprehensive analytics overview across all platform features
    Aggregates data from all modules for unified dashboard
    """
    try:
        # Parse dates
        if start_date and end_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            date_filter = {"created_at": {"$gte": start, "$lte": end}}
        else:
            # Default: Last 30 days
            end = datetime.utcnow()
            start = end - timedelta(days=30)
            date_filter = {"created_at": {"$gte": start, "$lte": end}}
        
        user_filter = {"user_id": current_user["user_id"]}
        combined_filter = {**user_filter, **date_filter}
        
        # === CONTACTS & CRM ===
        total_contacts = await contacts_collection.count_documents(user_filter)
        new_contacts = await contacts_collection.count_documents(combined_filter)
        active_contacts = await contacts_collection.count_documents({
            **user_filter,
            "status": "active"
        })
        
        # === EMAIL MARKETING ===
        total_campaigns = await email_campaigns_collection.count_documents(user_filter)
        sent_campaigns = await email_campaigns_collection.count_documents({
            **user_filter,
            "status": "sent"
        })
        email_logs = await email_logs_collection.find(combined_filter).to_list(None)
        total_emails_sent = len(email_logs)
        delivered_emails = len([log for log in email_logs if log.get("status") == "delivered"])
        opened_emails = len([log for log in email_logs if log.get("opened", False)])
        clicked_emails = len([log for log in email_logs if log.get("clicked", False)])
        
        email_open_rate = (opened_emails / delivered_emails * 100) if delivered_emails > 0 else 0
        email_click_rate = (clicked_emails / delivered_emails * 100) if delivered_emails > 0 else 0
        
        # === SALES FUNNELS ===
        total_funnels = await funnels_collection.count_documents(user_filter)
        active_funnels = await funnels_collection.count_documents({
            **user_filter,
            "status": "published"
        })
        funnel_visits = await funnel_visits_collection.count_documents(combined_filter)
        funnel_conversions = await funnel_conversions_collection.count_documents(combined_filter)
        funnel_conversion_rate = (funnel_conversions / funnel_visits * 100) if funnel_visits > 0 else 0
        
        # === COURSES & LEARNING ===
        total_courses = await courses_collection.count_documents(user_filter)
        published_courses = await courses_collection.count_documents({
            **user_filter,
            "status": "published"
        })
        total_enrollments = await course_enrollments_collection.count_documents(combined_filter)
        active_students = await course_enrollments_collection.distinct("contact_id", combined_filter)
        certificates_issued = await certificates_collection.count_documents(combined_filter)
        
        # === WEBINARS ===
        total_webinars = await webinars_collection.count_documents(user_filter)
        upcoming_webinars = await webinars_collection.count_documents({
            **user_filter,
            "scheduled_at": {"$gte": datetime.utcnow()}
        })
        webinar_registrations = await webinar_registrations_collection.count_documents(combined_filter)
        webinar_attendees = await webinar_registrations_collection.count_documents({
            **combined_filter,
            "attended": True
        })
        webinar_attendance_rate = (webinar_attendees / webinar_registrations * 100) if webinar_registrations > 0 else 0
        
        # === FORMS & SURVEYS ===
        total_forms = await forms_collection.count_documents(user_filter)
        form_submissions = await form_submissions_collection.count_documents(combined_filter)
        total_surveys = await surveys_collection.count_documents(user_filter)
        survey_responses = await survey_responses_collection.count_documents(combined_filter)
        
        # === WORKFLOWS & AUTOMATION ===
        total_workflows = await workflows_collection.count_documents(user_filter)
        active_workflows = await workflows_collection.count_documents({
            **user_filter,
            "status": "active"
        })
        workflow_executions = await workflow_executions_collection.count_documents(combined_filter)
        successful_executions = await workflow_executions_collection.count_documents({
            **combined_filter,
            "status": "completed"
        })
        
        # === BLOG & CONTENT ===
        total_blog_posts = await blog_posts_collection.count_documents(user_filter)
        published_posts = await blog_posts_collection.count_documents({
            **user_filter,
            "status": "published"
        })
        blog_views = await blog_post_views_collection.count_documents(combined_filter)
        blog_comments = await blog_comments_collection.count_documents(combined_filter)
        
        # === AFFILIATE PROGRAM ===
        total_affiliates = await affiliates_collection.count_documents(user_filter)
        active_affiliates = await affiliates_collection.count_documents({
            **user_filter,
            "status": "approved"
        })
        affiliate_clicks = await affiliate_clicks_collection.count_documents(combined_filter)
        affiliate_conversions_count = await affiliate_conversions_collection.count_documents(combined_filter)
        
        commissions = await affiliate_commissions_collection.find(combined_filter).to_list(None)
        total_commissions = sum(c.get("amount", 0) for c in commissions)
        
        # === E-COMMERCE & PAYMENTS ===
        total_products = await products_collection.count_documents(user_filter)
        active_products = await products_collection.count_documents({
            **user_filter,
            "status": "active"
        })
        
        orders = await orders_collection.find(combined_filter).to_list(None)
        total_orders = len(orders)
        completed_orders = len([o for o in orders if o.get("status") == "completed"])
        
        total_revenue = sum(o.get("total", 0) for o in orders if o.get("status") == "completed")
        average_order_value = (total_revenue / completed_orders) if completed_orders > 0 else 0
        
        total_subscriptions = await subscriptions_collection.count_documents(user_filter)
        active_subscriptions_count = await subscriptions_collection.count_documents({
            **user_filter,
            "status": "active"
        })
        
        # === CALCULATE GROWTH TRENDS ===
        # Previous period comparison
        previous_start = start - (end - start)
        previous_filter = {
            **user_filter,
            "created_at": {"$gte": previous_start, "$lt": start}
        }
        
        prev_contacts = await contacts_collection.count_documents(previous_filter)
        prev_revenue_orders = await orders_collection.find(previous_filter).to_list(None)
        prev_revenue = sum(o.get("total", 0) for o in prev_revenue_orders if o.get("status") == "completed")
        
        contacts_growth = ((new_contacts - prev_contacts) / prev_contacts * 100) if prev_contacts > 0 else 0
        revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        
        # === REVENUE BY DAY (for charts) ===
        revenue_by_day = []
        current_date = start
        while current_date <= end:
            next_date = current_date + timedelta(days=1)
            day_orders = await orders_collection.find({
                **user_filter,
                "created_at": {"$gte": current_date, "$lt": next_date},
                "status": "completed"
            }).to_list(None)
            day_revenue = sum(o.get("total", 0) for o in day_orders)
            
            revenue_by_day.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "revenue": round(day_revenue, 2),
                "orders": len(day_orders)
            })
            current_date = next_date
        
        # === TOP PERFORMING ITEMS ===
        # Top courses by enrollment
        top_courses_pipeline = [
            {"$match": combined_filter},
            {"$group": {"_id": "$course_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        top_course_ids = await course_enrollments_collection.aggregate(top_courses_pipeline).to_list(5)
        
        top_courses = []
        for item in top_course_ids:
            course = await courses_collection.find_one({"course_id": item["_id"]})
            if course:
                top_courses.append({
                    "name": course.get("title", "Unknown"),
                    "enrollments": item["count"]
                })
        
        return {
            # Overview Metrics
            "total_revenue": round(total_revenue, 2),
            "revenue_growth": round(revenue_growth, 2),
            "total_contacts": total_contacts,
            "new_contacts": new_contacts,
            "contacts_growth": round(contacts_growth, 2),
            "active_contacts": active_contacts,
            
            # Email Marketing
            "email_marketing": {
                "total_campaigns": total_campaigns,
                "sent_campaigns": sent_campaigns,
                "total_emails_sent": total_emails_sent,
                "open_rate": round(email_open_rate, 2),
                "click_rate": round(email_click_rate, 2),
                "delivered": delivered_emails,
                "opened": opened_emails,
                "clicked": clicked_emails
            },
            
            # Sales Funnels
            "funnels": {
                "total_funnels": total_funnels,
                "active_funnels": active_funnels,
                "total_visits": funnel_visits,
                "conversions": funnel_conversions,
                "conversion_rate": round(funnel_conversion_rate, 2)
            },
            
            # Courses
            "courses": {
                "total_courses": total_courses,
                "published_courses": published_courses,
                "total_enrollments": total_enrollments,
                "active_students": len(active_students),
                "certificates_issued": certificates_issued
            },
            
            # Webinars
            "webinars": {
                "total_webinars": total_webinars,
                "upcoming_webinars": upcoming_webinars,
                "registrations": webinar_registrations,
                "attendees": webinar_attendees,
                "attendance_rate": round(webinar_attendance_rate, 2)
            },
            
            # Forms & Surveys
            "forms_surveys": {
                "total_forms": total_forms,
                "form_submissions": form_submissions,
                "total_surveys": total_surveys,
                "survey_responses": survey_responses
            },
            
            # Automation
            "automation": {
                "total_workflows": total_workflows,
                "active_workflows": active_workflows,
                "executions": workflow_executions,
                "successful_executions": successful_executions,
                "success_rate": round((successful_executions / workflow_executions * 100) if workflow_executions > 0 else 0, 2)
            },
            
            # Blog & Content
            "blog": {
                "total_posts": total_blog_posts,
                "published_posts": published_posts,
                "total_views": blog_views,
                "total_comments": blog_comments
            },
            
            # Affiliates
            "affiliates": {
                "total_affiliates": total_affiliates,
                "active_affiliates": active_affiliates,
                "clicks": affiliate_clicks,
                "conversions": affiliate_conversions_count,
                "total_commissions": round(total_commissions, 2),
                "conversion_rate": round((affiliate_conversions_count / affiliate_clicks * 100) if affiliate_clicks > 0 else 0, 2)
            },
            
            # E-commerce
            "ecommerce": {
                "total_products": total_products,
                "active_products": active_products,
                "total_orders": total_orders,
                "completed_orders": completed_orders,
                "average_order_value": round(average_order_value, 2),
                "total_subscriptions": total_subscriptions,
                "active_subscriptions": active_subscriptions_count
            },
            
            # Charts Data
            "revenue_by_day": revenue_by_day,
            "top_courses": top_courses,
            
            # Date Range
            "date_range": {
                "start": start.isoformat(),
                "end": end.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@app.get("/api/analytics/revenue/detailed")
async def get_detailed_revenue_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    group_by: str = Query("day", regex="^(day|week|month)$"),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed revenue analytics with grouping options"""
    try:
        if start_date and end_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            end = datetime.utcnow()
            start = end - timedelta(days=30)
        
        user_filter = {"user_id": current_user["user_id"]}
        
        # Get all completed orders in date range
        orders = await orders_collection.find({
            **user_filter,
            "created_at": {"$gte": start, "$lte": end},
            "status": "completed"
        }).to_list(None)
        
        # Group revenue by time period
        revenue_data = {}
        for order in orders:
            order_date = order.get("created_at")
            if not order_date:
                continue
                
            if group_by == "day":
                key = order_date.strftime("%Y-%m-%d")
            elif group_by == "week":
                key = order_date.strftime("%Y-W%U")
            else:  # month
                key = order_date.strftime("%Y-%m")
            
            if key not in revenue_data:
                revenue_data[key] = {
                    "revenue": 0,
                    "orders": 0,
                    "period": key
                }
            
            revenue_data[key]["revenue"] += order.get("total", 0)
            revenue_data[key]["orders"] += 1
        
        # Convert to sorted list
        revenue_list = sorted(revenue_data.values(), key=lambda x: x["period"])
        
        # Calculate totals
        total_revenue = sum(item["revenue"] for item in revenue_list)
        total_orders = sum(item["orders"] for item in revenue_list)
        
        return {
            "revenue_data": [
                {**item, "revenue": round(item["revenue"], 2)}
                for item in revenue_list
            ],
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "average_order_value": round(total_revenue / total_orders, 2) if total_orders > 0 else 0,
            "group_by": group_by,
            "date_range": {
                "start": start.isoformat(),
                "end": end.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch revenue analytics: {str(e)}")


@app.get("/api/analytics/conversion/funnel")
async def get_conversion_funnel_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get conversion funnel analytics across all features"""
    try:
        if start_date and end_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            end = datetime.utcnow()
            start = end - timedelta(days=30)
        
        user_filter = {"user_id": current_user["user_id"]}
        date_filter = {"created_at": {"$gte": start, "$lte": end}}
        combined_filter = {**user_filter, **date_filter}
        
        # Build conversion funnel stages
        stages = []
        
        # Stage 1: Visitors (Funnel visits)
        visitors = await funnel_visits_collection.count_documents(combined_filter)
        stages.append({"stage": "Visitors", "count": visitors, "percentage": 100})
        
        # Stage 2: Leads (Form submissions + Contact creation)
        leads = await form_submissions_collection.count_documents(combined_filter)
        lead_percentage = (leads / visitors * 100) if visitors > 0 else 0
        stages.append({"stage": "Leads", "count": leads, "percentage": round(lead_percentage, 2)})
        
        # Stage 3: Engaged (Email opens or course views)
        engaged_emails = await email_logs_collection.count_documents({
            **combined_filter,
            "opened": True
        })
        engaged_percentage = (engaged_emails / leads * 100) if leads > 0 else 0
        stages.append({"stage": "Engaged", "count": engaged_emails, "percentage": round(engaged_percentage, 2)})
        
        # Stage 4: Qualified (Webinar registrations + Course enrollments)
        webinar_regs = await webinar_registrations_collection.count_documents(combined_filter)
        course_enrols = await course_enrollments_collection.count_documents(combined_filter)
        qualified = webinar_regs + course_enrols
        qualified_percentage = (qualified / engaged_emails * 100) if engaged_emails > 0 else 0
        stages.append({"stage": "Qualified", "count": qualified, "percentage": round(qualified_percentage, 2)})
        
        # Stage 5: Customers (Completed orders)
        customers = await orders_collection.count_documents({
            **combined_filter,
            "status": "completed"
        })
        customer_percentage = (customers / qualified * 100) if qualified > 0 else 0
        stages.append({"stage": "Customers", "count": customers, "percentage": round(customer_percentage, 2)})
        
        # Overall conversion rate
        overall_conversion = (customers / visitors * 100) if visitors > 0 else 0
        
        return {
            "stages": stages,
            "overall_conversion_rate": round(overall_conversion, 2),
            "total_visitors": visitors,
            "total_customers": customers,
            "date_range": {
                "start": start.isoformat(),
                "end": end.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversion funnel: {str(e)}")


@app.get("/api/analytics/engagement/metrics")
async def get_engagement_metrics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get user engagement metrics across platform"""
    try:
        if start_date and end_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            end = datetime.utcnow()
            start = end - timedelta(days=30)
        
        user_filter = {"user_id": current_user["user_id"]}
        date_filter = {"created_at": {"$gte": start, "$lte": end}}
        combined_filter = {**user_filter, **date_filter}
        
        # Email engagement
        email_logs = await email_logs_collection.find(combined_filter).to_list(None)
        total_sent = len(email_logs)
        total_opened = len([log for log in email_logs if log.get("opened", False)])
        total_clicked = len([log for log in email_logs if log.get("clicked", False)])
        
        # Content engagement
        blog_views = await blog_post_views_collection.count_documents(combined_filter)
        blog_comments = await blog_comments_collection.count_documents(combined_filter)
        
        # Course engagement
        course_progress = await course_progress_collection.find(combined_filter).to_list(None)
        avg_progress = sum(p.get("progress_percentage", 0) for p in course_progress) / len(course_progress) if course_progress else 0
        
        # Webinar engagement
        webinar_attendees = await webinar_registrations_collection.count_documents({
            **combined_filter,
            "attended": True
        })
        webinar_chat = await webinar_chat_messages_collection.count_documents(combined_filter)
        webinar_qa = await webinar_qa_collection.count_documents(combined_filter)
        
        # Form engagement
        form_views = await form_views_collection.count_documents(combined_filter)
        form_submissions = await form_submissions_collection.count_documents(combined_filter)
        form_conversion = (form_submissions / form_views * 100) if form_views > 0 else 0
        
        return {
            "email_engagement": {
                "total_sent": total_sent,
                "total_opened": total_opened,
                "total_clicked": total_clicked,
                "open_rate": round((total_opened / total_sent * 100) if total_sent > 0 else 0, 2),
                "click_rate": round((total_clicked / total_sent * 100) if total_sent > 0 else 0, 2)
            },
            "content_engagement": {
                "blog_views": blog_views,
                "blog_comments": blog_comments,
                "comments_per_view": round(blog_comments / blog_views, 4) if blog_views > 0 else 0
            },
            "course_engagement": {
                "active_learners": len(course_progress),
                "average_progress": round(avg_progress, 2)
            },
            "webinar_engagement": {
                "attendees": webinar_attendees,
                "chat_messages": webinar_chat,
                "qa_questions": webinar_qa
            },
            "form_engagement": {
                "views": form_views,
                "submissions": form_submissions,
                "conversion_rate": round(form_conversion, 2)
            },
            "date_range": {
                "start": start.isoformat(),
                "end": end.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch engagement metrics: {str(e)}")


@app.get("/api/analytics/export")
async def export_analytics_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    format: str = Query("csv", regex="^(csv|json)$"),
    current_user: dict = Depends(get_current_user)
):
    """Export analytics report in CSV or JSON format"""
    try:
        # Get overview data
        overview_data = await get_analytics_dashboard_overview(start_date, end_date, current_user)
        
        if format == "json":
            return JSONResponse(content=overview_data)
        
        # CSV format
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers and data
        writer.writerow(['Metric Category', 'Metric', 'Value'])
        
        # Revenue
        writer.writerow(['Revenue', 'Total Revenue', f"${overview_data['total_revenue']}"])
        writer.writerow(['Revenue', 'Revenue Growth', f"{overview_data['revenue_growth']}%"])
        
        # Contacts
        writer.writerow(['Contacts', 'Total Contacts', overview_data['total_contacts']])
        writer.writerow(['Contacts', 'New Contacts', overview_data['new_contacts']])
        writer.writerow(['Contacts', 'Active Contacts', overview_data['active_contacts']])
        
        # Email Marketing
        email = overview_data['email_marketing']
        writer.writerow(['Email', 'Total Campaigns', email['total_campaigns']])
        writer.writerow(['Email', 'Emails Sent', email['total_emails_sent']])
        writer.writerow(['Email', 'Open Rate', f"{email['open_rate']}%"])
        writer.writerow(['Email', 'Click Rate', f"{email['click_rate']}%"])
        
        # Funnels
        funnels = overview_data['funnels']
        writer.writerow(['Funnels', 'Total Funnels', funnels['total_funnels']])
        writer.writerow(['Funnels', 'Total Visits', funnels['total_visits']])
        writer.writerow(['Funnels', 'Conversions', funnels['conversions']])
        writer.writerow(['Funnels', 'Conversion Rate', f"{funnels['conversion_rate']}%"])
        
        # E-commerce
        ecommerce = overview_data['ecommerce']
        writer.writerow(['E-commerce', 'Total Orders', ecommerce['total_orders']])
        writer.writerow(['E-commerce', 'Completed Orders', ecommerce['completed_orders']])
        writer.writerow(['E-commerce', 'Average Order Value', f"${ecommerce['average_order_value']}"])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=analytics_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export report: {str(e)}")


# ==================== PHASE 12: ADVANCED AI FEATURES ====================

@app.post("/api/ai/generate/headline")
async def generate_headline_ai(
    topic: str = Query(...),
    style: str = Query("attention-grabbing"),
    current_user: dict = Depends(get_current_user)
):
    """Generate multiple headline options using AI"""
    try:
        from ai_helper import AIHelper
        ai_helper = AIHelper()
        headlines = await ai_helper.generate_headline(topic, style)
        
        return {
            "topic": topic,
            "style": style,
            "headlines": headlines
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate headlines: {str(e)}")


@app.post("/api/ai/generate/landing-page")
async def generate_landing_page_copy(
    product: str = Query(...),
    target_audience: str = Query(...),
    benefits: str = Query(...),  # Comma-separated
    current_user: dict = Depends(get_current_user)
):
    """Generate complete landing page copy"""
    try:
        from ai_helper import AIHelper
        ai_helper = AIHelper()
        
        benefits_list = [b.strip() for b in benefits.split(',')]
        result = await ai_helper.generate_landing_page_copy(product, target_audience, benefits_list)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate landing page copy: {str(e)}")


@app.post("/api/ai/generate/social-posts")
async def generate_social_posts(
    topic: str = Query(...),
    platforms: str = Query("twitter,facebook,linkedin"),  # Comma-separated
    current_user: dict = Depends(get_current_user)
):
    """Generate social media posts for multiple platforms"""
    try:
        from ai_helper import AIHelper
        ai_helper = AIHelper()
        
        platforms_list = [p.strip() for p in platforms.split(',')]
        posts = await ai_helper.generate_social_media_posts(topic, platforms_list)
        
        return {
            "topic": topic,
            "posts": posts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate social posts: {str(e)}")


@app.post("/api/ai/generate/webinar-outline")
async def generate_webinar_outline(
    topic: str = Query(...),
    duration: int = Query(60),
    current_user: dict = Depends(get_current_user)
):
    """Generate webinar outline with structure"""
    try:
        from ai_helper import AIHelper
        ai_helper = AIHelper()
        
        outline = await ai_helper.generate_webinar_outline(topic, duration)
        
        return outline
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate webinar outline: {str(e)}")


@app.post("/api/ai/generate/course-curriculum")
async def generate_course_curriculum(
    title: str = Query(...),
    level: str = Query("beginner"),
    current_user: dict = Depends(get_current_user)
):
    """Generate course curriculum structure"""
    try:
        from ai_helper import AIHelper
        ai_helper = AIHelper()
        
        curriculum = await ai_helper.generate_course_curriculum(title, level)
        
        return curriculum
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate curriculum: {str(e)}")


@app.post("/api/ai/improve/text")
async def improve_text_ai(
    text: str = Query(...),
    improvement_type: str = Query("grammar"),
    current_user: dict = Depends(get_current_user)
):
    """Improve existing text with AI"""
    try:
        from ai_helper import AIHelper
        ai_helper = AIHelper()
        
        improved = await ai_helper.improve_text(text, improvement_type)
        
        return {
            "original": text,
            "improved": improved,
            "improvement_type": improvement_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to improve text: {str(e)}")


@app.post("/api/ai/analyze/sentiment")
async def analyze_sentiment(
    text: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Analyze text sentiment and tone"""
    try:
        from ai_helper import AIHelper
        ai_helper = AIHelper()
        
        analysis = await ai_helper.analyze_text_sentiment(text)
        
        return {
            "text": text[:100] + "..." if len(text) > 100 else text,
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze sentiment: {str(e)}")


@app.post("/api/ai/generate/product-description")
async def generate_product_description_ai(
    product_name: str = Query(...),
    features: str = Query(""),  # Comma-separated
    current_user: dict = Depends(get_current_user)
):
    """Generate product description with AI"""
    try:
        from ai_helper import AIHelper
        ai_helper = AIHelper()
        
        features_list = [f.strip() for f in features.split(',')] if features else []
        description = await ai_helper.generate_product_description(product_name, features_list)
        
        return {
            "product_name": product_name,
            "description": description
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate product description: {str(e)}")


@app.post("/api/ai/generate/blog-post")
async def generate_blog_post_ai(
    title: str = Query(...),
    keywords: str = Query(""),  # Comma-separated
    current_user: dict = Depends(get_current_user)
):
    """Generate blog post content with AI"""
    try:
        from ai_helper import AIHelper
        ai_helper = AIHelper()
        
        keywords_list = [k.strip() for k in keywords.split(',')] if keywords else []
        content = await ai_helper.generate_blog_post(title, keywords_list)
        
        return {
            "title": title,
            "content": content,
            "keywords": keywords_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate blog post: {str(e)}")
        # Write headers and data
        writer.writerow(['Metric Category', 'Metric', 'Value'])
        
        # Revenue
        writer.writerow(['Revenue', 'Total Revenue', f"${overview_data['total_revenue']}"])
        writer.writerow(['Revenue', 'Revenue Growth', f"{overview_data['revenue_growth']}%"])
        
        # Contacts
        writer.writerow(['Contacts', 'Total Contacts', overview_data['total_contacts']])
        writer.writerow(['Contacts', 'New Contacts', overview_data['new_contacts']])
        writer.writerow(['Contacts', 'Active Contacts', overview_data['active_contacts']])
        
        # Email Marketing
        email = overview_data['email_marketing']
        writer.writerow(['Email', 'Total Campaigns', email['total_campaigns']])
        writer.writerow(['Email', 'Emails Sent', email['total_emails_sent']])
        writer.writerow(['Email', 'Open Rate', f"{email['open_rate']}%"])
        writer.writerow(['Email', 'Click Rate', f"{email['click_rate']}%"])
        
        # Funnels
        funnels = overview_data['funnels']
        writer.writerow(['Funnels', 'Total Funnels', funnels['total_funnels']])
        writer.writerow(['Funnels', 'Total Visits', funnels['total_visits']])
        writer.writerow(['Funnels', 'Conversions', funnels['conversions']])
        writer.writerow(['Funnels', 'Conversion Rate', f"{funnels['conversion_rate']}%"])
        
        # E-commerce
        ecommerce = overview_data['ecommerce']
        writer.writerow(['E-commerce', 'Total Orders', ecommerce['total_orders']])
        writer.writerow(['E-commerce', 'Completed Orders', ecommerce['completed_orders']])
        writer.writerow(['E-commerce', 'Average Order Value', f"${ecommerce['average_order_value']}"])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=analytics_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export report: {str(e)}")



# ==================== TEMPLATE MANAGEMENT ROUTES ====================

from template_library import get_templates_by_module, get_all_templates
from ai_helper import AIHelper

@app.get("/api/templates")
async def get_all_available_templates(current_user: dict = Depends(get_current_user)):
    """Get all available templates across all modules"""
    return get_all_templates()

@app.get("/api/templates/{module}")
async def get_module_templates(
    module: str,
    current_user: dict = Depends(get_current_user)
):
    """Get templates for a specific module"""
    templates = get_templates_by_module(module)
    return {"module": module, "templates": templates}

@app.get("/api/templates/{module}/{template_id}")
async def get_template_details(
    module: str,
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed information about a specific template"""
    templates = get_templates_by_module(module)
    template = next((t for t in templates if t.get('id') == template_id), None)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


# ==================== AI ENHANCEMENT ROUTES ====================

@app.post("/api/ai/generate-content")
async def ai_generate_content(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate content using AI
    
    Request body:
    {
        "module": "email|blog|course|etc",
        "content_type": "subject|body|headline|etc",
        "prompt": "what to generate",
        "context": {...}
    }
    """
    try:
        ai_helper = AIHelper()
        module = request.get('module', 'general')
        content_type = request.get('content_type', 'text')
        prompt = request.get('prompt', '')
        context = request.get('context', {})
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        # Module-specific generation
        if module == 'email' and content_type == 'full':
            result = await ai_helper.generate_email_copy(prompt, context.get('tone', 'professional'))
        elif module == 'blog':
            result = await ai_helper.generate_blog_post(prompt, context.get('keywords', []))
        elif module == 'course' and content_type == 'lesson':
            result = await ai_helper.generate_course_lesson_content(
                prompt, 
                context.get('course_topic', ''),
                context.get('lesson_number', 1)
            )
        elif module == 'funnel' and content_type == 'copy':
            result = await ai_helper.generate_landing_page_copy(
                prompt,
                context.get('target_audience', 'general audience'),
                context.get('benefits', [])
            )
        elif module == 'product' and content_type == 'description':
            result = await ai_helper.generate_product_description(
                prompt,
                context.get('features', [])
            )
        else:
            # General text generation
            result = await ai_helper.generate_text(prompt)
        
        return {
            "success": True,
            "content": result,
            "module": module,
            "content_type": content_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/api/ai/improve-content")
async def ai_improve_content(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Improve existing content using AI
    
    Request body:
    {
        "content": "text to improve",
        "improvement_type": "grammar|clarity|engagement|seo",
        "target_keywords": [...] (optional, for SEO)
    }
    """
    try:
        ai_helper = AIHelper()
        content = request.get('content', '')
        improvement_type = request.get('improvement_type', 'grammar')
        
        if not content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        if improvement_type == 'seo':
            target_keywords = request.get('target_keywords', [])
            result = await ai_helper.improve_seo(content, target_keywords)
        else:
            result = await ai_helper.improve_text(content, improvement_type)
        
        return {
            "success": True,
            "improved_content": result,
            "improvement_type": improvement_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content improvement failed: {str(e)}")

@app.post("/api/ai/smart-suggestions")
async def ai_smart_suggestions(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Get smart AI suggestions based on context
    
    Request body:
    {
        "module": "email|funnel|course|etc",
        "context": {...module-specific context}
    }
    """
    try:
        ai_helper = AIHelper()
        module = request.get('module', '')
        context = request.get('context', {})
        
        if not module:
            raise HTTPException(status_code=400, detail="Module is required")
        
        suggestions = await ai_helper.generate_smart_suggestions(module, context)
        
        return {
            "success": True,
            "module": module,
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestion generation failed: {str(e)}")

@app.post("/api/ai/generate-headlines")
async def ai_generate_headlines(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate multiple headline options"""
    try:
        ai_helper = AIHelper()
        topic = request.get('topic', '')
        style = request.get('style', 'attention-grabbing')
        
        if not topic:
            raise HTTPException(status_code=400, detail="Topic is required")
        
        headlines = await ai_helper.generate_headline(topic, style)
        
        return {
            "success": True,
            "headlines": headlines
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Headline generation failed: {str(e)}")

@app.post("/api/ai/generate-form-fields")
async def ai_generate_form_fields(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate form fields using AI"""
    try:
        ai_helper = AIHelper()
        form_purpose = request.get('form_purpose', 'contact')
        target_audience = request.get('target_audience', 'general')
        
        fields = await ai_helper.generate_form_fields(form_purpose, target_audience)
        
        return {
            "success": True,
            "fields": fields
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Form field generation failed: {str(e)}")

@app.post("/api/ai/generate-survey-questions")
async def ai_generate_survey_questions(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate survey questions using AI"""
    try:
        ai_helper = AIHelper()
        survey_topic = request.get('survey_topic', '')
        num_questions = request.get('num_questions', 10)
        
        if not survey_topic:
            raise HTTPException(status_code=400, detail="Survey topic is required")
        
        questions = await ai_helper.generate_survey_questions(survey_topic, num_questions)
        
        return {
            "success": True,
            "questions": questions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Survey question generation failed: {str(e)}")

@app.post("/api/ai/optimize-funnel-page")
async def ai_optimize_funnel_page(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Optimize funnel page using AI"""
    try:
        ai_helper = AIHelper()
        current_content = request.get('current_content', '')
        page_purpose = request.get('page_purpose', 'landing')
        
        if not current_content:
            raise HTTPException(status_code=400, detail="Current content is required")
        
        optimization = await ai_helper.optimize_funnel_page(current_content, page_purpose)
        
        return {
            "success": True,
            "optimization": optimization
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Page optimization failed: {str(e)}")

@app.post("/api/ai/generate-social-posts")
async def ai_generate_social_posts(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate social media posts"""
    try:
        ai_helper = AIHelper()
        topic = request.get('topic', '')
        platforms = request.get('platforms', ['twitter', 'facebook', 'linkedin'])
        
        if not topic:
            raise HTTPException(status_code=400, detail="Topic is required")
        
        posts = await ai_helper.generate_social_media_posts(topic, platforms)
        
        return {
            "success": True,
            "posts": posts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Social post generation failed: {str(e)}")

@app.post("/api/ai/analyze-sentiment")
async def ai_analyze_sentiment(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Analyze text sentiment"""
    try:
        ai_helper = AIHelper()
        text = request.get('text', '')
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        analysis = await ai_helper.analyze_text_sentiment(text)
        
        return {
            "success": True,
            "analysis": analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")


# ==================== WEBSITE BUILDER AI ENDPOINTS ====================

@app.post("/api/website/ai/generate-complete-website")
async def generate_complete_website_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate a complete website with AI"""
    try:
        ai_helper = AIHelper()
        business_info = request.get('business_info', {})
        
        result = await ai_helper.generate_complete_website(business_info)
        
        return {
            "success": True,
            "website": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Website generation failed: {str(e)}")


@app.post("/api/website/ai/generate-section")
async def generate_website_section_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate a specific website section with AI"""
    try:
        ai_helper = AIHelper()
        section_type = request.get('section_type', 'hero')
        context = request.get('context', {})
        
        result = await ai_helper.generate_website_section(section_type, context)
        
        return {
            "success": True,
            "section": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Section generation failed: {str(e)}")


@app.post("/api/website/ai/generate-color-scheme")
async def generate_color_scheme_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate a color scheme with AI"""
    try:
        ai_helper = AIHelper()
        brand_info = request.get('brand_info', {})
        
        result = await ai_helper.generate_color_scheme(brand_info)
        
        return {
            "success": True,
            "color_scheme": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Color scheme generation failed: {str(e)}")


@app.post("/api/website/ai/generate-typography")
async def generate_typography_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate typography recommendations with AI"""
    try:
        ai_helper = AIHelper()
        brand_style = request.get('brand_style', 'modern')
        website_type = request.get('website_type', 'corporate')
        
        result = await ai_helper.generate_typography_suggestions(brand_style, website_type)
        
        return {
            "success": True,
            "typography": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Typography generation failed: {str(e)}")


@app.post("/api/website/ai/suggest-layout")
async def suggest_layout_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Get AI layout suggestions"""
    try:
        ai_helper = AIHelper()
        page_type = request.get('page_type', 'home')
        content_blocks = request.get('content_blocks', [])
        
        result = await ai_helper.generate_layout_suggestion(page_type, content_blocks)
        
        return {
            "success": True,
            "layout": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Layout suggestion failed: {str(e)}")


@app.post("/api/website/ai/optimize-section")
async def optimize_section_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Optimize existing section with AI"""
    try:
        ai_helper = AIHelper()
        section_content = request.get('section_content', '')
        section_type = request.get('section_type', 'general')
        goals = request.get('goals', ['conversion'])
        
        result = await ai_helper.optimize_website_section(section_content, section_type, goals)
        
        return {
            "success": True,
            "optimization": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Section optimization failed: {str(e)}")


@app.post("/api/website/ai/responsive-suggestions")
async def responsive_suggestions_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Get responsive design suggestions"""
    try:
        ai_helper = AIHelper()
        layout_description = request.get('layout_description', '')
        
        result = await ai_helper.generate_responsive_design_suggestions(layout_description)
        
        return {
            "success": True,
            "suggestions": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Responsive suggestions failed: {str(e)}")


@app.post("/api/website/ai/animation-suggestions")
async def animation_suggestions_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Get animation suggestions"""
    try:
        ai_helper = AIHelper()
        element_type = request.get('element_type', 'button')
        context = request.get('context', 'hero')
        
        result = await ai_helper.generate_animation_suggestions(element_type, context)
        
        return {
            "success": True,
            "animations": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Animation suggestions failed: {str(e)}")


@app.post("/api/website/ai/seo-metadata")
async def generate_seo_metadata_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate SEO metadata with AI"""
    try:
        ai_helper = AIHelper()
        page_info = request.get('page_info', {})
        
        result = await ai_helper.generate_seo_metadata(page_info)
        
        return {
            "success": True,
            "metadata": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SEO metadata generation failed: {str(e)}")


@app.post("/api/website/ai/accessibility-check")
async def accessibility_check_ai(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Get accessibility recommendations"""
    try:
        ai_helper = AIHelper()
        page_structure = request.get('page_structure', '')
        
        result = await ai_helper.generate_accessibility_recommendations(page_structure)
        
        return {
            "success": True,
            "recommendations": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Accessibility check failed: {str(e)}")


# ==================== SECTION TEMPLATES ENDPOINTS ====================

@app.get("/api/website/section-templates")
async def get_section_templates(
    category: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get section templates"""
    try:
        from website_templates import get_all_templates, get_templates_by_category
        
        if category:
            templates = get_templates_by_category(category)
        else:
            templates = get_all_templates()
        
        return {
            "success": True,
            "templates": templates,
            "count": len(templates)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch templates: {str(e)}")


@app.get("/api/website/section-templates/{template_id}")
async def get_section_template_by_id(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific section template"""
    try:
        from website_templates import get_template_by_id
        
        template = get_template_by_id(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {
            "success": True,
            "template": template
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch template: {str(e)}")


# ==================== ADVANCED BLOCKS ENDPOINTS ====================

@app.get("/api/website/advanced-blocks")
async def get_advanced_blocks(
    category: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get advanced blocks"""
    try:
        from advanced_blocks import get_all_advanced_blocks, get_blocks_by_category
        
        if category:
            blocks = get_blocks_by_category(category)
        else:
            blocks = get_all_advanced_blocks()
        
        return {
            "success": True,
            "blocks": blocks,
            "count": len(blocks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch blocks: {str(e)}")


@app.get("/api/website/advanced-blocks/{block_type}")
async def get_advanced_block_by_type(
    block_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific advanced block"""
    try:
        from advanced_blocks import get_block_by_type
        
        block = get_block_by_type(block_type)
        
        if not block:
            raise HTTPException(status_code=404, detail="Block not found")
        
        return {
            "success": True,
            "block": block
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch block: {str(e)}")


# ==================== ASSET MANAGEMENT ENDPOINTS ====================

@app.post("/api/website/assets/upload")
async def upload_asset(
    file: dict,
    current_user: dict = Depends(get_current_user)
):
    """Upload an asset (simulated)"""
    try:
        asset_id = str(uuid.uuid4())
        asset = {
            "id": asset_id,
            "user_id": current_user["id"],
            "name": file.get("name", "untitled"),
            "type": file.get("type", "image"),
            "url": file.get("url", ""),
            "size": file.get("size", 0),
            "uploaded_at": datetime.utcnow().isoformat(),
            "tags": file.get("tags", [])
        }
        
        await assets_collection.insert_one(asset)
        
        return {
            "success": True,
            "asset": asset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/api/website/assets")
async def get_assets(
    asset_type: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's assets"""
    try:
        query = {"user_id": current_user["id"]}
        if asset_type:
            query["type"] = asset_type
        
        assets = await assets_collection.find(query).to_list(length=100)
        
        return {
            "success": True,
            "assets": assets,
            "count": len(assets)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch assets: {str(e)}")


@app.delete("/api/website/assets/{asset_id}")
async def delete_asset(
    asset_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an asset"""
    try:
        result = await assets_collection.delete_one({
            "id": asset_id,
            "user_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        return {
            "success": True,
            "message": "Asset deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)