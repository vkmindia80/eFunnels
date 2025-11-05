import React, { useState } from 'react';
import {
  X, Search, Layout, Type, Image as ImageIcon, Square, Grid3x3,
  MessageSquare, Mail, Phone, Star, ShoppingCart, PlayCircle,
  FileText, BarChart3, Users, Calendar, MapPin, Sparkles
} from 'lucide-react';

const BlockLibrary = ({ onAddBlock, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Blocks', icon: Grid3x3 },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'interactive', label: 'Interactive', icon: PlayCircle },
    { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  ];

  const blockDefinitions = [
    {
      type: 'hero',
      name: 'Hero Section',
      category: 'layout',
      icon: Layout,
      description: 'Large header section with headline and CTA',
      thumbnail: (
        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 h-full flex items-center justify-center text-white p-3">
          <div className="text-center">
            <div className="h-3 bg-white/80 rounded mb-2"></div>
            <div className="h-2 bg-white/60 rounded mb-2"></div>
            <div className="h-2 w-12 bg-white rounded mx-auto"></div>
          </div>
        </div>
      )
    },
    {
      type: 'text',
      name: 'Text Block',
      category: 'content',
      icon: Type,
      description: 'Simple text paragraph or content',
      thumbnail: (
        <div className="bg-white h-full flex items-center p-3 border border-gray-200">
          <div className="w-full space-y-2">
            <div className="h-2 bg-gray-300 rounded w-full"></div>
            <div className="h-2 bg-gray-300 rounded w-5/6"></div>
            <div className="h-2 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      )
    },
    {
      type: 'rich_text',
      name: 'Rich Text',
      category: 'content',
      icon: FileText,
      description: 'Formatted text with headings and styles',
      thumbnail: (
        <div className="bg-white h-full flex items-center p-3 border border-gray-200">
          <div className="w-full space-y-2">
            <div className="h-3 bg-gray-800 rounded w-3/4"></div>
            <div className="h-2 bg-gray-300 rounded w-full"></div>
            <div className="h-2 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      )
    },
    {
      type: 'heading',
      name: 'Heading',
      category: 'content',
      icon: Type,
      description: 'Large heading or title',
      thumbnail: (
        <div className="bg-white h-full flex items-center justify-center p-3 border border-gray-200">
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        </div>
      )
    },
    {
      type: 'image',
      name: 'Image',
      category: 'media',
      icon: ImageIcon,
      description: 'Single image with caption',
      thumbnail: (
        <div className="bg-gradient-to-br from-purple-200 to-pink-200 h-full flex items-center justify-center">
          <ImageIcon className="text-purple-600" size={32} />
        </div>
      )
    },
    {
      type: 'image_gallery',
      name: 'Image Gallery',
      category: 'media',
      icon: Grid3x3,
      description: 'Grid of images',
      thumbnail: (
        <div className="bg-white h-full p-2 border border-gray-200">
          <div className="grid grid-cols-2 gap-1 h-full">
            <div className="bg-gradient-to-br from-purple-200 to-pink-200"></div>
            <div className="bg-gradient-to-br from-blue-200 to-indigo-200"></div>
            <div className="bg-gradient-to-br from-green-200 to-emerald-200"></div>
            <div className="bg-gradient-to-br from-yellow-200 to-orange-200"></div>
          </div>
        </div>
      )
    },
    {
      type: 'video',
      name: 'Video',
      category: 'media',
      icon: PlayCircle,
      description: 'Embedded video player',
      thumbnail: (
        <div className="bg-black h-full flex items-center justify-center">
          <PlayCircle className="text-white" size={32} />
        </div>
      )
    },
    {
      type: 'button',
      name: 'Button',
      category: 'interactive',
      icon: Square,
      description: 'Call-to-action button',
      thumbnail: (
        <div className="bg-white h-full flex items-center justify-center border border-gray-200">
          <div className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold">Button</div>
        </div>
      )
    },
    {
      type: 'features',
      name: 'Features Grid',
      category: 'layout',
      icon: Grid3x3,
      description: 'Grid of features or services',
      thumbnail: (
        <div className="bg-white h-full p-2 border border-gray-200">
          <div className="grid grid-cols-3 gap-1 h-full">
            {[1,2,3].map(i => (
              <div key={i} className="border border-gray-300 rounded p-1">
                <div className="h-2 bg-blue-400 rounded mb-1"></div>
                <div className="h-1 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      type: 'testimonials',
      name: 'Testimonials',
      category: 'content',
      icon: MessageSquare,
      description: 'Customer testimonials slider',
      thumbnail: (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 h-full p-3 border border-green-200">
          <div className="bg-white rounded p-2 h-full shadow-sm">
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={8} className="text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <div className="space-y-1">
              <div className="h-1 bg-gray-200 rounded w-full"></div>
              <div className="h-1 bg-gray-200 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      type: 'pricing',
      name: 'Pricing Table',
      category: 'ecommerce',
      icon: BarChart3,
      description: 'Pricing plans comparison',
      thumbnail: (
        <div className="bg-white h-full p-2 border border-gray-200">
          <div className="grid grid-cols-3 gap-1 h-full">
            {[1,2,3].map(i => (
              <div key={i} className="border border-gray-300 rounded p-1">
                <div className="h-2 bg-indigo-400 rounded mb-1"></div>
                <div className="h-3 bg-gray-800 rounded mb-1"></div>
                <div className="h-1 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      type: 'contact_form',
      name: 'Contact Form',
      category: 'interactive',
      icon: Mail,
      description: 'Contact form with fields',
      thumbnail: (
        <div className="bg-white h-full p-3 border border-gray-200">
          <div className="space-y-2">
            <div className="h-2 bg-gray-300 rounded"></div>
            <div className="h-2 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-2 bg-blue-600 rounded w-1/3"></div>
          </div>
        </div>
      )
    },
    {
      type: 'team',
      name: 'Team Members',
      category: 'content',
      icon: Users,
      description: 'Team member profiles grid',
      thumbnail: (
        <div className="bg-white h-full p-2 border border-gray-200">
          <div className="grid grid-cols-3 gap-1 h-full">
            {[1,2,3].map(i => (
              <div key={i} className="text-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-1"></div>
                <div className="h-1 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      type: 'cta',
      name: 'Call-to-Action',
      category: 'layout',
      icon: Sparkles,
      description: 'Prominent CTA section',
      thumbnail: (
        <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full flex items-center justify-center text-white p-3">
          <div className="text-center">
            <div className="h-2 bg-white/80 rounded mb-2 w-24 mx-auto"></div>
            <div className="h-2 w-12 bg-white rounded mx-auto"></div>
          </div>
        </div>
      )
    },
    {
      type: 'faq',
      name: 'FAQ Accordion',
      category: 'content',
      icon: MessageSquare,
      description: 'Frequently asked questions',
      thumbnail: (
        <div className="bg-white h-full p-2 border border-gray-200 space-y-1">
          {[1,2,3].map(i => (
            <div key={i} className="border border-gray-300 rounded p-1">
              <div className="h-1 bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )
    },
    {
      type: 'map',
      name: 'Map',
      category: 'media',
      icon: MapPin,
      description: 'Embedded map location',
      thumbnail: (
        <div className="bg-gradient-to-br from-green-300 to-blue-300 h-full flex items-center justify-center">
          <MapPin className="text-red-600" size={32} />
        </div>
      )
    },
    {
      type: 'divider',
      name: 'Divider',
      category: 'layout',
      icon: Type,
      description: 'Section divider line',
      thumbnail: (
        <div className="bg-white h-full flex items-center justify-center border border-gray-200">
          <div className="h-px bg-gray-400 w-3/4"></div>
        </div>
      )
    },
    {
      type: 'spacer',
      name: 'Spacer',
      category: 'layout',
      icon: Square,
      description: 'Empty space between sections',
      thumbnail: (
        <div className="bg-white h-full border border-dashed border-gray-300"></div>
      )
    },
  ];

  const filteredBlocks = blockDefinitions.filter(block => {
    const matchesCategory = activeCategory === 'all' || block.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-lg">Block Library</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredBlocks.map(block => (
            <button
              key={block.type}
              onClick={() => onAddBlock(block.type)}
              className="group flex flex-col bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="h-24 relative overflow-hidden bg-gray-50">
                {block.thumbnail}
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </div>
              
              {/* Info */}
              <div className="p-2 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <block.icon size={14} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <p className="font-semibold text-xs text-gray-900 group-hover:text-blue-600 transition-colors">
                    {block.name}
                  </p>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{block.description}</p>
              </div>
            </button>
          ))}
        </div>

        {filteredBlocks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No blocks found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockLibrary;
