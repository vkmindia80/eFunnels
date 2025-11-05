"""
Website Section Templates Library
Professional pre-designed sections for the Website Builder
"""

# Hero Section Templates
HERO_TEMPLATES = [
    {
        "id": "hero_centered_1",
        "name": "Centered Hero with CTA",
        "category": "hero",
        "thumbnail": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400",
        "blocks": [
            {
                "type": "hero",
                "content": {
                    "headline": "Transform Your Business with AI",
                    "subheadline": "Powerful tools to grow your business faster and smarter",
                    "cta_text": "Get Started Free",
                    "cta_link": "#signup"
                },
                "style": {
                    "backgroundColor": "#1F2937",
                    "textColor": "#FFFFFF",
                    "alignment": "center",
                    "padding": "80px 20px",
                    "headingSize": "48px",
                    "subheadingSize": "20px"
                }
            }
        ]
    },
    {
        "id": "hero_split_2",
        "name": "Split Hero with Image",
        "category": "hero",
        "thumbnail": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400",
        "blocks": [
            {
                "type": "hero",
                "content": {
                    "headline": "Build Something Amazing",
                    "subheadline": "The #1 platform for creators and entrepreneurs",
                    "cta_text": "Start Building",
                    "image_url": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800"
                },
                "style": {
                    "layout": "split",
                    "backgroundColor": "#F9FAFB",
                    "textColor": "#111827",
                    "alignment": "left",
                    "padding": "60px 40px"
                }
            }
        ]
    },
    {
        "id": "hero_video_3",
        "name": "Hero with Video Background",
        "category": "hero",
        "thumbnail": "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400",
        "blocks": [
            {
                "type": "hero",
                "content": {
                    "headline": "Experience Innovation",
                    "subheadline": "Join thousands of successful businesses",
                    "cta_text": "Watch Demo"
                },
                "style": {
                    "backgroundType": "video",
                    "backgroundColor": "rgba(0,0,0,0.5)",
                    "textColor": "#FFFFFF",
                    "alignment": "center",
                    "padding": "100px 20px"
                }
            }
        ]
    }
]

# About Section Templates
ABOUT_TEMPLATES = [
    {
        "id": "about_story_1",
        "name": "Our Story",
        "category": "about",
        "thumbnail": "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400",
        "blocks": [
            {
                "type": "text",
                "content": {
                    "headline": "About Us",
                    "text": "<p>We're a passionate team dedicated to helping businesses succeed in the digital age. Founded in 2020, we've grown from a small startup to serving over 10,000 customers worldwide.</p><p>Our mission is to democratize technology and make powerful business tools accessible to everyone.</p>"
                },
                "style": {
                    "backgroundColor": "#FFFFFF",
                    "padding": "60px 40px",
                    "maxWidth": "800px"
                }
            }
        ]
    },
    {
        "id": "about_team_2",
        "name": "Meet the Team",
        "category": "about",
        "thumbnail": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400",
        "blocks": [
            {
                "type": "features",
                "content": {
                    "headline": "Meet Our Team",
                    "subheadline": "Experts passionate about your success",
                    "features": [
                        {
                            "title": "John Doe",
                            "description": "CEO & Founder",
                            "icon": "user"
                        },
                        {
                            "title": "Jane Smith",
                            "description": "CTO",
                            "icon": "user"
                        },
                        {
                            "title": "Mike Johnson",
                            "description": "Head of Product",
                            "icon": "user"
                        }
                    ]
                },
                "style": {
                    "layout": "grid",
                    "columns": 3
                }
            }
        ]
    }
]

