"""
Advanced Website Builder Blocks
Extended block library with 25+ professional blocks
"""

ADVANCED_BLOCKS = {
    # Content Blocks
    "rich_text": {
        "type": "rich_text",
        "name": "Rich Text Editor",
        "category": "content",
        "icon": "file-text",
        "content": {
            "text": "<p>Rich text content goes here. You can format with <strong>bold</strong>, <em>italic</em>, and more.</p>"
        },
        "style": {
            "backgroundColor": "#FFFFFF",
            "textColor": "#111827",
            "padding": "40px 20px",
            "alignment": "left",
            "fontSize": "16px",
            "lineHeight": "1.6"
        }
    },
    
    "accordion": {
        "type": "accordion",
        "name": "Accordion",
        "category": "content",
        "icon": "chevron-down",
        "content": {
            "items": [
                {
                    "title": "Item 1",
                    "content": "Content for item 1"
                },
                {
                    "title": "Item 2",
                    "content": "Content for item 2"
                }
            ]
        },
        "style": {
            "backgroundColor": "#FFFFFF",
            "padding": "40px 20px"
        }
    },
    
    "tabs": {
        "type": "tabs",
        "name": "Tabs",
        "category": "content",
        "icon": "layout",
        "content": {
            "tabs": [
                {
                    "title": "Tab 1",
                    "content": "Content for tab 1"
                },
                {
                    "title": "Tab 2",
                    "content": "Content for tab 2"
                },
                {
                    "title": "Tab 3",
                    "content": "Content for tab 3"
                }
            ]
        },
        "style": {
            "padding": "40px 20px"
        }
    },
    
    "timeline": {
        "type": "timeline",
        "name": "Timeline",
        "category": "content",
        "icon": "git-commit",
        "content": {
            "events": [
                {
                    "year": "2020",
                    "title": "Company Founded",
                    "description": "We started our journey"
                },
                {
                    "year": "2021",
                    "title": "First Product Launch",
                    "description": "Released our flagship product"
                },
                {
                    "year": "2023",
                    "title": "10,000 Customers",
                    "description": "Reached major milestone"
                }
            ]
        },
        "style": {
            "padding": "60px 20px"
        }
    },
    
    "counter": {
        "type": "counter",
        "name": "Counter Stats",
        "category": "content",
        "icon": "bar-chart",
        "content": {
            "counters": [
                {
                    "number": "10000",
                    "suffix": "+",
                    "label": "Happy Customers"
                },
                {
                    "number": "50",
                    "suffix": "+",
                    "label": "Countries"
                },
                {
                    "number": "99",
                    "suffix": "%",
                    "label": "Satisfaction Rate"
                }
            ]
        },
        "style": {
            "layout": "grid",
            "columns": 3,
            "backgroundColor": "#F9FAFB",
            "padding": "60px 20px"
        }
    },
    
    "progress_bar": {
        "type": "progress_bar",
        "name": "Progress Bars",
        "category": "content",
        "icon": "trending-up",
        "content": {
            "bars": [
                {
                    "label": "Web Design",
                    "percentage": 90
                },
                {
                    "label": "Development",
                    "percentage": 85
                },
                {
                    "label": "SEO",
                    "percentage": 95
                }
            ]
        },
        "style": {
            "padding": "40px 20px"
        }
    },
    
    # Media Blocks
    "video_background": {
        "type": "video_background",
        "name": "Video Background",
        "category": "media",
        "icon": "video",
        "content": {
            "video_url": "https://example.com/video.mp4",
            "poster": "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=1200",
            "headline": "Watch Our Story",
            "overlay_opacity": 0.5
        },
        "style": {
            "height": "500px",
            "textColor": "#FFFFFF"
        }
    },
    
    "image_gallery": {
        "type": "image_gallery",
        "name": "Image Gallery",
        "category": "media",
        "icon": "image",
        "content": {
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
                    "alt": "Image 1",
                    "caption": "Caption 1"
                },
                {
                    "url": "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=600",
                    "alt": "Image 2",
                    "caption": "Caption 2"
                }
            ]
        },
        "style": {
            "layout": "grid",
            "columns": 3,
            "gap": "20px",
            "padding": "40px 20px"
        }
    },
    
    "image_carousel": {
        "type": "image_carousel",
        "name": "Image Carousel",
        "category": "media",
        "icon": "chevrons-right",
        "content": {
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200",
                    "caption": "Slide 1"
                },
                {
                    "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200",
                    "caption": "Slide 2"
                }
            ],
            "autoplay": True,
            "interval": 5000
        },
        "style": {
            "height": "400px"
        }
    },
    
    "audio_player": {
        "type": "audio_player",
        "name": "Audio Player",
        "category": "media",
        "icon": "music",
        "content": {
            "audio_url": "https://example.com/audio.mp3",
            "title": "Podcast Episode",
            "description": "Listen to our latest episode"
        },
        "style": {
            "padding": "40px 20px"
        }
    },
    
    # Interactive Blocks
    "advanced_form": {
        "type": "advanced_form",
        "name": "Advanced Contact Form",
        "category": "interactive",
        "icon": "mail",
        "content": {
            "headline": "Get In Touch",
            "fields": [
                {
                    "type": "text",
                    "label": "Name",
                    "placeholder": "Your name",
                    "required": True
                },
                {
                    "type": "email",
                    "label": "Email",
                    "placeholder": "your@email.com",
                    "required": True
                },
                {
                    "type": "tel",
                    "label": "Phone",
                    "placeholder": "(555) 123-4567"
                },
                {
                    "type": "textarea",
                    "label": "Message",
                    "placeholder": "Your message",
                    "required": True
                }
            ],
            "submit_text": "Send Message"
        },
        "style": {
            "padding": "40px 20px",
            "maxWidth": "600px"
        }
    },
    
    "search_bar": {
        "type": "search_bar",
        "name": "Search Bar",
        "category": "interactive",
        "icon": "search",
        "content": {
            "placeholder": "Search...",
            "button_text": "Search"
        },
        "style": {
            "padding": "20px",
            "alignment": "center"
        }
    },
    
    "social_feed": {
        "type": "social_feed",
        "name": "Social Media Feed",
        "category": "interactive",
        "icon": "share-2",
        "content": {
            "headline": "Follow Us",
            "platform": "twitter",
            "handle": "@yourcompany",
            "posts_count": 6
        },
        "style": {
            "padding": "60px 20px"
        }
    },
    
    "map": {
        "type": "map",
        "name": "Map",
        "category": "interactive",
        "icon": "map-pin",
        "content": {
            "location": "New York, NY",
            "zoom": 12,
            "show_marker": True
        },
        "style": {
            "height": "400px"
        }
    },
    
    # E-commerce Blocks
    "product_showcase": {
        "type": "product_showcase",
        "name": "Product Showcase",
        "category": "ecommerce",
        "icon": "shopping-bag",
        "content": {
            "headline": "Featured Products",
            "products": [
                {
                    "name": "Product 1",
                    "price": "$99",
                    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
                    "description": "Amazing product"
                }
            ]
        },
        "style": {
            "layout": "grid",
            "columns": 3,
            "padding": "60px 20px"
        }
    },
    
    "pricing_comparison": {
        "type": "pricing_comparison",
        "name": "Pricing Comparison Table",
        "category": "ecommerce",
        "icon": "dollar-sign",
        "content": {
            "headline": "Compare Plans",
            "features": ["Feature 1", "Feature 2", "Feature 3"],
            "plans": [
                {
                    "name": "Basic",
                    "price": "$29",
                    "features": [True, False, False]
                },
                {
                    "name": "Pro",
                    "price": "$79",
                    "features": [True, True, False]
                },
                {
                    "name": "Enterprise",
                    "price": "$199",
                    "features": [True, True, True]
                }
            ]
        },
        "style": {
            "padding": "60px 20px"
        }
    },
    
    "shopping_cart_widget": {
        "type": "shopping_cart_widget",
        "name": "Shopping Cart Widget",
        "category": "ecommerce",
        "icon": "shopping-cart",
        "content": {
            "position": "top-right",
            "show_count": True
        },
        "style": {}
    },
    
    # Marketing Blocks
    "newsletter_signup": {
        "type": "newsletter_signup",
        "name": "Newsletter Signup",
        "category": "marketing",
        "icon": "mail",
        "content": {
            "headline": "Subscribe to Our Newsletter",
            "subheadline": "Get the latest updates delivered to your inbox",
            "placeholder": "Enter your email",
            "button_text": "Subscribe",
            "privacy_text": "We respect your privacy. Unsubscribe anytime."
        },
        "style": {
            "backgroundColor": "#3B82F6",
            "textColor": "#FFFFFF",
            "padding": "60px 20px",
            "alignment": "center"
        }
    },
    
    "popup_modal": {
        "type": "popup_modal",
        "name": "Popup Modal",
        "category": "marketing",
        "icon": "maximize",
        "content": {
            "headline": "Special Offer!",
            "message": "Get 20% off your first order",
            "cta_text": "Claim Offer",
            "trigger": "exit_intent",
            "delay": 5000
        },
        "style": {
            "backgroundColor": "#FFFFFF",
            "textColor": "#111827"
        }
    },
    
    "announcement_bar": {
        "type": "announcement_bar",
        "name": "Announcement Bar",
        "category": "marketing",
        "icon": "bell",
        "content": {
            "message": "🎉 Special Sale! Get 50% off everything this weekend",
            "link": "/sale",
            "link_text": "Shop Now",
            "dismissible": True
        },
        "style": {
            "backgroundColor": "#10B981",
            "textColor": "#FFFFFF",
            "position": "top"
        }
    },
    
    "social_proof": {
        "type": "social_proof",
        "name": "Social Proof Widget",
        "category": "marketing",
        "icon": "users",
        "content": {
            "messages": [
                "John from New York just purchased",
                "Sarah from London is viewing this page",
                "Mike from Tokyo just signed up"
            ],
            "display_time": 5000
        },
        "style": {
            "position": "bottom-left"
        }
    },
    
    # Layout Blocks
    "multi_column_grid": {
        "type": "multi_column_grid",
        "name": "Multi-Column Grid",
        "category": "layout",
        "icon": "grid",
        "content": {
            "columns": 3,
            "items": []
        },
        "style": {
            "gap": "20px",
            "padding": "40px 20px"
        }
    },
    
    "card_grid": {
        "type": "card_grid",
        "name": "Card Grid",
        "category": "layout",
        "icon": "square",
        "content": {
            "cards": [
                {
                    "title": "Card 1",
                    "description": "Card description",
                    "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400"
                }
            ]
        },
        "style": {
            "columns": 3,
            "gap": "20px",
            "padding": "40px 20px"
        }
    },
    
    "masonry_layout": {
        "type": "masonry_layout",
        "name": "Masonry Layout",
        "category": "layout",
        "icon": "package",
        "content": {
            "items": []
        },
        "style": {
            "columns": 3,
            "gap": "20px",
            "padding": "40px 20px"
        }
    },
    
    "sticky_header": {
        "type": "sticky_header",
        "name": "Sticky Header",
        "category": "layout",
        "icon": "layout",
        "content": {
            "logo_text": "Your Logo",
            "menu_items": [
                {"label": "Home", "url": "/"},
                {"label": "About", "url": "/about"},
                {"label": "Services", "url": "/services"},
                {"label": "Contact", "url": "/contact"}
            ],
            "cta_text": "Get Started",
            "cta_link": "/signup"
        },
        "style": {
            "backgroundColor": "#FFFFFF",
            "textColor": "#111827",
            "sticky": True
        }
    }
}

def get_all_advanced_blocks():
    """Get all advanced blocks"""
    return ADVANCED_BLOCKS

def get_blocks_by_category(category: str):
    """Get blocks filtered by category"""
    return {k: v for k, v in ADVANCED_BLOCKS.items() if v.get("category") == category}

def get_block_by_type(block_type: str):
    """Get a specific block by type"""
    return ADVANCED_BLOCKS.get(block_type)

# Block categories for organization
BLOCK_CATEGORIES = {
    "content": "Content",
    "media": "Media",
    "interactive": "Interactive",
    "ecommerce": "E-commerce",
    "marketing": "Marketing",
    "layout": "Layout"
}
