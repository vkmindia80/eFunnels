"""
Template Library for eFunnels
Pre-built templates for all modules
"""

# ==================== EMAIL TEMPLATES ====================

EMAIL_TEMPLATES = [
    {
        "id": "email_welcome_001",
        "name": "Welcome Email - Professional",
        "category": "welcome",
        "description": "Professional welcome email for new subscribers",
        "thumbnail": "https://via.placeholder.com/300x200?text=Welcome+Email",
        "subject": "Welcome to {{company_name}}! 🎉",
        "content": {
            "blocks": [
                {
                    "type": "heading",
                    "content": "Welcome to {{company_name}}!",
                    "style": {"fontSize": "32px", "color": "#1a1a1a", "textAlign": "center"}
                },
                {
                    "type": "text",
                    "content": "Hi {{first_name}},\n\nWe're thrilled to have you join our community! You've taken the first step towards [benefit/goal].",
                    "style": {"fontSize": "16px", "lineHeight": "1.6"}
                },
                {
                    "type": "text",
                    "content": "Here's what you can expect:\n\n• [Benefit 1]\n• [Benefit 2]\n• [Benefit 3]",
                    "style": {"fontSize": "16px", "lineHeight": "1.8"}
                },
                {
                    "type": "button",
                    "content": "Get Started",
                    "url": "{{website_url}}",
                    "style": {"backgroundColor": "#4F46E5", "color": "white", "padding": "12px 32px"}
                },
                {
                    "type": "text",
                    "content": "If you have any questions, feel free to reply to this email.\n\nBest regards,\nThe {{company_name}} Team",
                    "style": {"fontSize": "14px", "color": "#666"}
                }
            ]
        },
        "is_public": True
    },
    {
        "id": "email_promo_001",
        "name": "Promotional Sale Email",
        "category": "promotional",
        "description": "Eye-catching promotional email for sales and offers",
        "thumbnail": "https://via.placeholder.com/300x200?text=Sale+Email",
        "subject": "🔥 Limited Time Offer: {{discount}}% OFF!",
        "content": {
            "blocks": [
                {
                    "type": "heading",
                    "content": "FLASH SALE",
                    "style": {"fontSize": "48px", "color": "#EF4444", "textAlign": "center", "fontWeight": "bold"}
                },
                {
                    "type": "text",
                    "content": "{{discount}}% OFF",
                    "style": {"fontSize": "36px", "textAlign": "center", "color": "#1a1a1a"}
                },
                {
                    "type": "text",
                    "content": "Don't miss out! This exclusive offer ends in {{hours_left}} hours.",
                    "style": {"fontSize": "18px", "textAlign": "center"}
                },
                {
                    "type": "button",
                    "content": "Shop Now",
                    "url": "{{shop_url}}",
                    "style": {"backgroundColor": "#EF4444", "color": "white", "padding": "16px 48px", "fontSize": "18px"}
                },
                {
                    "type": "text",
                    "content": "Use code: {{coupon_code}} at checkout",
                    "style": {"fontSize": "16px", "textAlign": "center", "backgroundColor": "#FEF3C7", "padding": "12px"}
                }
            ]
        },
        "is_public": True
    },
    {
        "id": "email_newsletter_001",
        "name": "Monthly Newsletter",
        "category": "newsletter",
        "description": "Clean newsletter template for regular updates",
        "thumbnail": "https://via.placeholder.com/300x200?text=Newsletter",
        "subject": "{{company_name}} Newsletter - {{month}} Edition",
        "content": {
            "blocks": [
                {
                    "type": "heading",
                    "content": "Monthly Newsletter",
                    "style": {"fontSize": "28px", "color": "#1a1a1a"}
                },
                {
                    "type": "text",
                    "content": "{{month}} {{year}}",
                    "style": {"fontSize": "14px", "color": "#666"}
                },
                {
                    "type": "heading",
                    "content": "What's New This Month",
                    "style": {"fontSize": "22px", "color": "#4F46E5", "marginTop": "24px"}
                },
                {
                    "type": "text",
                    "content": "[Latest news, updates, or announcements]",
                    "style": {"fontSize": "16px", "lineHeight": "1.6"}
                },
                {
                    "type": "heading",
                    "content": "Featured Article",
                    "style": {"fontSize": "22px", "color": "#4F46E5", "marginTop": "24px"}
                },
                {
                    "type": "text",
                    "content": "[Article excerpt or summary]",
                    "style": {"fontSize": "16px", "lineHeight": "1.6"}
                },
                {
                    "type": "button",
                    "content": "Read More",
                    "url": "{{article_url}}",
                    "style": {"backgroundColor": "#4F46E5", "color": "white"}
                }
            ]
        },
        "is_public": True
    },
    {
        "id": "email_cart_abandon_001",
        "name": "Cart Abandonment Recovery",
        "category": "ecommerce",
        "description": "Recover abandoned carts with this persuasive email",
        "thumbnail": "https://via.placeholder.com/300x200?text=Cart+Recovery",
        "subject": "You left something behind... 🛒",
        "content": {
            "blocks": [
                {
                    "type": "heading",
                    "content": "Did you forget something?",
                    "style": {"fontSize": "28px", "textAlign": "center"}
                },
                {
                    "type": "text",
                    "content": "Hi {{first_name}},\n\nWe noticed you left items in your cart. Don't worry, we've saved them for you!",
                    "style": {"fontSize": "16px", "lineHeight": "1.6"}
                },
                {
                    "type": "text",
                    "content": "Complete your purchase now and get {{discount}}% off!",
                    "style": {"fontSize": "18px", "fontWeight": "bold", "textAlign": "center", "color": "#10B981"}
                },
                {
                    "type": "button",
                    "content": "Complete My Purchase",
                    "url": "{{cart_url}}",
                    "style": {"backgroundColor": "#10B981", "color": "white", "padding": "14px 40px"}
                }
            ]
        },
        "is_public": True
    },
    {
        "id": "email_feedback_001",
        "name": "Customer Feedback Request",
        "category": "feedback",
        "description": "Simple email to request customer feedback",
        "thumbnail": "https://via.placeholder.com/300x200?text=Feedback",
        "subject": "We'd love your feedback! 💬",
        "content": {
            "blocks": [
                {
                    "type": "heading",
                    "content": "How are we doing?",
                    "style": {"fontSize": "28px", "textAlign": "center"}
                },
                {
                    "type": "text",
                    "content": "Hi {{first_name}},\n\nYour opinion matters to us! We'd love to hear about your experience with {{product_name}}.",
                    "style": {"fontSize": "16px", "lineHeight": "1.6"}
                },
                {
                    "type": "text",
                    "content": "It will only take 2 minutes.",
                    "style": {"fontSize": "14px", "color": "#666", "textAlign": "center"}
                },
                {
                    "type": "button",
                    "content": "Share Your Feedback",
                    "url": "{{survey_url}}",
                    "style": {"backgroundColor": "#8B5CF6", "color": "white"}
                }
            ]
        },
        "is_public": True
    }
]