# Services/Features Section Templates
SERVICES_TEMPLATES = [
    {
        "id": "services_grid_1",
        "name": "Services Grid",
        "category": "services",
        "thumbnail": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
        "blocks": [
            {
                "type": "features",
                "content": {
                    "headline": "Our Services",
                    "subheadline": "Everything you need to succeed",
                    "features": [
                        {
                            "title": "Web Design",
                            "description": "Beautiful, responsive websites that convert",
                            "icon": "layout"
                        },
                        {
                            "title": "SEO Optimization",
                            "description": "Rank higher in search results",
                            "icon": "search"
                        },
                        {
                            "title": "Content Marketing",
                            "description": "Engage your audience with great content",
                            "icon": "file-text"
                        }
                    ]
                },
                "style": {
                    "layout": "grid",
                    "columns": 3,
                    "backgroundColor": "#F9FAFB",
                    "padding": "80px 40px"
                }
            }
        ]
    },
    {
        "id": "services_list_2",
        "name": "Services List",
        "category": "services",
        "thumbnail": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400",
        "blocks": [
            {
                "type": "features",
                "content": {
                    "headline": "What We Do",
                    "features": [
                        {
                            "title": "Strategy & Planning",
                            "description": "We analyze your goals and create a roadmap for success"
                        },
                        {
                            "title": "Design & Development",
                            "description": "Beautiful interfaces that work flawlessly across all devices"
                        },
                        {
                            "title": "Launch & Support",
                            "description": "Ongoing support to ensure your continued success"
                        }
                    ]
                },
                "style": {
                    "layout": "list",
                    "padding": "60px 40px"
                }
            }
        ]
    }
]

# Testimonials Section Templates
TESTIMONIALS_TEMPLATES = [
    {
        "id": "testimonials_grid_1",
        "name": "Testimonials Grid",
        "category": "testimonials",
        "thumbnail": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400",
        "blocks": [
            {
                "type": "testimonials",
                "content": {
                    "headline": "What Our Clients Say",
                    "testimonials": [
                        {
                            "quote": "This platform transformed our business. We saw 300% growth in just 6 months!",
                            "author": "Sarah Johnson",
                            "role": "CEO, TechCorp",
                            "avatar": "https://i.pravatar.cc/150?img=1"
                        },
                        {
                            "quote": "Best investment we've made. The ROI is incredible.",
                            "author": "Michael Chen",
                            "role": "Founder, StartupXYZ",
                            "avatar": "https://i.pravatar.cc/150?img=2"
                        },
                        {
                            "quote": "Outstanding support and powerful features. Highly recommended!",
                            "author": "Emily Davis",
                            "role": "Marketing Director",
                            "avatar": "https://i.pravatar.cc/150?img=3"
                        }
                    ]
                },
                "style": {
                    "layout": "grid",
                    "columns": 3,
                    "backgroundColor": "#FFFFFF",
                    "padding": "80px 40px"
                }
            }
        ]
    },
    {
        "id": "testimonials_carousel_2",
        "name": "Testimonials Carousel",
        "category": "testimonials",
        "thumbnail": "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400",
        "blocks": [
            {
                "type": "testimonials",
                "content": {
                    "headline": "Trusted by Thousands",
                    "testimonials": [
                        {
                            "quote": "Game-changing platform for our business",
                            "author": "David Wilson",
                            "role": "Entrepreneur"
                        }
                    ]
                },
                "style": {
                    "layout": "carousel",
                    "backgroundColor": "#F3F4F6",
                    "padding": "60px 40px"
                }
            }
        ]
    }
]

# Contact Section Templates
CONTACT_TEMPLATES = [
    {
        "id": "contact_form_1",
        "name": "Contact Form with Info",
        "category": "contact",
        "thumbnail": "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400",
        "blocks": [
            {
                "type": "contact_form",
                "content": {
                    "headline": "Get In Touch",
                    "subheadline": "We'd love to hear from you",
                    "form_fields": ["name", "email", "phone", "message"],
                    "contact_info": {
                        "email": "hello@company.com",
                        "phone": "+1 (555) 123-4567",
                        "address": "123 Business St, City, State 12345"
                    }
                },
                "style": {
                    "layout": "split",
                    "padding": "60px 40px"
                }
            }
        ]
    },
    {
        "id": "contact_map_2",
        "name": "Contact with Map",
        "category": "contact",
        "thumbnail": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400",
        "blocks": [
            {
                "type": "contact_form",
                "content": {
                    "headline": "Visit Us",
                    "show_map": True,
                    "location": "New York, NY"
                },
                "style": {
                    "padding": "60px 40px"
                }
            }
        ]
    }
]

