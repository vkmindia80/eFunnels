// Block Definitions for Wix-like Builder

export const createDefaultBlock = (type) => {
  const baseBlock = {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    content: {},
    style: {}
  };

  const blocks = {
    hero: {
      ...baseBlock,
      content: {
        headline: 'Welcome to Your Website',
        subheadline: 'Create something amazing with our powerful tools',
        cta_text: 'Get Started',
        cta_url: '#'
      },
      style: {
        backgroundColor: '#F3F4F6',
        textColor: '#1F2937',
        padding: '80px 40px',
        alignment: 'center',
        headingSize: '48px',
        subheadingSize: '20px',
        buttonColor: '#3B82F6'
      }
    },

    text: {
      ...baseBlock,
      content: {
        text: 'This is a text block. Click edit to change this content.'
      },
      style: {
        padding: '40px 20px',
        fontSize: '16px',
        lineHeight: '1.6'
      }
    },

    rich_text: {
      ...baseBlock,
      content: {
        text: '<h2>Rich Text Block</h2><p>You can use <strong>bold</strong>, <em>italic</em>, and other formatting here.</p>'
      },
      style: {
        padding: '40px 20px',
        fontSize: '16px',
        lineHeight: '1.6'
      }
    },

    heading: {
      ...baseBlock,
      content: {
        text: 'Your Heading Here',
        level: 'h2'
      },
      style: {
        padding: '40px 20px',
        fontSize: '32px',
        fontWeight: 'bold',
        alignment: 'center'
      }
    },

    image: {
      ...baseBlock,
      content: {
        image_url: '',
        alt_text: '',
        caption: ''
      },
      style: {
        padding: '20px',
        alignment: 'center',
        imageHeight: '400px'
      }
    },

    image_gallery: {
      ...baseBlock,
      content: {
        images: [
          { url: '', alt: '' },
          { url: '', alt: '' },
          { url: '', alt: '' },
          { url: '', alt: '' }
        ]
      },
      style: {
        padding: '40px 20px',
        columns: 3,
        gap: '16px'
      }
    },

    video: {
      ...baseBlock,
      content: {
        video_url: '',
        thumbnail_url: '',
        title: 'Video Title'
      },
      style: {
        padding: '40px 20px',
        alignment: 'center'
      }
    },

    button: {
      ...baseBlock,
      content: {
        text: 'Click Here',
        link_url: '#',
        target: '_self'
      },
      style: {
        padding: '20px',
        alignment: 'center',
        buttonColor: '#3B82F6',
        buttonTextColor: '#FFFFFF',
        fontSize: '16px'
      }
    },

    features: {
      ...baseBlock,
      content: {
        headline: 'Our Features',
        features: [
          { title: 'Feature One', description: 'Description of feature one', icon: '🚀' },
          { title: 'Feature Two', description: 'Description of feature two', icon: '⚡' },
          { title: 'Feature Three', description: 'Description of feature three', icon: '🎯' }
        ]
      },
      style: {
        padding: '60px 40px',
        backgroundColor: '#FFFFFF',
        alignment: 'center',
        columns: 3
      }
    },

    testimonials: {
      ...baseBlock,
      content: {
        headline: 'What Our Customers Say',
        testimonials: [
          {
            name: 'John Doe',
            role: 'CEO, Company',
            text: 'This product is amazing! It has transformed our business.',
            avatar: '',
            rating: 5
          },
          {
            name: 'Jane Smith',
            role: 'Marketing Director',
            text: 'Highly recommended! Great value and excellent support.',
            avatar: '',
            rating: 5
          }
        ]
      },
      style: {
        padding: '60px 40px',
        backgroundColor: '#F9FAFB',
        alignment: 'center'
      }
    },

    pricing: {
      ...baseBlock,
      content: {
        headline: 'Choose Your Plan',
        plans: [
          {
            name: 'Basic',
            price: '$9',
            period: '/month',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            cta_text: 'Get Started',
            cta_url: '#',
            highlighted: false
          },
          {
            name: 'Pro',
            price: '$29',
            period: '/month',
            features: ['Everything in Basic', 'Feature 4', 'Feature 5', 'Feature 6'],
            cta_text: 'Get Started',
            cta_url: '#',
            highlighted: true
          },
          {
            name: 'Enterprise',
            price: '$99',
            period: '/month',
            features: ['Everything in Pro', 'Feature 7', 'Feature 8', 'Priority Support'],
            cta_text: 'Contact Sales',
            cta_url: '#',
            highlighted: false
          }
        ]
      },
      style: {
        padding: '60px 40px',
        backgroundColor: '#FFFFFF',
        alignment: 'center'
      }
    },

    contact_form: {
      ...baseBlock,
      content: {
        headline: 'Get In Touch',
        subheadline: 'Fill out the form below and we\'ll get back to you soon',
        fields: [
          { type: 'text', label: 'Name', placeholder: 'Your name', required: true },
          { type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
          { type: 'textarea', label: 'Message', placeholder: 'Your message', required: true }
        ],
        submit_text: 'Send Message'
      },
      style: {
        padding: '60px 40px',
        backgroundColor: '#F9FAFB',
        alignment: 'center'
      }
    },

    team: {
      ...baseBlock,
      content: {
        headline: 'Meet Our Team',
        members: [
          {
            name: 'John Doe',
            role: 'CEO & Founder',
            bio: 'Brief bio about team member',
            image: '',
            social: { linkedin: '', twitter: '' }
          },
          {
            name: 'Jane Smith',
            role: 'CTO',
            bio: 'Brief bio about team member',
            image: '',
            social: { linkedin: '', twitter: '' }
          },
          {
            name: 'Mike Johnson',
            role: 'Head of Design',
            bio: 'Brief bio about team member',
            image: '',
            social: { linkedin: '', twitter: '' }
          }
        ]
      },
      style: {
        padding: '60px 40px',
        backgroundColor: '#FFFFFF',
        alignment: 'center',
        columns: 3
      }
    },

    cta: {
      ...baseBlock,
      content: {
        headline: 'Ready to Get Started?',
        subheadline: 'Join thousands of satisfied customers today',
        cta_text: 'Start Free Trial',
        cta_url: '#'
      },
      style: {
        backgroundColor: '#3B82F6',
        textColor: '#FFFFFF',
        padding: '80px 40px',
        alignment: 'center',
        headingSize: '36px',
        subheadingSize: '18px',
        buttonColor: '#FFFFFF',
        buttonTextColor: '#3B82F6'
      }
    },

    faq: {
      ...baseBlock,
      content: {
        headline: 'Frequently Asked Questions',
        questions: [
          {
            question: 'What is this product?',
            answer: 'Detailed answer to the question goes here.'
          },
          {
            question: 'How does pricing work?',
            answer: 'Explanation of pricing structure goes here.'
          },
          {
            question: 'Do you offer support?',
            answer: 'Information about support options goes here.'
          }
        ]
      },
      style: {
        padding: '60px 40px',
        backgroundColor: '#FFFFFF'
      }
    },

    map: {
      ...baseBlock,
      content: {
        address: '123 Main St, City, Country',
        lat: 40.7128,
        lng: -74.0060,
        zoom: 15
      },
      style: {
        padding: '0',
        height: '400px'
      }
    },

    divider: {
      ...baseBlock,
      content: {},
      style: {
        padding: '20px 40px',
        borderColor: '#E5E7EB',
        borderWidth: '1px',
        borderStyle: 'solid'
      }
    },

    spacer: {
      ...baseBlock,
      content: {},
      style: {
        height: '60px'
      }
    }
  };

  return blocks[type] || null;
};

export default createDefaultBlock;
