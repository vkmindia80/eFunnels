// Page builder block definitions for funnel pages

export const blockTypes = {
  HERO: 'hero',
  FEATURES: 'features',
  TESTIMONIALS: 'testimonials',
  CTA: 'cta',
  FORM: 'form',
  PRICING: 'pricing',
  FAQ: 'faq',
  VIDEO: 'video',
  TEXT: 'text',
  IMAGE: 'image',
  DIVIDER: 'divider',
  SPACER: 'spacer'
};

export const defaultBlocks = {
  hero: {
    type: 'hero',
    content: {
      headline: 'Your Compelling Headline',
      subheadline: 'A persuasive subheadline that explains the value',
      cta_text: 'Get Started Now',
      cta_link: '#',
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=800&fit=crop'
    },
    style: {
      backgroundColor: '#1e3a8a',
      textColor: '#ffffff',
      alignment: 'center',
      padding: '80px 20px',
      headingSize: '48px',
      subheadingSize: '20px'
    }
  },
  features: {
    type: 'features',
    content: {
      title: 'Amazing Features',
      subtitle: 'Everything you need to succeed',
      features: [
        {
          icon: '⚡',
          title: 'Fast & Easy',
          description: 'Get started in minutes, not hours'
        },
        {
          icon: '🎯',
          title: 'Powerful Tools',
          description: 'Everything you need in one place'
        },
        {
          icon: '💰',
          title: 'Great Value',
          description: 'Premium features at affordable prices'
        }
      ]
    },
    style: {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      padding: '60px 20px',
      columns: 3
    }
  },
  testimonials: {
    type: 'testimonials',
    content: {
      title: 'What Our Customers Say',
      testimonials: [
        {
          name: 'John Doe',
          role: 'CEO, Company Inc',
          avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
          text: 'This product changed my business forever. Highly recommended!',
          rating: 5
        },
        {
          name: 'Jane Smith',
          role: 'Marketing Director',
          avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
          text: 'The best investment we\'ve made this year. Amazing results!',
          rating: 5
        }
      ]
    },
    style: {
      backgroundColor: '#f9fafb',
      textColor: '#111827',
      padding: '60px 20px'
    }
  },
  cta: {
    type: 'cta',
    content: {
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of satisfied customers today',
      button_text: 'Start Free Trial',
      button_link: '#',
      secondary_text: 'No credit card required'
    },
    style: {
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      padding: '80px 20px',
      alignment: 'center'
    }
  },
  form: {
    type: 'form',
    content: {
      title: 'Get In Touch',
      subtitle: 'Fill out the form below and we\'ll get back to you',
      fields: [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: false },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: false },
        { name: 'message', label: 'Message', type: 'textarea', required: false }
      ],
      submit_text: 'Submit',
      success_message: 'Thank you! We\'ll be in touch soon.'
    },
    style: {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      padding: '60px 20px',
      buttonColor: '#3b82f6'
    }
  },
  pricing: {
    type: 'pricing',
    content: {
      title: 'Choose Your Plan',
      subtitle: 'Flexible pricing for every budget',
      plans: [
        {
          name: 'Basic',
          price: '$29',
          period: '/month',
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
          cta_text: 'Get Started',
          recommended: false
        },
        {
          name: 'Pro',
          price: '$79',
          period: '/month',
          features: ['Everything in Basic', 'Feature 4', 'Feature 5', 'Priority Support'],
          cta_text: 'Get Started',
          recommended: true
        },
        {
          name: 'Enterprise',
          price: '$199',
          period: '/month',
          features: ['Everything in Pro', 'Custom Features', 'Dedicated Account Manager'],
          cta_text: 'Contact Us',
          recommended: false
        }
      ]
    },
    style: {
      backgroundColor: '#f9fafb',
      textColor: '#111827',
      padding: '60px 20px'
    }
  },
  faq: {
    type: 'faq',
    content: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to common questions',
      questions: [
        {
          question: 'How does it work?',
          answer: 'Our platform is designed to be intuitive and easy to use. Simply sign up, follow the setup wizard, and you\'ll be ready to go in minutes.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, PayPal, and bank transfers for enterprise plans.'
        },
        {
          question: 'Can I cancel anytime?',
          answer: 'Yes! You can cancel your subscription at any time with no penalties or fees.'
        }
      ]
    },
    style: {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      padding: '60px 20px'
    }
  },
  video: {
    type: 'video',
    content: {
      title: 'Watch Our Video',
      subtitle: 'See how it works in action',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=675&fit=crop'
    },
    style: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      padding: '60px 20px',
      alignment: 'center'
    }
  },
  text: {
    type: 'text',
    content: {
      text: '<h2>Your Heading</h2><p>Your paragraph text goes here. You can add multiple paragraphs and format them as needed.</p>'
    },
    style: {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      padding: '40px 20px',
      fontSize: '16px',
      lineHeight: '1.6'
    }
  },
  image: {
    type: 'image',
    content: {
      src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop',
      alt: 'Image description',
      caption: ''
    },
    style: {
      backgroundColor: '#ffffff',
      padding: '20px',
      alignment: 'center',
      width: '100%'
    }
  },
  divider: {
    type: 'divider',
    content: {},
    style: {
      backgroundColor: '#ffffff',
      dividerColor: '#e5e7eb',
      dividerHeight: '1px',
      padding: '20px 0'
    }
  },
  spacer: {
    type: 'spacer',
    content: {},
    style: {
      height: '40px'
    }
  }
};

export const getBlockIcon = (type) => {
  const icons = {
    hero: '🎯',
    features: '⭐',
    testimonials: '💬',
    cta: '📢',
    form: '📝',
    pricing: '💰',
    faq: '❓',
    video: '🎥',
    text: '📄',
    image: '🖼️',
    divider: '➖',
    spacer: '⬜'
  };
  return icons[type] || '📦';
};

export const getBlockLabel = (type) => {
  const labels = {
    hero: 'Hero Section',
    features: 'Features',
    testimonials: 'Testimonials',
    cta: 'Call to Action',
    form: 'Contact Form',
    pricing: 'Pricing Table',
    faq: 'FAQ',
    video: 'Video',
    text: 'Text Block',
    image: 'Image',
    divider: 'Divider',
    spacer: 'Spacer'
  };
  return labels[type] || 'Block';
};
