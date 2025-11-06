import React from 'react';
import { X, Palette, Type, AlignLeft, AlignCenter, AlignRight, Link } from 'lucide-react';

const StylePanel = ({ block, onUpdateBlock, onClose }) => {
  if (!block) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Palette size={48} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Select a block to edit its styles</p>
        </div>
      </div>
    );
  }

  const updateStyle = (key, value) => {
    onUpdateBlock(block.id, {
      ...block,
      styles: { ...block.styles, [key]: value },
    });
  };

  const updateContent = (content) => {
    onUpdateBlock(block.id, { ...block, content });
  };

  const updateProperty = (key, value) => {
    onUpdateBlock(block.id, { ...block, [key]: value });
  };

  return (
    <div className="w-80 bg-gradient-to-b from-white to-gray-50 border-l-2 border-gray-200 overflow-y-auto shadow-lg" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-200 flex items-center justify-between sticky top-0 bg-gradient-to-r from-blue-50 to-purple-50 z-10">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Palette size={20} className="text-blue-500" />
          Edit Block
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-white/70 rounded-lg transition">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Content Editing */}
        {(block.type === 'heading' || block.type === 'paragraph' || block.type === 'button') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={block.content}
              onChange={(e) => updateContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={block.type === 'heading' ? 2 : 4}
            />
          </div>
        )}

        {/* Button Link */}
        {block.type === 'button' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link size={16} className="inline mr-1" />
              Button Link
            </label>
            <input
              type="url"
              value={block.link}
              onChange={(e) => updateProperty('link', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Image Properties */}
        {block.type === 'image' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="url"
                value={block.src}
                onChange={(e) => updateProperty('src', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
              <input
                type="text"
                value={block.alt}
                onChange={(e) => updateProperty('alt', e.target.value)}
                placeholder="Image description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link (optional)</label>
              <input
                type="url"
                value={block.link || ''}
                onChange={(e) => updateProperty('link', e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>        )}

        {/* List Items */}
        {block.type === 'list' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">List Type</label>
              <select
                value={block.listType}
                onChange={(e) => updateProperty('listType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bullet">Bullet List</option>
                <option value="numbered">Numbered List</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">List Items</label>
              {block.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...block.items];
                      newItems[idx] = e.target.value;
                      updateProperty('items', newItems);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {block.items.length > 1 && (
                    <button
                      onClick={() => {
                        const newItems = block.items.filter((_, i) => i !== idx);
                        updateProperty('items', newItems);
                      }}
                      className="px-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => updateProperty('items', [...block.items, 'New item'])}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Item
              </button>
            </div>
          </>
        )}

        {/* Typography Styles */}
        {(block.type === 'heading' || block.type === 'paragraph' || block.type === 'button' || block.type === 'list') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Type size={16} className="inline mr-1" />
                Font Size
              </label>
              <input
                type="text"
                value={block.styles.fontSize || '16px'}
                onChange={(e) => updateStyle('fontSize', e.target.value)}
                placeholder="16px"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette size={16} className="inline mr-1" />
                Text Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={block.styles.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={block.styles.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Align</label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => updateStyle('textAlign', align)}
                    className={`flex-1 p-2 border rounded ${
                      block.styles.textAlign === align
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {align === 'left' && <AlignLeft size={18} className="mx-auto" />}
                    {align === 'center' && <AlignCenter size={18} className="mx-auto" />}
                    {align === 'right' && <AlignRight size={18} className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {block.type === 'heading' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
                <select
                  value={block.styles.fontWeight || 'bold'}
                  onChange={(e) => updateStyle('fontWeight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="600">Semi-bold</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Button Specific Styles */}
        {block.type === 'button' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={block.styles.backgroundColor || '#3B82F6'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={block.styles.backgroundColor || '#3B82F6'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
              <input
                type="text"
                value={block.styles.borderRadius || '6px'}
                onChange={(e) => updateStyle('borderRadius', e.target.value)}
                placeholder="6px"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
              <input
                type="text"
                value={block.styles.padding || '12px 24px'}
                onChange={(e) => updateStyle('padding', e.target.value)}
                placeholder="12px 24px"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        {/* Spacing */}
        {block.type !== 'spacer' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Margin Top</label>
                <input
                  type="text"
                  value={block.styles.marginTop || '0px'}
                  onChange={(e) => updateStyle('marginTop', e.target.value)}
                  placeholder="20px"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Margin Bottom</label>
                <input
                  type="text"
                  value={block.styles.marginBottom || '0px'}
                  onChange={(e) => updateStyle('marginBottom', e.target.value)}
                  placeholder="20px"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </>
        )}

        {/* Spacer Height */}
        {block.type === 'spacer' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
            <input
              type="text"
              value={block.styles.height || '40px'}
              onChange={(e) => updateStyle('height', e.target.value)}
              placeholder="40px"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Divider Styles */}
        {block.type === 'divider' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={block.styles.borderColor || '#E5E7EB'}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={block.styles.borderColor || '#E5E7EB'}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Width</label>
              <input
                type="text"
                value={block.styles.borderWidth || '1px'}
                onChange={(e) => updateStyle('borderWidth', e.target.value)}
                placeholder="1px"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        {/* Image Width */}
        {block.type === 'image' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
              <input
                type="text"
                value={block.styles.width || '100%'}
                onChange={(e) => updateStyle('width', e.target.value)}
                placeholder="100%"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
              <input
                type="text"
                value={block.styles.borderRadius || '0px'}
                onChange={(e) => updateStyle('borderRadius', e.target.value)}
                placeholder="0px"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StylePanel;
