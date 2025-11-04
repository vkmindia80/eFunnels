from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from datetime import timedelta, datetime
import io
import csv
import pandas as pd
from models import (
    UserCreate, UserLogin, User, Token, UserUpdate, GoogleLogin,
    ContactCreate, ContactUpdate, Contact, ContactActivityCreate,
    TagCreate, Tag, SegmentCreate, Segment,
    BulkDeleteRequest, BulkTagRequest, BulkSegmentRequest
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
    tags_collection, segments_collection
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)