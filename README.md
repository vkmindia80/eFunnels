# eFunnels - Advanced All-in-One Business Platform

An advanced system similar to systeme.io with comprehensive features for sales funnels, email marketing, courses, webinars, and more.

## 🚀 Project Status

**✅ PHASE 1 & 2 COMPLETE** - COMPLETED ✨

### Completed Features (Phase 1 - Foundation):
- ✅ Full-stack project setup (FastAPI + React + MongoDB)
- ✅ User authentication system with JWT
- ✅ Google OAuth integration (ready)
- ✅ Demo credentials with auto-fill functionality
- ✅ User registration and login
- ✅ Protected routes and API endpoints
- ✅ User profile management
- ✅ Role-based access control
- ✅ Responsive dashboard layout
- ✅ Professional UI with Tailwind CSS
- ✅ API proxy configuration working
- ✅ AI integration ready (Emergent LLM Key)
- ✅ All services running smoothly

### Completed Features (Phase 2 - Contact & CRM):
- ✅ Complete contact management (CRUD)
- ✅ Contact list with pagination & search
- ✅ Import contacts (CSV, Excel)
- ✅ Export contacts (CSV, Excel)
- ✅ Bulk operations (delete, tag, segment)
- ✅ Advanced search & filters
- ✅ Contact profiles with activity timeline
- ✅ Tags & segments system
- ✅ Contact scoring (0-100)
- ✅ Lead status tracking
- ✅ Engagement metrics
- ✅ Real-time statistics dashboard
- ✅ Duplicate detection

**🚀 READY FOR PHASE 3: Email Marketing Core**

### Demo Credentials:
```
Email: demo@efunnels.com
Password: demo123
```

## 🏗️ Architecture

### Tech Stack:
- **Backend:** FastAPI (Python) + MongoDB
- **Frontend:** React 18 + Tailwind CSS
- **Authentication:** JWT + Google OAuth
- **Database:** MongoDB
- **Email:** SendGrid + Custom SMTP (toggle)
- **AI:** Emergent LLM Key (OpenAI/Claude/Gemini)

### Project Structure:
```
/app/
├── backend/                 # FastAPI Backend
│   ├── server.py           # Main API application
│   ├── models.py           # Pydantic models
│   ├── auth.py             # Authentication logic
│   ├── database.py         # MongoDB connection
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── App.js         # Main application
│   │   ├── api.js         # API client
│   │   ├── index.js       # Entry point
│   │   └── index.css      # Global styles
│   ├── package.json       # Node dependencies
│   └── .env              # Environment variables
└── README.md             # This file
```

## 🎯 Development Roadmap

### Phase 1: Foundation & Authentication ✅ COMPLETE
- Project setup and infrastructure
- User authentication (JWT + Google OAuth)
- Dashboard layout and navigation
- Demo credentials system

### Phase 2: Contact & CRM System (Next)
- Contact management (CRUD)
- Import/Export contacts
- Segmentation and tagging
- Contact profiles with activity history
- Advanced search and filters

### Phase 3: Email Marketing Core
- Email campaign builder
- Visual email editor
- Email templates library
- SendGrid + Custom SMTP
- Email scheduling
- List management

### Phase 4: Sales Funnel Builder
- Drag-and-drop page builder
- Pre-built funnel templates
- Landing page components
- Mobile responsive preview
- A/B testing
- Funnel analytics

### Phase 5: Forms & Surveys
- Form builder (drag-drop)
- Survey builder
- Multi-step forms
- Conditional logic
- Form submissions management

### Phase 6: Email Automation & Workflows
- Visual workflow builder
- Trigger-based automation
- Email sequences
- Tag-based automation

### Phase 7: Course & Membership Platform
- Course creation and management
- Module and lesson structure
- Drip content scheduling
- Student progress tracking
- Membership levels

### Phase 8: Blog & Website Builder
- Blog post management
- Website page builder
- SEO optimization
- Theme customization

### Phase 9: Webinar Platform
- Webinar creation & scheduling
- Live webinar interface
- Recording management
- Chat functionality

### Phase 10: Affiliate Management
- Affiliate program setup
- Commission tracking
- Affiliate dashboard
- Performance reports

### Phase 11: Payment & E-commerce
- Product management
- Mock payment gateway
- Order management
- Subscription management
- (Stripe integration ready)

### Phase 12: Analytics, AI & Polish
- Comprehensive analytics
- AI content generation
- AI email copywriting
- File manager
- System settings

## 🛠️ Getting Started

### Prerequisites:
- Python 3.11+
- Node.js 18+
- MongoDB
- Yarn

### Installation:

1. **Backend Setup:**
```bash
cd /app/backend
pip install -r requirements.txt
python server.py
```

2. **Frontend Setup:**
```bash
cd /app/frontend
yarn install
yarn start
```

### Environment Variables:

**Backend (.env):**
```
MONGO_URL=mongodb://localhost:27017/
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

## 📡 API Endpoints

### Authentication:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Demo:
- `GET /api/demo/credentials` - Get demo credentials
- `GET /api/health` - Health check

## 🎨 Features

### Current Features (Phase 1):
1. **Authentication System:**
   - Email/Password registration
   - Secure login with JWT
   - Google OAuth (ready)
   - Demo credentials auto-fill
   - Protected routes

2. **Dashboard:**
   - Professional UI design
   - Responsive layout
   - Navigation sidebar
   - User profile menu
   - Quick stats overview
   - Recent activity feed
   - Quick actions panel

3. **User Management:**
   - User profiles
   - Role-based access
   - Subscription plans
   - Account settings

## 🔒 Security

- Password hashing with bcrypt
- JWT token authentication
- Secure HTTP-only cookies (ready)
- CORS configuration
- API rate limiting (ready)
- Input validation
- SQL injection prevention

## 🚀 Deployment

Services run via Supervisor:
```bash
sudo supervisorctl restart all
sudo supervisorctl status
```

## 📊 Database Schema

### Users Collection:
```javascript
{
  id: String (UUID),
  email: String (unique),
  full_name: String,
  password: String (hashed),
  role: String,
  created_at: DateTime,
  updated_at: DateTime,
  is_active: Boolean,
  auth_provider: String,
  avatar: String,
  phone: String,
  company: String,
  subscription_plan: String
}
```

## 🤝 Contributing

This is an active development project. Each phase is built incrementally and tested before moving to the next.

## 📝 License

Proprietary - eFunnels Platform

## 🎉 Acknowledgments

Built with modern web technologies and best practices for performance, security, and user experience.

---

**Status:** Phase 1 Complete ✅ | Next: Phase 2 - Contact & CRM System