# CTA Section Templates
CTA_TEMPLATES = [
    {
        "id": "cta_centered_1",
        "name": "Centered CTA",
        "category": "cta",
        "thumbnail": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400",
        "blocks": [
            {
                "type": "cta",
                "content": {
                    "headline": "Ready to Get Started?",
                    "subheadline": "Join thousands of successful businesses today",
                    "cta_text": "Start Free Trial",
                    "secondary_text": "No credit card required"
                },
                "style": {
                    "backgroundColor": "#3B82F6",
                    "textColor": "#FFFFFF",
                    "alignment": "center",
                    "padding": "80px 40px"
                }
            }
        ]
    },
    {
        "id": "cta_split_2",
        "name": "Split CTA",
        "category": "cta",
        "thumbnail": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400",
        "blocks": [
            {
                "type": "cta",
                "content": {
                    "headline": "Take Your Business to the Next Level",
                    "cta_text": "Get Started Now"
                },
                "style": {
                    "layout": "split",
                    "backgroundColor": "#1F2937",
                    "textColor": "#FFFFFF",
                    "padding": "60px 40px"
                }
            }
        ]
    }
]

# Footer Templates
FOOTER_TEMPLATES = [
    {
        "id": "footer_comprehensive_1",
        "name": "Comprehensive Footer",
        "category": "footer",
        "thumbnail": "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=400",
        "blocks": [
            {
                "type": "footer",
                "content": {
                    "company_name": "Your Company",
                    "tagline": "Building better businesses",
                    "columns": [
                        {
                            "title": "Product",
                            "links": ["Features", "Pricing", "Security", "Roadmap"]
                        },
                        {
                            "title": "Company",
                            "links": ["About", "Blog", "Careers", "Contact"]
                        },
                        {
                            "title": "Resources",
                            "links": ["Help Center", "Documentation", "API", "Status"]
                        }
                    ],
                    "social_links": ["twitter", "facebook", "linkedin", "instagram"],
                    "copyright": "© 2024 Your Company. All rights reserved."
                },
                "style": {
                    "backgroundColor": "#1F2937",
                    "textColor": "#9CA3AF",
                    "padding": "60px 40px 30px"
                }
            }
        ]
    },
    {
        "id": "footer_minimal_2",
        "name": "Minimal Footer",
        "category": "footer",
        "thumbnail": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
        "blocks": [
            {
                "type": "footer",
                "content": {
                    "company_name": "Your Company",
                    "social_links": ["twitter", "linkedin", "github"],
                    "copyright": "© 2024 Your Company"
                },
                "style": {
                    "layout": "minimal",
                    "backgroundColor": "#F9FAFB",
                    "textColor": "#6B7280",
                    "padding": "40px 20px"
                }
            }
        ]
    }
]

# Portfolio/Gallery Templates
PORTFOLIO_TEMPLATES = [
    {
        "id": "portfolio_grid_1",
        "name": "Portfolio Grid",
        "category": "portfolio",
        "thumbnail": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
        "blocks": [
            {
                "type": "image_gallery",
                "content": {
                    "headline": "Our Work",
                    "subheadline": "Check out some of our recent projects",
                    "images": [
                        {
                            "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
                            "title": "Project 1",
                            "category": "Web Design"
                        },
                        {
                            "url": "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=600",
                            "title": "Project 2",
                            "category": "Branding"
                        },
                        {
                            "url": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600",
                            "title": "Project 3",
                            "category": "Marketing"
                        }
                    ]
                },
                "style": {
                    "layout": "grid",
                    "columns": 3,
                    "padding": "60px 40px"
                }
            }
        ]
    },
    {
        "id": "portfolio_masonry_2",
        "name": "Masonry Gallery",
        "category": "portfolio",
        "thumbnail": "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=400",
        "blocks": [
            {
                "type": "image_gallery",
                "content": {
                    "headline": "Gallery",
                    "images": []
                },
                "style": {
                    "layout": "masonry",
                    "padding": "60px 40px"
                }
            }
        ]
    }
]