# ==================== FUNNEL TEMPLATES ====================

FUNNEL_TEMPLATES = [
    {
        "id": "funnel_leadgen_001",
        "name": "Lead Generation Funnel",
        "description": "Classic lead magnet funnel with thank you page",
        "funnel_type": "lead_gen",
        "thumbnail": "https://via.placeholder.com/400x300?text=Lead+Gen+Funnel",
        "pages": [
            {
                "name": "Landing Page",
                "path": "/lead-magnet",
                "order": 1,
                "content": {
                    "blocks": [
                        {"type": "hero", "heading": "Get Your Free [Lead Magnet]", "subheading": "Discover the secrets to [benefit]"},
                        {"type": "form", "fields": ["email", "first_name"]},
                        {"type": "benefits", "items": ["Benefit 1", "Benefit 2", "Benefit 3"]},
                        {"type": "cta", "text": "Download Now", "action": "submit_form"}
                    ]
                },
                "seo_title": "Free [Lead Magnet] - Download Now"
            },
            {
                "name": "Thank You Page",
                "path": "/thank-you",
                "order": 2,
                "content": {
                    "blocks": [
                        {"type": "heading", "text": "Success! Check Your Email"},
                        {"type": "text", "text": "We've sent your free [lead magnet] to {{email}}"},
                        {"type": "next_steps", "items": ["Check your inbox", "Download the guide", "Follow us on social media"]}
                    ]
                }
            }
        ],
        "is_public": True
    },
    {
        "id": "funnel_webinar_001",
        "name": "Webinar Registration Funnel",
        "description": "Complete webinar registration and replay funnel",
        "funnel_type": "webinar",
        "thumbnail": "https://via.placeholder.com/400x300?text=Webinar+Funnel",
        "pages": [
            {
                "name": "Registration Page",
                "path": "/webinar-register",
                "order": 1,
                "content": {
                    "blocks": [
                        {"type": "hero", "heading": "FREE Live Training: [Topic]"},
                        {"type": "video", "url": "promo_video.mp4"},
                        {"type": "form", "fields": ["first_name", "email", "phone"]},
                        {"type": "testimonials", "count": 3},
                        {"type": "cta", "text": "Save My Seat"}
                    ]
                }
            },
            {
                "name": "Confirmation Page",
                "path": "/webinar-confirmed",
                "order": 2,
                "content": {
                    "blocks": [
                        {"type": "heading", "text": "You're Registered!"},
                        {"type": "countdown", "event_date": "{{webinar_date}}"},
                        {"type": "calendar", "add_to_calendar": True},
                        {"type": "social_share"}
                    ]
                }
            },
            {
                "name": "Replay Page",
                "path": "/webinar-replay",
                "order": 3,
                "content": {
                    "blocks": [
                        {"type": "video", "url": "{{replay_url}}"},
                        {"type": "cta", "text": "Get Special Offer"},
                        {"type": "timer", "countdown_hours": 24}
                    ]
                }
            }
        ],
        "is_public": True
    },
    {
        "id": "funnel_product_001",
        "name": "Product Launch Funnel",
        "description": "Multi-page product launch funnel with upsell",
        "funnel_type": "product_launch",
        "thumbnail": "https://via.placeholder.com/400x300?text=Product+Launch",
        "pages": [
            {
                "name": "Pre-Launch Landing",
                "path": "/pre-launch",
                "order": 1,
                "content": {
                    "blocks": [
                        {"type": "hero", "heading": "Something Big Is Coming..."},
                        {"type": "countdown", "launch_date": "{{launch_date}}"},
                        {"type": "form", "fields": ["email"], "cta": "Notify Me at Launch"}
                    ]
                }
            },
            {
                "name": "Sales Page",
                "path": "/buy-now",
                "order": 2,
                "content": {
                    "blocks": [
                        {"type": "hero", "heading": "Introducing [Product Name]"},
                        {"type": "features", "count": 5},
                        {"type": "pricing", "plans": 3},
                        {"type": "guarantee", "text": "30-day money-back guarantee"},
                        {"type": "cta", "text": "Buy Now"}
                    ]
                }
            },
            {
                "name": "Upsell Page",
                "path": "/special-offer",
                "order": 3,
                "content": {
                    "blocks": [
                        {"type": "heading", "text": "Wait! Special One-Time Offer"},
                        {"type": "product", "name": "Premium Package"},
                        {"type": "comparison", "show_value": True},
                        {"type": "cta", "text": "Yes, Add to My Order"}
                    ]
                }
            },
            {
                "name": "Thank You",
                "path": "/order-confirmed",
                "order": 4,
                "content": {
                    "blocks": [
                        {"type": "heading", "text": "Order Confirmed!"},
                        {"type": "order_summary"},
                        {"type": "next_steps"}
                    ]
                }
            }
        ],
        "is_public": True
    }
]

