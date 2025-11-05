import React, { useState } from 'react';
import { Palette, Layout, Zap, Smartphone, X } from 'lucide-react';

const StylePanel = ({ block, onStyleChange, onClose }) => {
  const [activeTab, setActiveTab] = useState('design');
  const [style, setStyle] = useState(block.style || {});

  const handleChange = (key, value) => {
    const newStyle = { ...style, [key]: value };
    setStyle(newStyle);
    onStyleChange(newStyle);
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto" data-testid="style-panel">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Style Settings</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'design', label: 'Design', icon: Palette },
            { id: 'layout', label: 'Layout', icon: Layout },
            { id: 'animation', label: 'Effects', icon: Zap },
            { id: 'responsive', label: 'Mobile', icon: Smartphone }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={16} className="mx-auto mb-1" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {activeTab === 'design' && (
          <>
            {/* Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Color</label>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="color"
                      value={style.backgroundColor || '#FFFFFF'}
                      onChange={(e) => handleChange('backgroundColor', e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={style.backgroundColor || '#FFFFFF'}
                      onChange={(e) => handleChange('backgroundColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-600">Background Image URL</label>
                  <input
                    type="text"
                    value={style.backgroundImage || ''}
                    onChange={(e) => handleChange('backgroundImage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">Gradient</label>
                  <select
                    value={style.backgroundGradient || 'none'}
                    onChange={(e) => handleChange('backgroundGradient', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                  >
                    <option value="none">None</option>
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={style.textColor || '#111827'}
                  onChange={(e) => handleChange('textColor', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={style.textColor || '#111827'}
                  onChange={(e) => handleChange('textColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="#111827"
                />
              </div>
            </div>

            {/* Typography */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Typography</label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Font Size</label>
                  <input
                    type="text"
                    value={style.fontSize || '16px'}
                    onChange={(e) => handleChange('fontSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="16px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Font Weight</label>
                  <select
                    value={style.fontWeight || 'normal'}
                    onChange={(e) => handleChange('fontWeight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                  >
                    <option value="300">Light</option>
                    <option value="normal">Normal</option>
                    <option value="600">Semi Bold</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Line Height</label>
                  <input
                    type="text"
                    value={style.lineHeight || '1.6'}
                    onChange={(e) => handleChange('lineHeight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="1.6"
                  />
                </div>
              </div>
            </div>

            {/* Borders & Shadows */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Borders & Shadows</label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Border Width</label>
                  <input
                    type="text"
                    value={style.borderWidth || '0px'}
                    onChange={(e) => handleChange('borderWidth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Border Color</label>
                  <input
                    type="color"
                    value={style.borderColor || '#E5E7EB'}
                    onChange={(e) => handleChange('borderColor', e.target.value)}
                    className="w-full h-10 rounded border border-gray-300 cursor-pointer mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Border Radius</label>
                  <input
                    type="text"
                    value={style.borderRadius || '0px'}
                    onChange={(e) => handleChange('borderRadius', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Box Shadow</label>
                  <select
                    value={style.boxShadow || 'none'}
                    onChange={(e) => handleChange('boxShadow', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                  >
                    <option value="none">None</option>
                    <option value="0 1px 3px rgba(0,0,0,0.1)">Small</option>
                    <option value="0 4px 6px rgba(0,0,0,0.1)">Medium</option>
                    <option value="0 10px 15px rgba(0,0,0,0.1)">Large</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'layout' && (
          <>
            {/* Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Padding</label>
                  <input
                    type="text"
                    value={style.padding || '40px 20px'}
                    onChange={(e) => handleChange('padding', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="40px 20px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Margin</label>
                  <input
                    type="text"
                    value={style.margin || '0'}
                    onChange={(e) => handleChange('margin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Width</label>
                  <input
                    type="text"
                    value={style.width || 'auto'}
                    onChange={(e) => handleChange('width', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="auto"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Max Width</label>
                  <input
                    type="text"
                    value={style.maxWidth || 'none'}
                    onChange={(e) => handleChange('maxWidth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="1200px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Height</label>
                  <input
                    type="text"
                    value={style.height || 'auto'}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                    placeholder="auto"
                  />
                </div>
              </div>
            </div>

            {/* Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Text Align</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        onClick={() => handleChange('alignment', align)}
                        className={`px-3 py-2 border rounded text-sm capitalize ${
                          style.alignment === align
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Display</label>
                  <select
                    value={style.display || 'block'}
                    onChange={(e) => handleChange('display', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
                  >
                    <option value="block">Block</option>
                    <option value="flex">Flex</option>
                    <option value="grid">Grid</option>
                    <option value="inline-block">Inline Block</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'animation' && (
          <>
            {/* Entrance Animation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entrance Animation</label>
              <select
                value={style.entranceAnimation || 'none'}
                onChange={(e) => handleChange('entranceAnimation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="none">None</option>
                <option value="fadeIn">Fade In</option>
                <option value="slideInUp">Slide In Up</option>
                <option value="slideInDown">Slide In Down</option>
                <option value="slideInLeft">Slide In Left</option>
                <option value="slideInRight">Slide In Right</option>
                <option value="zoomIn">Zoom In</option>
                <option value="bounceIn">Bounce In</option>
              </select>
            </div>

            {/* Hover Effects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hover Effect</label>
              <select
                value={style.hoverEffect || 'none'}
                onChange={(e) => handleChange('hoverEffect', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="none">None</option>
                <option value="scale">Scale</option>
                <option value="lift">Lift</option>
                <option value="glow">Glow</option>
                <option value="rotate">Rotate</option>
              </select>
            </div>

            {/* Scroll Effects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scroll Effect</label>
              <select
                value={style.scrollEffect || 'none'}
                onChange={(e) => handleChange('scrollEffect', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="none">None</option>
                <option value="parallax">Parallax</option>
                <option value="reveal">Reveal on Scroll</option>
                <option value="sticky">Sticky</option>
              </select>
            </div>

            {/* Animation Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <input
                type="text"
                value={style.animationDuration || '0.3s'}
                onChange={(e) => handleChange('animationDuration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="0.3s"
              />
            </div>
          </>
        )}

        {activeTab === 'responsive' && (
          <>
            {/* Mobile Settings */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">Configure how this block appears on mobile devices</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Visibility</label>
              <select
                value={style.mobileVisible !== false ? 'visible' : 'hidden'}
                onChange={(e) => handleChange('mobileVisible', e.target.value === 'visible')}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Padding</label>
              <input
                type="text"
                value={style.mobilePadding || style.padding || '20px 15px'}
                onChange={(e) => handleChange('mobilePadding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="20px 15px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Font Size</label>
              <input
                type="text"
                value={style.mobileFontSize || '14px'}
                onChange={(e) => handleChange('mobileFontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="14px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Text Align</label>
              <div className="grid grid-cols-3 gap-2">
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => handleChange('mobileAlignment', align)}
                    className={`px-3 py-2 border rounded text-sm capitalize ${
                      style.mobileAlignment === align
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StylePanel;