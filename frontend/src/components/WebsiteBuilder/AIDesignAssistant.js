import React, { useState } from 'react';
import { Sparkles, Wand2, Palette, Type, Layout, Eye, X, Loader } from 'lucide-react';
import api from '../../api';

const AIDesignAssistant = ({ onClose, onApply }) => {
  const [activeFeature, setActiveFeature] = useState('website');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Form states
  const [websiteForm, setWebsiteForm] = useState({
    business_type: '',
    industry: '',
    description: '',
    target_audience: ''
  });

  const [sectionForm, setSectionForm] = useState({
    section_type: 'hero',
    business_name: '',
    industry: '',
    description: ''
  });

  const [colorForm, setColorForm] = useState({
    brand_type: 'professional',
    mood: 'trustworthy',
    industry: ''
  });

  const [typographyForm, setTypographyForm] = useState({
    brand_style: 'modern',
    website_type: 'corporate'
  });

  const features = [
    { id: 'website', label: 'Generate Website', icon: Wand2, color: 'blue' },
    { id: 'section', label: 'Generate Section', icon: Layout, color: 'purple' },
    { id: 'colors', label: 'Color Scheme', icon: Palette, color: 'pink' },
    { id: 'typography', label: 'Typography', icon: Type, color: 'indigo' }
  ];

  const handleGenerateWebsite = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/website/ai/generate-complete-website', {
        business_info: websiteForm
      });
      setResult(response.data.website);
    } catch (error) {
      alert('Failed to generate website: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSection = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/website/ai/generate-section', {
        section_type: sectionForm.section_type,
        context: {
          business_name: sectionForm.business_name,
          industry: sectionForm.industry,
          description: sectionForm.description
        }
      });
      setResult(response.data.section);
    } catch (error) {
      alert('Failed to generate section: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateColors = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/website/ai/generate-color-scheme', {
        brand_info: colorForm
      });
      setResult(response.data.color_scheme);
    } catch (error) {
      alert('Failed to generate colors: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTypography = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/website/ai/generate-typography', {
        brand_style: typographyForm.brand_style,
        website_type: typographyForm.website_type
      });
      setResult(response.data.typography);
    } catch (error) {
      alert('Failed to generate typography: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="ai-assistant">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Design Assistant</h2>
              <p className="text-sm text-purple-100">Generate professional designs with AI</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        {/* Feature Selection */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-4 gap-3">
            {features.map(feature => (
              <button
                key={feature.id}
                onClick={() => {
                  setActiveFeature(feature.id);
                  setResult(null);
                }}
                className={`p-4 rounded-lg border-2 transition text-center ${
                  activeFeature === feature.id
                    ? `border-${feature.color}-600 bg-${feature.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <feature.icon className={`mx-auto mb-2 ${
                  activeFeature === feature.id ? `text-${feature.color}-600` : 'text-gray-600'
                }`} size={24} />
                <p className={`text-sm font-medium ${
                  activeFeature === feature.id ? `text-${feature.color}-600` : 'text-gray-700'
                }`}>
                  {feature.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Input Form */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Configuration</h3>
              
              {activeFeature === 'website' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
                    <input
                      type="text"
                      value={websiteForm.business_type}
                      onChange={(e) => setWebsiteForm({...websiteForm, business_type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., SaaS, E-commerce, Agency"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                    <input
                      type="text"
                      value={websiteForm.industry}
                      onChange={(e) => setWebsiteForm({...websiteForm, industry: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={websiteForm.description}
                      onChange={(e) => setWebsiteForm({...websiteForm, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your business, products, or services..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                    <input
                      type="text"
                      value={websiteForm.target_audience}
                      onChange={(e) => setWebsiteForm({...websiteForm, target_audience: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Small businesses, Enterprises"
                    />
                  </div>
                  <button
                    onClick={handleGenerateWebsite}
                    disabled={loading || !websiteForm.business_type || !websiteForm.industry}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={20} />
                        Generate Website
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeFeature === 'section' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section Type *</label>
                    <select
                      value={sectionForm.section_type}
                      onChange={(e) => setSectionForm({...sectionForm, section_type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="hero">Hero Section</option>
                      <option value="about">About Section</option>
                      <option value="services">Services Section</option>
                      <option value="testimonials">Testimonials</option>
                      <option value="contact">Contact Section</option>
                      <option value="cta">Call to Action</option>
                      <option value="features">Features Section</option>
                      <option value="pricing">Pricing Section</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={sectionForm.business_name}
                      onChange={(e) => setSectionForm({...sectionForm, business_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      value={sectionForm.industry}
                      onChange={(e) => setSectionForm({...sectionForm, industry: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Technology"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Context</label>
                    <textarea
                      value={sectionForm.description}
                      onChange={(e) => setSectionForm({...sectionForm, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Any specific information you want to include..."
                    />
                  </div>
                  <button
                    onClick={handleGenerateSection}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Layout size={20} />
                        Generate Section
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeFeature === 'colors' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Type</label>
                    <select
                      value={colorForm.brand_type}
                      onChange={(e) => setColorForm({...colorForm, brand_type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="professional">Professional</option>
                      <option value="creative">Creative</option>
                      <option value="playful">Playful</option>
                      <option value="elegant">Elegant</option>
                      <option value="bold">Bold</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Desired Mood</label>
                    <select
                      value={colorForm.mood}
                      onChange={(e) => setColorForm({...colorForm, mood: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="trustworthy">Trustworthy</option>
                      <option value="energetic">Energetic</option>
                      <option value="calm">Calm</option>
                      <option value="luxurious">Luxurious</option>
                      <option value="innovative">Innovative</option>
                      <option value="friendly">Friendly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      value={colorForm.industry}
                      onChange={(e) => setColorForm({...colorForm, industry: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>
                  <button
                    onClick={handleGenerateColors}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-600 to-red-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Palette size={20} />
                        Generate Colors
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeFeature === 'typography' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Style</label>
                    <select
                      value={typographyForm.brand_style}
                      onChange={(e) => setTypographyForm({...typographyForm, brand_style: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="elegant">Elegant</option>
                      <option value="playful">Playful</option>
                      <option value="bold">Bold</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website Type</label>
                    <select
                      value={typographyForm.website_type}
                      onChange={(e) => setTypographyForm({...typographyForm, website_type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="corporate">Corporate</option>
                      <option value="creative">Creative</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="blog">Blog</option>
                      <option value="portfolio">Portfolio</option>
                      <option value="landing">Landing Page</option>
                    </select>
                  </div>
                  <button
                    onClick={handleGenerateTypography}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Type size={20} />
                        Generate Typography
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Result Display */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye size={20} />
                Preview
              </h3>
              
              {!result && !loading && (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Sparkles className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-600">Fill in the form and click generate to see AI results</p>
                </div>
              )}

              {loading && (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Loader className="mx-auto text-blue-600 animate-spin mb-3" size={48} />
                  <p className="text-gray-600">AI is generating your design...</p>
                </div>
              )}

              {result && activeFeature === 'colors' && result.colors && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.colors).map(([name, color]) => (
                      <div key={name} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                          className="h-20"
                          style={{ backgroundColor: color }}
                        ></div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-900 capitalize">{name}</p>
                          <p className="text-xs text-gray-600 font-mono">{color}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{result.full_response}</p>
                  </div>
                  <button
                    onClick={() => onApply && onApply(result.colors)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Apply Color Scheme
                  </button>
                </div>
              )}

              {result && activeFeature !== 'colors' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">
                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                  </pre>
                  <button
                    onClick={() => onApply && onApply(result)}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Apply to Page
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDesignAssistant;