# ==================== FORM TEMPLATES ====================

FORM_TEMPLATES = [
    {
        "id": "form_contact_001",
        "name": "Simple Contact Form",
        "category": "contact",
        "description": "Basic contact form with essential fields",
        "thumbnail": "https://via.placeholder.com/300x200?text=Contact+Form",
        "fields": [
            {"label": "Full Name", "field_type": "text", "required": True, "placeholder": "John Doe"},
            {"label": "Email Address", "field_type": "email", "required": True, "placeholder": "john@example.com"},
            {"label": "Phone Number", "field_type": "phone", "required": False, "placeholder": "(555) 123-4567"},
            {"label": "Message", "field_type": "textarea", "required": True, "placeholder": "How can we help you?"}
        ],
        "settings": {
            "thank_you_message": "Thank you for contacting us! We'll get back to you within 24 hours.",
            "send_notification": True
        },
        "is_public": True
    },
    {
        "id": "form_registration_001",
        "name": "Event Registration Form",
        "category": "registration",
        "description": "Complete event registration form",
        "thumbnail": "https://via.placeholder.com/300x200?text=Registration",
        "fields": [
            {"label": "First Name", "field_type": "text", "required": True},
            {"label": "Last Name", "field_type": "text", "required": True},
            {"label": "Email", "field_type": "email", "required": True},
            {"label": "Phone", "field_type": "phone", "required": True},
            {"label": "Company", "field_type": "text", "required": False},
            {"label": "Job Title", "field_type": "text", "required": False},
            {"label": "Dietary Restrictions", "field_type": "select", "options": ["None", "Vegetarian", "Vegan", "Gluten-Free", "Other"]},
            {"label": "How did you hear about us?", "field_type": "select", "options": ["Social Media", "Email", "Friend", "Search Engine", "Other"]},
            {"label": "Additional Comments", "field_type": "textarea", "required": False}
        ],
        "is_public": True
    },
    {
        "id": "form_feedback_001",
        "name": "Customer Feedback Survey",
        "category": "feedback",
        "description": "Comprehensive customer feedback form",
        "thumbnail": "https://via.placeholder.com/300x200?text=Feedback+Survey",
        "fields": [
            {"label": "Overall Satisfaction", "field_type": "rating", "required": True, "options": ["1", "2", "3", "4", "5"]},
            {"label": "Product Quality", "field_type": "rating", "required": True, "options": ["1", "2", "3", "4", "5"]},
            {"label": "Customer Service", "field_type": "rating", "required": True, "options": ["1", "2", "3", "4", "5"]},
            {"label": "What did you like most?", "field_type": "textarea", "required": False},
            {"label": "What could we improve?", "field_type": "textarea", "required": False},
            {"label": "Would you recommend us?", "field_type": "radio", "options": ["Yes", "No", "Maybe"]},
            {"label": "Email (optional)", "field_type": "email", "required": False}
        ],
        "is_public": True
    },
    {
        "id": "form_order_001",
        "name": "Product Order Form",
        "category": "order",
        "description": "E-commerce order form",
        "thumbnail": "https://via.placeholder.com/300x200?text=Order+Form",
        "fields": [
            {"label": "Full Name", "field_type": "text", "required": True},
            {"label": "Email", "field_type": "email", "required": True},
            {"label": "Phone", "field_type": "phone", "required": True},
            {"label": "Shipping Address", "field_type": "text", "required": True},
            {"label": "City", "field_type": "text", "required": True},
            {"label": "State/Province", "field_type": "text", "required": True},
            {"label": "Postal Code", "field_type": "text", "required": True},
            {"label": "Country", "field_type": "select", "required": True, "options": ["United States", "Canada", "United Kingdom", "Australia", "Other"]},
            {"label": "Product", "field_type": "select", "required": True, "options": ["Product 1", "Product 2", "Product 3"]},
            {"label": "Quantity", "field_type": "number", "required": True},
            {"label": "Special Instructions", "field_type": "textarea", "required": False}
        ],
        "is_public": True
    }
]