# Pricing Section Templates
PRICING_TEMPLATES = [
    {
        "id": "pricing_three_tier_1",
        "name": "Three Tier Pricing",
        "category": "pricing",
        "thumbnail": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
        "blocks": [
            {
                "type": "pricing",
                "content": {
                    "headline": "Simple, Transparent Pricing",
                    "subheadline": "Choose the plan that's right for you",
                    "plans": [
                        {
                            "name": "Starter",
                            "price": "$29",
                            "period": "per month",
                            "features": ["Feature 1", "Feature 2", "Feature 3"],
                            "cta_text": "Get Started"
                        },
                        {
                            "name": "Professional",
                            "price": "$79",
                            "period": "per month",
                            "featured": True,
                            "features": ["Everything in Starter", "Feature 4", "Feature 5", "Priority Support"],
                            "cta_text": "Get Started"
                        },
                        {
                            "name": "Enterprise",
                            "price": "$199",
                            "period": "per month",
                            "features": ["Everything in Pro", "Feature 6", "Feature 7", "Dedicated Account Manager"],
                            "cta_text": "Contact Sales"
                        }
                    ]
                },
                "style": {
                    "layout": "grid",
                    "columns": 3,
                    "padding": "80px 40px"
                }
            }
        ]
    }
]

# FAQ Section Templates
FAQ_TEMPLATES = [
    {
        "id": "faq_accordion_1",
        "name": "FAQ Accordion",
        "category": "faq",
        "thumbnail": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400",
        "blocks": [
            {
                "type": "faq",
                "content": {
                    "headline": "Frequently Asked Questions",
                    "subheadline": "Everything you need to know",
                    "questions": [
                        {
                            "question": "How does it work?",
                            "answer": "Our platform is designed to be intuitive and easy to use. Simply sign up, configure your settings, and start building."
                        },
                        {
                            "question": "What's included in the free plan?",
                            "answer": "The free plan includes all basic features, up to 500 contacts, and 1,000 emails per month."
                        },
                        {
                            "question": "Can I upgrade or downgrade anytime?",
                            "answer": "Yes! You can change your plan at any time. Changes take effect immediately."
                        },
                        {
                            "question": "Do you offer refunds?",
                            "answer": "We offer a 30-day money-back guarantee on all paid plans."
                        }
                    ]
                },
                "style": {
                    "layout": "accordion",
                    "padding": "60px 40px",
                    "maxWidth": "800px"
                }
            }
        ]
    }
]

# All templates combined
ALL_TEMPLATES = {
    "hero": HERO_TEMPLATES,
    "about": ABOUT_TEMPLATES,
    "services": SERVICES_TEMPLATES,
    "testimonials": TESTIMONIALS_TEMPLATES,
    "contact": CONTACT_TEMPLATES,
    "cta": CTA_TEMPLATES,
    "footer": FOOTER_TEMPLATES,
    "portfolio": PORTFOLIO_TEMPLATES,
    "pricing": PRICING_TEMPLATES,
    "faq": FAQ_TEMPLATES
}

def get_all_templates():
    """Get all section templates"""
    templates = []
    for category, template_list in ALL_TEMPLATES.items():
        templates.extend(template_list)
    return templates

def get_templates_by_category(category: str):
    """Get templates by category"""
    return ALL_TEMPLATES.get(category, [])

def get_template_by_id(template_id: str):
    """Get a specific template by ID"""
    for templates in ALL_TEMPLATES.values():
        for template in templates:
            if template["id"] == template_id:
                return template
    return None
