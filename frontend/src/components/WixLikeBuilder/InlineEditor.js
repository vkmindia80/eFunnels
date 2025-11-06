import React, { useState, useRef, useEffect } from 'react';
import { Save, X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Link, Image as ImageIcon } from 'lucide-react';

const InlineEditor = ({ block, onSave, onCancel }) => {
  const [content, setContent] = useState(block.content || {});
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  const handleSave = () => {
    onSave(content);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  const renderEditor = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your headline"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline</label>
              <textarea
                value={content.subheadline || ''}
                onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your subheadline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
              <input
                type="text"
                value={content.cta_text || ''}
                onChange={(e) => setContent({ ...content, cta_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Button text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Link</label>
              <input
                type="text"
                value={content.cta_url || ''}
                onChange={(e) => setContent({ ...content, cta_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'text':
      case 'rich_text':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                ref={textareaRef}
                value={content.text || ''}
                onChange={(e) => {
                  setContent({ ...content, text: e.target.value });
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Start typing your content..."
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-2">Ctrl+Enter to save, Esc to cancel</p>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'heading':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Heading Text</label>
              <input
                type="text"
                value={content.text || ''}
                onChange={(e) => setContent({ ...content, text: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your heading"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Heading Level</label>
              <select
                value={content.level || 'h2'}
                onChange={(e) => setContent({ ...content, level: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="h1">H1 - Largest</option>
                <option value="h2">H2 - Large</option>
                <option value="h3">H3 - Medium</option>
                <option value="h4">H4 - Small</option>
              </select>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'image':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="text"
                value={content.image_url || ''}
                onChange={(e) => setContent({ ...content, image_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
              <input
                type="text"
                value={content.alt_text || ''}
                onChange={(e) => setContent({ ...content, alt_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description of the image"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption (Optional)</label>
              <input
                type="text"
                value={content.caption || ''}
                onChange={(e) => setContent({ ...content, caption: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Image caption"
              />
            </div>
            {content.image_url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <img 
                  src={content.image_url} 
                  alt={content.alt_text || ''} 
                  className="max-h-48 rounded-lg border border-gray-200"
                  onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E'}
                />
              </div>
            )}
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'button':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
              <input
                type="text"
                value={content.text || ''}
                onChange={(e) => setContent({ ...content, text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Click here"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
              <input
                type="text"
                value={content.link_url || ''}
                onChange={(e) => setContent({ ...content, link_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Open in</label>
              <select
                value={content.target || '_self'}
                onChange={(e) => setContent({ ...content, target: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="_self">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'features':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Headline</label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Our Features"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
              {(content.features || []).map((feature, index) => (
                <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={feature.title || ''}
                    onChange={(e) => {
                      const newFeatures = [...(content.features || [])];
                      newFeatures[index] = { ...feature, title: e.target.value };
                      setContent({ ...content, features: newFeatures });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 font-semibold"
                    placeholder="Feature Title"
                  />
                  <textarea
                    value={feature.description || ''}
                    onChange={(e) => {
                      const newFeatures = [...(content.features || [])];
                      newFeatures[index] = { ...feature, description: e.target.value };
                      setContent({ ...content, features: newFeatures });
                    }}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Feature Description"
                  />
                  <input
                    type="text"
                    value={feature.icon || ''}
                    onChange={(e) => {
                      const newFeatures = [...(content.features || [])];
                      newFeatures[index] = { ...feature, icon: e.target.value };
                      setContent({ ...content, features: newFeatures });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mt-2"
                    placeholder="Icon (emoji or text)"
                  />
                  <button
                    onClick={() => {
                      const newFeatures = (content.features || []).filter((_, i) => i !== index);
                      setContent({ ...content, features: newFeatures });
                    }}
                    className="mt-2 text-red-600 text-sm hover:underline"
                  >
                    Remove Feature
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newFeatures = [...(content.features || []), { title: '', description: '', icon: '' }];
                  setContent({ ...content, features: newFeatures });
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
              >
                + Add Feature
              </button>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'pricing':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Headline</label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Pricing Plans"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Plans</label>
              {(content.plans || []).map((plan, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <input
                    type="text"
                    value={plan.name || ''}
                    onChange={(e) => {
                      const newPlans = [...(content.plans || [])];
                      newPlans[index] = { ...plan, name: e.target.value };
                      setContent({ ...content, plans: newPlans });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 font-bold"
                    placeholder="Plan Name"
                  />
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={plan.price || ''}
                      onChange={(e) => {
                        const newPlans = [...(content.plans || [])];
                        newPlans[index] = { ...plan, price: e.target.value };
                        setContent({ ...content, plans: newPlans });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      placeholder="$99"
                    />
                    <input
                      type="text"
                      value={plan.period || ''}
                      onChange={(e) => {
                        const newPlans = [...(content.plans || [])];
                        newPlans[index] = { ...plan, period: e.target.value };
                        setContent({ ...content, plans: newPlans });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      placeholder="/month"
                    />
                  </div>
                  <textarea
                    value={(plan.features || []).join('\n')}
                    onChange={(e) => {
                      const newPlans = [...(content.plans || [])];
                      newPlans[index] = { ...plan, features: e.target.value.split('\n').filter(f => f.trim()) };
                      setContent({ ...content, plans: newPlans });
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  />
                  <input
                    type="text"
                    value={plan.cta_text || ''}
                    onChange={(e) => {
                      const newPlans = [...(content.plans || [])];
                      newPlans[index] = { ...plan, cta_text: e.target.value };
                      setContent({ ...content, plans: newPlans });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    placeholder="Get Started"
                  />
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={plan.highlighted || false}
                      onChange={(e) => {
                        const newPlans = [...(content.plans || [])];
                        newPlans[index] = { ...plan, highlighted: e.target.checked };
                        setContent({ ...content, plans: newPlans });
                      }}
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700">Highlight this plan</label>
                  </div>
                  <button
                    onClick={() => {
                      const newPlans = (content.plans || []).filter((_, i) => i !== index);
                      setContent({ ...content, plans: newPlans });
                    }}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove Plan
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newPlans = [...(content.plans || []), { name: '', price: '', period: '', features: [], cta_text: 'Get Started', highlighted: false }];
                  setContent({ ...content, plans: newPlans });
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
              >
                + Add Plan
              </button>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'testimonials':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Headline</label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What Our Customers Say"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Testimonials</label>
              {(content.testimonials || []).map((testimonial, index) => (
                <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <textarea
                    value={testimonial.text || ''}
                    onChange={(e) => {
                      const newTestimonials = [...(content.testimonials || [])];
                      newTestimonials[index] = { ...testimonial, text: e.target.value };
                      setContent({ ...content, testimonials: newTestimonials });
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    placeholder="Customer testimonial..."
                  />
                  <input
                    type="text"
                    value={testimonial.author || testimonial.name || ''}
                    onChange={(e) => {
                      const newTestimonials = [...(content.testimonials || [])];
                      newTestimonials[index] = { ...testimonial, author: e.target.value, name: e.target.value };
                      setContent({ ...content, testimonials: newTestimonials });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    placeholder="Customer Name"
                  />
                  <input
                    type="text"
                    value={testimonial.role || ''}
                    onChange={(e) => {
                      const newTestimonials = [...(content.testimonials || [])];
                      newTestimonials[index] = { ...testimonial, role: e.target.value };
                      setContent({ ...content, testimonials: newTestimonials });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    placeholder="Role/Company"
                  />
                  <button
                    onClick={() => {
                      const newTestimonials = (content.testimonials || []).filter((_, i) => i !== index);
                      setContent({ ...content, testimonials: newTestimonials });
                    }}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove Testimonial
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newTestimonials = [...(content.testimonials || []), { text: '', author: '', name: '', role: '' }];
                  setContent({ ...content, testimonials: newTestimonials });
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
              >
                + Add Testimonial
              </button>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'cta':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ready to Get Started?"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline</label>
              <textarea
                value={content.subheadline || ''}
                onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Join thousands of satisfied customers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
              <input
                type="text"
                value={content.cta_text || ''}
                onChange={(e) => setContent({ ...content, cta_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Get Started"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Link</label>
              <input
                type="text"
                value={content.cta_url || ''}
                onChange={(e) => setContent({ ...content, cta_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'contact_form':
      case 'contact':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Headline</label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Get In Touch"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline</label>
              <textarea
                value={content.subheadline || ''}
                onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="We'll get back to you soon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Submit Button Text</label>
              <input
                type="text"
                value={content.submit_text || ''}
                onChange={(e) => setContent({ ...content, submit_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Send Message"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Info (Optional)</label>
              <textarea
                value={content.contact_info || ''}
                onChange={(e) => setContent({ ...content, contact_info: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email: contact@example.com"
              />
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'video':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
              <input
                type="text"
                value={content.video_url || ''}
                onChange={(e) => setContent({ ...content, video_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://youtube.com/watch?v=... or video file URL"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">Supports YouTube, Vimeo, or direct video file URLs</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video Title</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Video Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail URL (Optional)</label>
              <input
                type="text"
                value={content.thumbnail_url || ''}
                onChange={(e) => setContent({ ...content, thumbnail_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'team':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Headline</label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Meet Our Team"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
              {(content.members || []).map((member, index) => (
                <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={member.name || ''}
                    onChange={(e) => {
                      const newMembers = [...(content.members || [])];
                      newMembers[index] = { ...member, name: e.target.value };
                      setContent({ ...content, members: newMembers });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 font-semibold"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={member.role || ''}
                    onChange={(e) => {
                      const newMembers = [...(content.members || [])];
                      newMembers[index] = { ...member, role: e.target.value };
                      setContent({ ...content, members: newMembers });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    placeholder="Role/Position"
                  />
                  <textarea
                    value={member.bio || ''}
                    onChange={(e) => {
                      const newMembers = [...(content.members || [])];
                      newMembers[index] = { ...member, bio: e.target.value };
                      setContent({ ...content, members: newMembers });
                    }}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    placeholder="Bio"
                  />
                  <input
                    type="text"
                    value={member.image || ''}
                    onChange={(e) => {
                      const newMembers = [...(content.members || [])];
                      newMembers[index] = { ...member, image: e.target.value };
                      setContent({ ...content, members: newMembers });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    placeholder="Image URL"
                  />
                  <button
                    onClick={() => {
                      const newMembers = (content.members || []).filter((_, i) => i !== index);
                      setContent({ ...content, members: newMembers });
                    }}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove Member
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newMembers = [...(content.members || []), { name: '', role: '', bio: '', image: '' }];
                  setContent({ ...content, members: newMembers });
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
              >
                + Add Team Member
              </button>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'faq':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Headline</label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Frequently Asked Questions"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Questions & Answers</label>
              {(content.questions || []).map((item, index) => (
                <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={item.question || ''}
                    onChange={(e) => {
                      const newQuestions = [...(content.questions || [])];
                      newQuestions[index] = { ...item, question: e.target.value };
                      setContent({ ...content, questions: newQuestions });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 font-semibold"
                    placeholder="Question"
                  />
                  <textarea
                    value={item.answer || ''}
                    onChange={(e) => {
                      const newQuestions = [...(content.questions || [])];
                      newQuestions[index] = { ...item, answer: e.target.value };
                      setContent({ ...content, questions: newQuestions });
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Answer"
                  />
                  <button
                    onClick={() => {
                      const newQuestions = (content.questions || []).filter((_, i) => i !== index);
                      setContent({ ...content, questions: newQuestions });
                    }}
                    className="mt-2 text-red-600 text-sm hover:underline"
                  >
                    Remove Question
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newQuestions = [...(content.questions || []), { question: '', answer: '' }];
                  setContent({ ...content, questions: newQuestions });
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
              >
                + Add Question
              </button>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'image_gallery':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
              {(content.images || []).map((image, index) => (
                <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={image.url || ''}
                    onChange={(e) => {
                      const newImages = [...(content.images || [])];
                      newImages[index] = { ...image, url: e.target.value };
                      setContent({ ...content, images: newImages });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    placeholder="Image URL"
                  />
                  <input
                    type="text"
                    value={image.alt || ''}
                    onChange={(e) => {
                      const newImages = [...(content.images || [])];
                      newImages[index] = { ...image, alt: e.target.value };
                      setContent({ ...content, images: newImages });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Alt text"
                  />
                  {image.url && (
                    <img src={image.url} alt={image.alt || ''} className="mt-2 h-20 object-cover rounded" />
                  )}
                  <button
                    onClick={() => {
                      const newImages = (content.images || []).filter((_, i) => i !== index);
                      setContent({ ...content, images: newImages });
                    }}
                    className="mt-2 text-red-600 text-sm hover:underline"
                  >
                    Remove Image
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newImages = [...(content.images || []), { url: '', alt: '' }];
                  setContent({ ...content, images: newImages });
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
              >
                + Add Image
              </button>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'map':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={content.address || ''}
                onChange={(e) => setContent({ ...content, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main St, City, Country"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={content.lat || ''}
                  onChange={(e) => setContent({ ...content, lat: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="40.7128"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={content.lng || ''}
                  onChange={(e) => setContent({ ...content, lng: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-74.0060"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoom Level (1-20)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={content.zoom || 15}
                onChange={(e) => setContent({ ...content, zoom: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'divider':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
            <p className="text-gray-600">This is a divider block. Use the style panel to customize its appearance.</p>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      case 'spacer':
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
            <p className="text-gray-600">This is a spacer block. Use the style panel to adjust the height.</p>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      default:
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg">
            <p className="text-gray-600 mb-4">Edit {block.type} block content</p>
            <p className="text-sm text-gray-500 mb-4">This block type doesn't have a custom editor yet. You can edit the raw content below or use the style panel for visual customization.</p>
            <textarea
              value={JSON.stringify(content, null, 2)}
              onChange={(e) => {
                try {
                  setContent(JSON.parse(e.target.value));
                } catch (e) {
                  // Invalid JSON, ignore
                }
              }}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );
    }
  };

  return renderEditor();
};

const EditorActions = ({ onSave, onCancel }) => (
  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
    <button
      onClick={onSave}
      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
    >
      <Save size={18} />
      Save Changes
    </button>
    <button
      onClick={onCancel}
      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
    >
      <X size={18} />
      Cancel
    </button>
  </div>
);

export default InlineEditor;