# ==================== COURSE TEMPLATES ====================

COURSE_TEMPLATES = [
    {
        "id": "course_beginner_001",
        "name": "Beginner Course Structure",
        "category": "beginner",
        "description": "Perfect structure for beginner-level courses",
        "thumbnail": "https://via.placeholder.com/400x300?text=Beginner+Course",
        "modules": [
            {
                "title": "Module 1: Introduction & Fundamentals",
                "description": "Learn the basics and get started",
                "order": 1,
                "lessons": [
                    {"title": "Welcome & Course Overview", "content_type": "video", "duration": 15},
                    {"title": "Key Concepts Explained", "content_type": "video", "duration": 20},
                    {"title": "Getting Started Guide", "content_type": "text", "duration": 10},
                    {"title": "Module 1 Quiz", "content_type": "quiz", "duration": 10}
                ]
            },
            {
                "title": "Module 2: Core Skills",
                "description": "Build your foundational skills",
                "order": 2,
                "lessons": [
                    {"title": "Skill 1: Step-by-Step", "content_type": "video", "duration": 25},
                    {"title": "Skill 2: Hands-On Practice", "content_type": "video", "duration": 30},
                    {"title": "Common Mistakes to Avoid", "content_type": "text", "duration": 15},
                    {"title": "Practice Exercise", "content_type": "quiz", "duration": 20}
                ]
            },
            {
                "title": "Module 3: Practical Application",
                "description": "Apply what you've learned",
                "order": 3,
                "lessons": [
                    {"title": "Real-World Example 1", "content_type": "video", "duration": 20},
                    {"title": "Real-World Example 2", "content_type": "video", "duration": 20},
                    {"title": "Your First Project", "content_type": "text", "duration": 30},
                    {"title": "Final Assessment", "content_type": "quiz", "duration": 15}
                ]
            }
        ],
        "is_public": True
    },
    {
        "id": "course_masterclass_001",
        "name": "Masterclass Course Structure",
        "category": "advanced",
        "description": "Intensive masterclass format",
        "thumbnail": "https://via.placeholder.com/400x300?text=Masterclass",
        "modules": [
            {
                "title": "Part 1: Advanced Strategies",
                "order": 1,
                "lessons": [
                    {"title": "Advanced Technique 1", "content_type": "video", "duration": 45},
                    {"title": "Advanced Technique 2", "content_type": "video", "duration": 45},
                    {"title": "Case Study Analysis", "content_type": "text", "duration": 30}
                ]
            },
            {
                "title": "Part 2: Expert Methods",
                "order": 2,
                "lessons": [
                    {"title": "Expert Method 1", "content_type": "video", "duration": 50},
                    {"title": "Expert Method 2", "content_type": "video", "duration": 50},
                    {"title": "Industry Secrets", "content_type": "video", "duration": 40}
                ]
            },
            {
                "title": "Part 3: Mastery Project",
                "order": 3,
                "lessons": [
                    {"title": "Project Brief", "content_type": "text", "duration": 15},
                    {"title": "Implementation Guide", "content_type": "video", "duration": 60},
                    {"title": "Review & Feedback", "content_type": "text", "duration": 30}
                ]
            }
        ],
        "is_public": True
    }
]

