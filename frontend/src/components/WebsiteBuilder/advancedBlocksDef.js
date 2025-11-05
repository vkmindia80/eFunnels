// Advanced Blocks Definitions for Frontend
// These complement the existing funnel blocks

export const advancedBlocks = {
  // Existing blocks from FunnelBuilder (reused)
  hero: {
    type: 'hero',
    name: 'Hero Section',
    category: 'basic',
    icon: 'star'
  },
  text: {
    type: 'text',
    name: 'Text Block',
    category: 'basic',
    icon: 'type'
  },
  image: {
    type: 'image',
    name: 'Image',
    category: 'basic',
    icon: 'image'
  },
  video: {
    type: 'video',
    name: 'Video',
    category: 'basic',
    icon: 'video'
  },
  button: {
    type: 'button',
    name: 'Button',
    category: 'basic',
    icon: 'mouse-pointer'
  },
  divider: {
    type: 'divider',
    name: 'Divider',
    category: 'basic',
    icon: 'minus'
  },
  spacer: {
    type: 'spacer',
    name: 'Spacer',
    category: 'basic',
    icon: 'move-vertical'
  },
  features: {
    type: 'features',
    name: 'Features Grid',
    category: 'basic',
    icon: 'grid'
  },
  testimonials: {
    type: 'testimonials',
    name: 'Testimonials',
    category: 'basic',
    icon: 'message-square'
  },
  pricing: {
    type: 'pricing',
    name: 'Pricing Table',
    category: 'basic',
    icon: 'dollar-sign'
  },
  cta: {
    type: 'cta',
    name: 'Call to Action',
    category: 'basic',
    icon: 'zap'
  },
  contact_form: {
    type: 'contact_form',
    name: 'Contact Form',
    category: 'basic',
    icon: 'mail'
  },
  
  // NEW ADVANCED BLOCKS
  
  // Content Blocks
  rich_text: {
    type: 'rich_text',
    name: 'Rich Text Editor',
    category: 'content',
    icon: 'file-text',
    defaultContent: {
      text: '<p>Rich text content with <strong>formatting</strong></p>'
    }
  },
  accordion: {
    type: 'accordion',
    name: 'Accordion',
    category: 'content',
    icon: 'chevron-down',
    defaultContent: {
      items: [
        { title: 'Item 1', content: 'Content 1' },
        { title: 'Item 2', content: 'Content 2' }
      ]
    }
  },
  tabs: {
    type: 'tabs',
    name: 'Tabs',
    category: 'content',
    icon: 'layout',
    defaultContent: {
      tabs: [
        { title: 'Tab 1', content: 'Content 1' },
        { title: 'Tab 2', content: 'Content 2' }
      ]
    }
  },
  timeline: {
    type: 'timeline',
    name: 'Timeline',
    category: 'content',
    icon: 'git-commit',
    defaultContent: {
      events: [
        { year: '2020', title: 'Event 1', description: 'Description 1' }
      ]
    }
  },
  counter: {
    type: 'counter',
    name: 'Counter Stats',
    category: 'content',
    icon: 'bar-chart',
    defaultContent: {
      counters: [
        { number: '1000', suffix: '+', label: 'Customers' }
      ]
    }
  },
  progress_bar: {
    type: 'progress_bar',
    name: 'Progress Bars',
    category: 'content',
    icon: 'trending-up',
    defaultContent: {
      bars: [
        { label: 'Skill 1', percentage: 90 }
      ]
    }
  },
  
  // Media Blocks
  video_background: {
    type: 'video_background',
    name: 'Video Background',
    category: 'media',
    icon: 'video',
    defaultContent: {
      video_url: '',
      headline: 'Your Headline',
      overlay_opacity: 0.5
    }
  },
  image_gallery: {
    type: 'image_gallery',
    name: 'Image Gallery',
    category: 'media',
    icon: 'image',
    defaultContent: {
      images: []
    }
  },
  image_carousel: {
    type: 'image_carousel',
    name: 'Image Carousel',
    category: 'media',
    icon: 'chevrons-right',
    defaultContent: {
      images: [],
      autoplay: true,
      interval: 5000
    }
  },
  audio_player: {
    type: 'audio_player',
    name: 'Audio Player',
    category: 'media',
    icon: 'music',
    defaultContent: {
      audio_url: '',
      title: 'Audio Title'
    }
  },
  
  // Interactive Blocks
  advanced_form: {
    type: 'advanced_form',
    name: 'Advanced Form',
    category: 'interactive',
    icon: 'mail',
    defaultContent: {
      headline: 'Get In Touch',
      fields: [
        { type: 'text', label: 'Name', required: true }
      ]
    }
  },
  search_bar: {
    type: 'search_bar',
    name: 'Search Bar',
    category: 'interactive',
    icon: 'search',
    defaultContent: {
      placeholder: 'Search...',
      button_text: 'Search'
    }
  },
  social_feed: {
    type: 'social_feed',
    name: 'Social Feed',
    category: 'interactive',
    icon: 'share-2',
    defaultContent: {
      platform: 'twitter',
      handle: '@company'
    }
  },
  map: {
    type: 'map',
    name: 'Map',
    category: 'interactive',
    icon: 'map-pin',
    defaultContent: {
      location: 'New York, NY',
      zoom: 12
    }
  },
  
  // E-commerce Blocks
  product_showcase: {
    type: 'product_showcase',
    name: 'Product Showcase',
    category: 'ecommerce',
    icon: 'shopping-bag',
    defaultContent: {
      headline: 'Featured Products',
      products: []
    }
  },
  pricing_comparison: {
    type: 'pricing_comparison',
    name: 'Pricing Comparison',
    category: 'ecommerce',
    icon: 'dollar-sign',
    defaultContent: {
      headline: 'Compare Plans',
      plans: []
    }
  },
  
  // Marketing Blocks
  newsletter_signup: {
    type: 'newsletter_signup',
    name: 'Newsletter',
    category: 'marketing',
    icon: 'mail',
    defaultContent: {
      headline: 'Subscribe',
      subheadline: 'Get updates',
      placeholder: 'Enter email'
    }
  },
  popup_modal: {
    type: 'popup_modal',
    name: 'Popup Modal',
    category: 'marketing',
    icon: 'maximize',
    defaultContent: {
      headline: 'Special Offer',
      message: 'Limited time offer'
    }
  },
  announcement_bar: {
    type: 'announcement_bar',
    name: 'Announcement Bar',
    category: 'marketing',
    icon: 'bell',
    defaultContent: {
      message: 'Important announcement',
      link: '/',
      dismissible: true
    }
  },
  social_proof: {
    type: 'social_proof',
    name: 'Social Proof',
    category: 'marketing',
    icon: 'users',
    defaultContent: {
      messages: ['Someone just purchased!']
    }
  },
  
  // Layout Blocks
  multi_column_grid: {
    type: 'multi_column_grid',
    name: 'Multi-Column Grid',
    category: 'layout',
    icon: 'grid',
    defaultContent: {
      columns: 3,
      items: []
    }
  },
  card_grid: {
    type: 'card_grid',
    name: 'Card Grid',
    category: 'layout',
    icon: 'square',
    defaultContent: {
      cards: []
    }
  },
  masonry_layout: {
    type: 'masonry_layout',
    name: 'Masonry Layout',
    category: 'layout',
    icon: 'package',
    defaultContent: {
      items: []
    }
  },
  sticky_header: {
    type: 'sticky_header',
    name: 'Sticky Header',
    category: 'layout',
    icon: 'layout',
    defaultContent: {
      logo_text: 'Logo',
      menu_items: []
    }
  },
  footer: {
    type: 'footer',
    name: 'Footer',
    category: 'layout',
    icon: 'align-bottom',
    defaultContent: {
      company_name: 'Your Company',
      copyright: '© 2024'
    }
  },
  faq: {
    type: 'faq',
    name: 'FAQ Section',
    category: 'content',
    icon: 'help-circle',
    defaultContent: {
      headline: 'FAQ',
      questions: []
    }
  }
};

export const blockCategories = [
  { id: 'basic', label: 'Basic', icon: 'box' },
  { id: 'content', label: 'Content', icon: 'file-text' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'interactive', label: 'Interactive', icon: 'mouse-pointer' },
  { id: 'ecommerce', label: 'E-commerce', icon: 'shopping-cart' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { id: 'layout', label: 'Layout', icon: 'layout' }
];

export const getBlocksByCategory = (category) => {
  if (category === 'all') return Object.values(advancedBlocks);
  return Object.values(advancedBlocks).filter(block => block.category === category);
};

export const getBlockDefinition = (blockType) => {
  return advancedBlocks[blockType] || null;
};

export const createDefaultBlock = (blockType) => {
  const definition = advancedBlocks[blockType];
  if (!definition) return null;
  
  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: blockType,
    content: definition.defaultContent || {},
    style: {
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
      padding: '40px 20px',
      alignment: 'left'
    }
  };
};
