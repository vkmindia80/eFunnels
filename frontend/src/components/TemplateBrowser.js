import React, { useState, useEffect } from 'react';
import { X, Search, Eye, Download, Star, Sparkles, Monitor, Smartphone, Code, Edit, Trash2 } from 'lucide-react';
import api from '../api';
import { blocksToHTML } from './EmailBuilder/utils';

const TemplateBrowser = ({ module, onSelectTemplate, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [module]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/templates/${module}`);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))];

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleEditTemplate = async (template) => {
    // Create a copy of the template for editing
    const editedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      is_public: false,
      id: undefined // Remove ID so a new one will be created
    };
    onSelectTemplate(editedTemplate);
    onClose();
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      await api.delete(`/api/templates/${module}/${templateId}`);
      // Refresh templates list
      fetchTemplates();
      alert('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-blue-500" size={28} />
              Template Library
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose from professionally designed templates
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition cursor-pointer overflow-hidden group"
                >
                  {/* Template Preview Image */}
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Sparkles size={48} className="text-blue-400" />
                      </div>
                    )}
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="bg-white text-gray-700 p-3 rounded-lg hover:bg-gray-100 transition"
                        title="Preview"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => handleSelectTemplate(template)}
                        className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
                        title="Use Template"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{template.name}</h3>
                      {template.is_public && (
                        <Star size={16} className="text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      {template.category && (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                          {template.category}
                        </span>
                      )}
                      
                      {/* Action Buttons - Always Visible */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTemplate(template);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Preview"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template);
                          }}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        {!template.is_public && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUseTemplate={() => {
            handleSelectTemplate(previewTemplate);
            setPreviewTemplate(null);
          }}
          onEditTemplate={handleEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />
      )}
    </div>
  );
};

// Enhanced Template Preview Modal Component
const TemplatePreviewModal = ({ template, onClose, onUseTemplate, onEditTemplate, onDeleteTemplate }) => {
  const [viewMode, setViewMode] = useState('desktop'); // desktop, mobile
  const [previewMode, setPreviewMode] = useState('visual'); // visual, html

  // Generate HTML preview from template content
  const htmlContent = template.content?.blocks ? blocksToHTML(template.content.blocks) : '<p>No preview available</p>';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-blue-500" size={24} />
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-3 mr-4">
            {/* Desktop/Mobile Toggle */}
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-sm font-medium ${
                  viewMode === 'desktop'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Monitor size={16} />
                Desktop
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-sm font-medium ${
                  viewMode === 'mobile'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Smartphone size={16} />
                Mobile
              </button>
            </div>

            {/* Visual/HTML Toggle */}
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setPreviewMode('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-sm font-medium ${
                  previewMode === 'visual'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye size={16} />
                Visual
              </button>
              <button
                onClick={() => setPreviewMode('html')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-sm font-medium ${
                  previewMode === 'html'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Code size={16} />
                Code
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition"
            title="Close"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-8">
          {previewMode === 'visual' ? (
            <div className="flex justify-center">
              <div
                className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  width: viewMode === 'desktop' ? '800px' : '375px',
                  maxWidth: '100%',
                }}
              >
                <iframe
                  srcDoc={htmlContent}
                  title="Template Preview"
                  className="w-full border-0"
                  style={{ minHeight: '600px', height: '100%' }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              <div className="bg-gray-900 rounded-xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
                  <span className="text-green-400 font-mono text-sm font-semibold">HTML Source</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(htmlContent);
                      alert('HTML copied to clipboard!');
                    }}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition"
                  >
                    Copy Code
                  </button>
                </div>
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[500px]">
                  {htmlContent}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {template.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium capitalize">
                {template.category}
              </span>
            )}
            {template.subject && (
              <span className="flex items-center gap-2">
                <span className="font-semibold">Subject:</span>
                <span className="text-gray-700">{template.subject}</span>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                onEditTemplate(template);
                onClose();
              }}
              className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-2"
            >
              <Edit size={18} />
              Edit Template
            </button>
            {!template.is_public && (
              <button
                onClick={() => {
                  onDeleteTemplate(template.id);
                  onClose();
                }}
                className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            )}
            <button
              onClick={onUseTemplate}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
            >
              <Download size={18} />
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBrowser;