# ==================== BLOG TEMPLATES ====================

BLOG_TEMPLATES = [
    {
        "id": "blog_howto_001",
        "name": "How-To Guide Template",
        "category": "tutorial",
        "description": "Step-by-step guide format",
        "thumbnail": "https://via.placeholder.com/400x300?text=How-To+Guide",
        "structure": {
            "introduction": "Hook the reader and explain what they'll learn",
            "sections": [
                {"heading": "What You'll Need", "content": "List prerequisites or materials"},
                {"heading": "Step 1: [First Step]", "content": "Detailed explanation"},
                {"heading": "Step 2: [Second Step]", "content": "Detailed explanation"},
                {"heading": "Step 3: [Third Step]", "content": "Detailed explanation"},
                {"heading": "Tips & Best Practices", "content": "Additional advice"},
                {"heading": "Conclusion", "content": "Summary and next steps"}
            ]
        },
        "is_public": True
    },
    {
        "id": "blog_listicle_001",
        "name": "Listicle Template",
        "category": "list",
        "description": "Numbered list article format",
        "thumbnail": "https://via.placeholder.com/400x300?text=Listicle",
        "structure": {
            "introduction": "Introduce the topic and what readers will discover",
            "sections": [
                {"heading": "1. [First Item]", "content": "Explanation and details"},
                {"heading": "2. [Second Item]", "content": "Explanation and details"},
                {"heading": "3. [Third Item]", "content": "Explanation and details"},
                {"heading": "4. [Fourth Item]", "content": "Explanation and details"},
                {"heading": "5. [Fifth Item]", "content": "Explanation and details"},
                {"heading": "Conclusion", "content": "Wrap up and call-to-action"}
            ]
        },
        "is_public": True
    },
    {
        "id": "blog_casestudy_001",
        "name": "Case Study Template",
        "category": "case_study",
        "description": "Success story format",
        "thumbnail": "https://via.placeholder.com/400x300?text=Case+Study",
        "structure": {
            "introduction": "Brief overview of the subject",
            "sections": [
                {"heading": "The Challenge", "content": "Describe the problem or situation"},
                {"heading": "The Solution", "content": "Explain the approach taken"},
                {"heading": "The Results", "content": "Quantifiable outcomes and metrics"},
                {"heading": "Key Takeaways", "content": "Lessons learned"},
                {"heading": "Conclusion", "content": "Summary and applicability"}
            ]
        },
        "is_public": True
    }
]

