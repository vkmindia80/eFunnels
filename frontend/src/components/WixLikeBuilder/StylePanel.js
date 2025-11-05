import React, { useState } from 'react';
import {
  X, Palette, Type, Layout, Maximize, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, ChevronDown, ChevronUp
} from 'lucide-react';

const StylePanel = ({ block, onStyleChange, onClose }) => {
  const [activeSection, setActiveSection] = useState('colors');
  const [style, setStyle] = useState(block.style || {});

  const handleChange = (key, value) => {
    const newStyle = { ...style, [key]: value };
    setStyle(newStyle);
    onStyleChange(newStyle);
  };

  const sections = [
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'spacing', label: 'Spacing', icon: Maximize },
  ];

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">Style Settings</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600">Customize block appearance</p>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-gray-200">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition ${
              activeSection === section.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <section.icon size={18} className="mx-auto mb-1" />
            <div className="text-xs">{section.label}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeSection === 'colors' && (
          <>
            <StyleControl
              label="Background Color"
              type="color"
              value={style.backgroundColor || '#ffffff'}
              onChange={(value) => handleChange('backgroundColor', value)}
            />
            <StyleControl
              label="Text Color"
              type="color"
              value={style.textColor || '#000000'}
              onChange={(value) => handleChange('textColor', value)}
            />
            {(block.type === 'hero' || block.type === 'button' || block.type === 'cta') && (
              <StyleControl
                label="Button Color"
                type="color"
                value={style.buttonColor || '#3B82F6'}
                onChange={(value) => handleChange('buttonColor', value)}
              />
            )}
            {(block.type === 'button') && (
              <StyleControl
                label="Button Text Color"
                type="color"
                value={style.buttonTextColor || '#FFFFFF'}
                onChange={(value) => handleChange('buttonTextColor', value)}
              />
            )}
            <StyleControl
              label="Overlay Opacity"
              type="range"
              min={0}
              max={100}
              value={style.overlayOpacity || 0}
              onChange={(value) => handleChange('overlayOpacity', value)}
              unit="%"
            />
          </>
        )}

        {activeSection === 'typography' && (
          <>
            {(block.type === 'hero' || block.type === 'heading') && (
              <>
                <StyleControl
                  label="Heading Font"
                  type="select"
                  value={style.headingFont || 'inherit'}
                  onChange={(value) => handleChange('headingFont', value)}
                  options={[
                    { value: 'inherit', label: 'Default' },
                    { value: 'Arial, sans-serif', label: 'Arial' },
                    { value: 'Georgia, serif', label: 'Georgia' },
                    { value: '"Times New Roman", serif', label: 'Times New Roman' },
                    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
                    { value: '"Courier New", monospace', label: 'Courier New' },
                    { value: 'Verdana, sans-serif', label: 'Verdana' },
                  ]}
                />
                <StyleControl
                  label="Heading Size"
                  type="range"
                  min={24}
                  max={72}
                  value={parseInt(style.headingSize) || 48}
                  onChange={(value) => handleChange('headingSize', value + 'px')}
                  unit="px"
                />
                <StyleControl
                  label="Subheading Size"
                  type="range"
                  min={14}
                  max={32}
                  value={parseInt(style.subheadingSize) || 20}
                  onChange={(value) => handleChange('subheadingSize', value + 'px')}
                  unit="px"
                />
              </>
            )}
            
            <StyleControl
              label="Body Font"
              type="select"
              value={style.bodyFont || 'inherit'}
              onChange={(value) => handleChange('bodyFont', value)}
              options={[
                { value: 'inherit', label: 'Default' },
                { value: 'Arial, sans-serif', label: 'Arial' },
                { value: 'Georgia, serif', label: 'Georgia' },
                { value: '"Times New Roman", serif', label: 'Times New Roman' },
                { value: 'Helvetica, sans-serif', label: 'Helvetica' },
                { value: '"Courier New", monospace', label: 'Courier New' },
                { value: 'Verdana, sans-serif', label: 'Verdana' },
              ]}
            />
            
            <StyleControl
              label="Font Size"
              type="range"
              min={12}
              max={24}
              value={parseInt(style.fontSize) || 16}
              onChange={(value) => handleChange('fontSize', value + 'px')}
              unit="px"
            />
            
            <StyleControl
              label="Font Weight"
              type="select"
              value={style.fontWeight || 'normal'}
              onChange={(value) => handleChange('fontWeight', value)}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'bold', label: 'Bold' },
                { value: '300', label: 'Light' },
                { value: '600', label: 'Semi-bold' },
                { value: '800', label: 'Extra-bold' },
              ]}
            />
            
            <StyleControl
              label="Line Height"
              type="range"
              min={1}
              max={2.5}
              step={0.1}
              value={parseFloat(style.lineHeight) || 1.5}
              onChange={(value) => handleChange('lineHeight', value)}
            />
            
            <StyleControl
              label="Letter Spacing"
              type="range"
              min={-2}
              max={5}
              step={0.1}
              value={parseFloat(style.letterSpacing) || 0}
              onChange={(value) => handleChange('letterSpacing', value + 'px')}
              unit="px"
            />
          </>
        )}

        {activeSection === 'layout' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Alignment</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                  { value: 'justify', icon: AlignJustify },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleChange('alignment', value)}
                    className={`p-3 border-2 rounded-lg transition ${
                      (style.alignment || 'left') === value
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} className="mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            {block.type === 'features' && (
              <StyleControl
                label="Number of Columns"
                type="range"
                min={1}
                max={4}
                value={style.columns || 3}
                onChange={(value) => handleChange('columns', parseInt(value))}
              />
            )}

            {block.type === 'image' && (
              <>
                <StyleControl
                  label="Image Height"
                  type="range"
                  min={200}
                  max={800}
                  value={parseInt(style.imageHeight) || 400}
                  onChange={(value) => handleChange('imageHeight', value + 'px')}
                  unit="px"
                />
                <StyleControl
                  label="Object Fit"
                  type="select"
                  value={style.objectFit || 'cover'}
                  onChange={(value) => handleChange('objectFit', value)}
                  options={[
                    { value: 'cover', label: 'Cover' },
                    { value: 'contain', label: 'Contain' },
                    { value: 'fill', label: 'Fill' },
                    { value: 'none', label: 'None' },
                  ]}
                />
              </>
            )}

            <StyleControl
              label="Border Radius"
              type="range"
              min={0}
              max={50}
              value={parseInt(style.borderRadius) || 0}
              onChange={(value) => handleChange('borderRadius', value + 'px')}
              unit="px"
            />
          </>
        )}

        {activeSection === 'spacing' && (
          <>
            <StyleControl
              label="Padding Top"
              type="range"
              min={0}
              max={200}
              value={parseInt((style.padding || '40px 20px').split(' ')[0]) || 40}
              onChange={(value) => {
                const parts = (style.padding || '40px 20px').split(' ');
                parts[0] = value + 'px';
                handleChange('padding', parts.join(' '));
              }}
              unit="px"
            />
            <StyleControl
              label="Padding Bottom"
              type="range"
              min={0}
              max={200}
              value={parseInt((style.padding || '40px 20px').split(' ')[0]) || 40}
              onChange={(value) => {
                const parts = (style.padding || '40px 20px').split(' ');
                parts[0] = value + 'px';
                handleChange('padding', parts.join(' '));
              }}
              unit="px"
            />
            <StyleControl
              label="Padding Left/Right"
              type="range"
              min={0}
              max={200}
              value={parseInt((style.padding || '40px 20px').split(' ')[1]) || 20}
              onChange={(value) => {
                const parts = (style.padding || '40px 20px').split(' ');
                parts[1] = value + 'px';
                handleChange('padding', parts.join(' '));
              }}
              unit="px"
            />
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <StyleControl
                label="Margin Top"
                type="range"
                min={0}
                max={100}
                value={parseInt((style.margin || '0').split(' ')[0]) || 0}
                onChange={(value) => handleChange('marginTop', value + 'px')}
                unit="px"
              />
              <StyleControl
                label="Margin Bottom"
                type="range"
                min={0}
                max={100}
                value={parseInt(style.marginBottom) || 0}
                onChange={(value) => handleChange('marginBottom', value + 'px')}
                unit="px"
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => {
            setStyle({});
            onStyleChange({});
          }}
          className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
};

// Style Control Component
const StyleControl = ({ label, type, value, onChange, options, min, max, step, unit }) => {
  const [showValue, setShowValue] = useState(false);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {type === 'range' && unit && (
          <span className="text-sm text-gray-600 font-mono">
            {value}{unit}
          </span>
        )}
      </div>
      
      {type === 'color' && (
        <div className="flex gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}
      
      {type === 'range' && (
        <input
          type="range"
          min={min}
          max={max}
          step={step || 1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      )}
      
      {type === 'select' && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      
      {type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      )}
    </div>
  );
};

export default StylePanel;
