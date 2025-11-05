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
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Features (one per line)</label>
              <textarea
                value={(content.features || []).map(f => `${f.title}: ${f.description || ''}`).join('\n')}
                onChange={(e) => {
                  const features = e.target.value.split('\n').filter(line => line.trim()).map(line => {
                    const [title, ...descParts] = line.split(':');
                    return {
                      title: title.trim(),
                      description: descParts.join(':').trim()
                    };
                  });
                  setContent({ ...content, features });
                }}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Feature 1: Description&#10;Feature 2: Description&#10;Feature 3: Description"
              />
              <p className="text-xs text-gray-500 mt-1">Format: Title: Description</p>
            </div>
            <EditorActions onSave={handleSave} onCancel={onCancel} />
          </div>
        );

      default:
        return (
          <div className="p-6 bg-white border-2 border-blue-500 rounded-lg">
            <p className="text-gray-600 mb-4">Edit {block.type} block</p>
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