# ==================== WEBINAR TEMPLATES ====================

WEBINAR_TEMPLATES = [
    {
        "id": "webinar_training_001",
        "name": "Educational Training Webinar",
        "category": "training",
        "description": "Structured training session format",
        "thumbnail": "https://via.placeholder.com/400x300?text=Training+Webinar",
        "structure": {
            "duration_minutes": 60,
            "sections": [
                {"title": "Welcome & Introductions", "duration": 5, "type": "intro"},
                {"title": "Agenda Overview", "duration": 3, "type": "overview"},
                {"title": "Core Content - Part 1", "duration": 15, "type": "content"},
                {"title": "Core Content - Part 2", "duration": 15, "type": "content"},
                {"title": "Live Demo/Example", "duration": 12, "type": "demo"},
                {"title": "Q&A Session", "duration": 8, "type": "qa"},
                {"title": "Wrap-up & Next Steps", "duration": 2, "type": "conclusion"}
            ]
        },
        "is_public": True
    },
    {
        "id": "webinar_sales_001",
        "name": "Sales/Product Webinar",
        "category": "sales",
        "description": "Conversion-focused webinar format",
        "thumbnail": "https://via.placeholder.com/400x300?text=Sales+Webinar",
        "structure": {
            "duration_minutes": 90,
            "sections": [
                {"title": "Hook & Introduction", "duration": 5, "type": "intro"},
                {"title": "The Problem", "duration": 10, "type": "content"},
                {"title": "The Solution Overview", "duration": 15, "type": "content"},
                {"title": "How It Works (Demo)", "duration": 20, "type": "demo"},
                {"title": "Success Stories", "duration": 10, "type": "testimonials"},
                {"title": "Special Offer", "duration": 15, "type": "offer"},
                {"title": "Q&A", "duration": 10, "type": "qa"},
                {"title": "Final CTA", "duration": 5, "type": "cta"}
            ]
        },
        "is_public": True
    }
]

# ==================== PRODUCT TEMPLATES ====================

PRODUCT_TEMPLATES = [
    {
        "id": "product_digital_001",
        "name": "Digital Product Template",
        "category": "digital",
        "description": "Template for digital products (ebooks, courses, software)",
        "thumbnail": "https://via.placeholder.com/300x200?text=Digital+Product",
        "structure": {
            "name": "[Product Name]",
            "product_type": "digital",
            "pricing_type": "one_time",
            "price": 49.00,
            "description": "Comprehensive description of your digital product and its benefits",
            "features": [
                "Feature 1: [Description]",
                "Feature 2: [Description]",
                "Feature 3: [Description]",
                "Feature 4: [Description]",
                "Feature 5: [Description]"
            ],
            "includes": [
                "Instant download access",
                "Lifetime updates",
                "Email support",
                "Money-back guarantee"
            ]
        },
        "is_public": True
    },
    {
        "id": "product_subscription_001",
        "name": "Subscription Product Template",
        "category": "subscription",
        "description": "Template for subscription-based products",
        "thumbnail": "https://via.placeholder.com/300x200?text=Subscription",
        "structure": {
            "name": "[Subscription Name]",
            "product_type": "subscription",
            "pricing_type": "subscription",
            "price": 29.00,
            "billing_period": "monthly",
            "trial_period_days": 14,
            "description": "Get ongoing access to [value proposition]",
            "features": [
                "Monthly new content",
                "Community access",
                "Live events",
                "Priority support",
                "Cancel anytime"
            ]
        },
        "is_public": True
    },
    {
        "id": "product_physical_001",
        "name": "Physical Product Template",
        "category": "physical",
        "description": "Template for physical products",
        "thumbnail": "https://via.placeholder.com/300x200?text=Physical+Product",
        "structure": {
            "name": "[Product Name]",
            "product_type": "physical",
            "pricing_type": "one_time",
            "price": 99.00,
            "requires_shipping": True,
            "track_inventory": True,
            "inventory_quantity": 100,
            "description": "High-quality [product type] that [key benefit]",
            "specifications": {
                "Dimensions": "[L x W x H]",
                "Weight": "[weight]",
                "Material": "[material]",
                "Color": "[color options]"
            },
            "features": [
                "Premium materials",
                "Durable construction",
                "Easy to use",
                "Satisfaction guaranteed"
            ]
        },
        "is_public": True
    }
]

# ==================== WORKFLOW TEMPLATES ====================

WORKFLOW_TEMPLATES = [
    {
        "id": "workflow_welcome_001",
        "name": "Welcome Email Sequence",
        "category": "welcome",
        "description": "Automated welcome sequence for new subscribers",
        "thumbnail": "https://via.placeholder.com/400x300?text=Welcome+Sequence",
        "trigger_type": "contact_created",
        "structure": {
            "steps": [
                {"type": "wait", "duration": "immediate"},
                {"type": "send_email", "template": "welcome_email_1", "subject": "Welcome! Here's what to expect"},
                {"type": "wait", "duration": "2_days"},
                {"type": "send_email", "template": "welcome_email_2", "subject": "Your first steps"},
                {"type": "wait", "duration": "3_days"},
                {"type": "send_email", "template": "welcome_email_3", "subject": "Exclusive tips for you"},
                {"type": "wait", "duration": "5_days"},
                {"type": "send_email", "template": "welcome_email_4", "subject": "Special offer inside"}
            ]
        },
        "is_public": True
    },
    {
        "id": "workflow_nurture_001",
        "name": "Lead Nurture Campaign",
        "category": "nurture",
        "description": "Nurture leads with educational content",
        "thumbnail": "https://via.placeholder.com/400x300?text=Nurture+Campaign",
        "trigger_type": "tag_added",
        "structure": {
            "steps": [
                {"type": "wait", "duration": "1_day"},
                {"type": "send_email", "subject": "Here's what you need to know about [topic]"},
                {"type": "wait", "duration": "3_days"},
                {"type": "send_email", "subject": "Case study: How [customer] achieved [result]"},
                {"type": "wait", "duration": "5_days"},
                {"type": "conditional", "condition": "email_opened", "yes": "send_offer", "no": "send_reminder"},
                {"type": "wait", "duration": "7_days"},
                {"type": "send_email", "subject": "Ready to get started?"}
            ]
        },
        "is_public": True
    }
]

# Function to get templates by category
def get_templates_by_module(module_name):
    """Get all templates for a specific module"""
    templates_map = {
        "email": EMAIL_TEMPLATES,
        "funnel": FUNNEL_TEMPLATES,
        "form": FORM_TEMPLATES,
        "course": COURSE_TEMPLATES,
        "blog": BLOG_TEMPLATES,
        "webinar": WEBINAR_TEMPLATES,
        "product": PRODUCT_TEMPLATES,
        "workflow": WORKFLOW_TEMPLATES
    }
    return templates_map.get(module_name.lower(), [])

def get_all_templates():
    """Get all available templates"""
    return {
        "email": EMAIL_TEMPLATES,
        "funnel": FUNNEL_TEMPLATES,
        "form": FORM_TEMPLATES,
        "course": COURSE_TEMPLATES,
        "blog": BLOG_TEMPLATES,
        "webinar": WEBINAR_TEMPLATES,
        "product": PRODUCT_TEMPLATES,
        "workflow": WORKFLOW_TEMPLATES
    }
