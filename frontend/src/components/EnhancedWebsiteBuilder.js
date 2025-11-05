import React, { useState, useEffect } from 'react';
import {
  Globe, Plus, Search, Edit, Trash2, Save, X,
  Monitor, Smartphone, Palette, Menu as MenuIcon, Settings,
  ChevronUp, ChevronDown, ExternalLink, FileText,
  Sparkles, Image as ImageIcon, Layers, Copy
} from 'lucide-react';
import api from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { advancedBlocks, blockCategories, createDefaultBlock } from './WebsiteBuilder/advancedBlocksDef';
import StylePanel from './WebsiteBuilder/StylePanel';
import AIDesignAssistant from './WebsiteBuilder/AIDesignAssistant';
import TemplateBrowser from './WebsiteBuilder/TemplateBrowser';
import AssetManager from './WebsiteBuilder/AssetManager';
import { WixPageBuilder } from './WixLikeBuilder';

const EnhancedWebsiteBuilder = () => {
  const [activeTab, setActiveTab] = useState('pages');
  const [pages, setPages] = useState([]);
  const [themes, setThemes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [showPageBuilder, setShowPageBuilder] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);

  useEffect(() => {
    fetchPages();
    fetchThemes();
    fetchActiveTheme();
    fetchMenus();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/website/pages');
      setPages(response.data.pages || []);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThemes = async () => {
    try {
      const response = await api.get('/api/website/themes');
      setThemes(response.data.themes || []);
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  };

  const fetchActiveTheme = async () => {
    try {
      const response = await api.get('/api/website/themes/active');
      setActiveTheme(response.data);
    } catch (error) {
      console.error('Failed to fetch active theme:', error);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await api.get('/api/website/navigation-menus');
      setMenus(response.data.menus || []);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await api.delete(`/api/website/pages/${pageId}`);
      fetchPages();
    } catch (error) {
      alert('Failed to delete page');
    }
  };

  const handleActivateTheme = async (themeId) => {
    try {
      await api.post(`/api/website/themes/${themeId}/activate`);
      fetchActiveTheme();
      fetchThemes();
    } catch (error) {
      alert('Failed to activate theme');
    }
  };

  const handlePublishPage = async (page) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    const actionText = newStatus === 'published' ? 'publish' : 'unpublish';
    
    if (!window.confirm(`Are you sure you want to ${actionText} this page?`)) return;
    
    try {
      await api.put(`/api/website/pages/${page.id}`, { status: newStatus });
      fetchPages();
    } catch (error) {
      alert(`Failed to ${actionText} page`);
    }
  };

  const handlePreviewPage = (page) => {
    setCurrentPage(page);
    setShowPreviewModal(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'pages':
        return (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search pages..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  data-testid="search-pages-input"
                />
              </div>

              <button
                onClick={() => {
                  setCurrentPage(null);
                  setShowPageModal(true);
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                data-testid="create-page-btn"
              >
                <Plus size={20} />
                New Page
              </button>
            </div>

            {/* Pages Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="spinner mx-auto"></div>
              </div>
            ) : pages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Globe className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No pages yet</h3>
                <p className="text-gray-600 mb-6">Create your first page to build your website</p>
                <button
                  onClick={() => setShowPageModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Create Your First Page
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map(page => (
                  <div key={page.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition" data-testid={`page-card-${page.id}`}>
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Globe className="text-blue-600" size={48} />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {page.status}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{page.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">/{page.slug}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePreviewPage(page)}
                            className="flex-1 bg-purple-50 text-purple-600 px-3 py-2 rounded-lg font-semibold hover:bg-purple-100 transition flex items-center justify-center gap-2"
                            data-testid={`preview-page-${page.id}`}
                          >
                            <Eye size={16} />
                            Preview
                          </button>
                          <button
                            onClick={() => {
                              setCurrentPage(page);
                              setShowPageBuilder(true);
                            }}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            data-testid={`edit-page-${page.id}`}
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePublishPage(page)}
                            className={`flex-1 ${
                              page.status === 'published' 
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            } px-3 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2`}
                            data-testid={`publish-page-${page.id}`}
                          >
                            {page.status === 'published' ? (
                              <>
                                <X size={16} />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Check size={16} />
                                Publish
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeletePage(page.id)}
                            className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition"
                            data-testid={`delete-page-${page.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'themes':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Website Themes</h3>
              <button
                onClick={() => setShowThemeModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                data-testid="create-theme-btn"
              >
                <Plus size={20} />
                New Theme
              </button>
            </div>

            {/* Active Theme */}
            {activeTheme && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Palette className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{activeTheme.name}</h4>
                      <p className="text-sm text-blue-600 font-medium">Active Theme</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowThemeModal(true)}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Customize
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Primary Color</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: activeTheme.primary_color }}
                      ></div>
                      <span className="text-sm font-mono">{activeTheme.primary_color}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Secondary Color</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: activeTheme.secondary_color }}
                      ></div>
                      <span className="text-sm font-mono">{activeTheme.secondary_color}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Accent Color</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: activeTheme.accent_color }}
                      ></div>
                      <span className="text-sm font-mono">{activeTheme.accent_color}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Themes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.filter(t => !t.is_active).map(theme => (
                <div key={theme.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Palette className="text-gray-600" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{theme.name}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div
                      className="h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: theme.primary_color }}
                    ></div>
                    <div
                      className="h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: theme.secondary_color }}
                    ></div>
                    <div
                      className="h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: theme.accent_color }}
                    ></div>
                  </div>

                  <button
                    onClick={() => handleActivateTheme(theme.id)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Activate Theme
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Navigation Menus</h3>
              <button
                onClick={() => setShowMenuModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                data-testid="create-menu-btn"
              >
                <Plus size={20} />
                New Menu
              </button>
            </div>

            {menus.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <MenuIcon className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No navigation menus yet</h3>
                <p className="text-gray-600 mb-6">Create a menu to organize your website navigation</p>
                <button
                  onClick={() => setShowMenuModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Create Your First Menu
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {menus.map(menu => (
                  <MenuCard key={menu.id} menu={menu} pages={pages} onUpdate={fetchMenus} />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Website Builder</h2>
          <p className="text-gray-600 mt-1">Build and customize your website with AI-powered tools</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6" data-testid="website-tabs">
            {[
              { id: 'pages', label: 'Pages', icon: FileText },
              { id: 'themes', label: 'Themes', icon: Palette },
              { id: 'navigation', label: 'Navigation', icon: MenuIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
      {showPageModal && (
        <PageModal
          page={currentPage}
          onClose={() => {
            setShowPageModal(false);
            setCurrentPage(null);
          }}
          onSave={(savedPage) => {
            fetchPages();
            setShowPageModal(false);
            // Automatically open page builder for new pages
            if (savedPage) {
              setCurrentPage(savedPage);
              setShowPageBuilder(true);
            } else {
              setCurrentPage(null);
            }
          }}
        />
      )}

      {showPageBuilder && currentPage && (
        <WixPageBuilder
          page={currentPage}
          onClose={() => {
            setShowPageBuilder(false);
            setCurrentPage(null);
          }}
          onSave={async (updatedPage) => {
            try {
              await api.put(`/api/website/pages/${currentPage.id}`, updatedPage);
              fetchPages();
              setShowPageBuilder(false);
              setCurrentPage(null);
            } catch (error) {
              alert('Failed to save page: ' + (error.response?.data?.detail || error.message));
            }
          }}
        />
      )}

      {showThemeModal && (
        <ThemeModal
          theme={activeTheme}
          onClose={() => setShowThemeModal(false)}
          onSave={() => {
            fetchActiveTheme();
            fetchThemes();
            setShowThemeModal(false);
          }}
        />
      )}

      {showMenuModal && (
        <MenuModal
          pages={pages}
          onClose={() => setShowMenuModal(false)}
          onSave={() => {
            fetchMenus();
            setShowMenuModal(false);
          }}
        />
      )}
    </div>
  );
};

// Enhanced Page Builder Modal with all integrations
const EnhancedPageBuilderModal = ({ page, onClose, onSave }) => {
  const [blocks, setBlocks] = useState(page.content?.blocks || []);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [showAssetManager, setShowAssetManager] = useState(false);
  const [showBlockEditor, setShowBlockEditor] = useState(false);

  const handleSave = async () => {
    try {
      await api.put(`/api/website/pages/${page.id}`, {
        content: { blocks },
        status: 'published'
      });
      onSave();
    } catch (error) {
      alert('Failed to save page');
    }
  };

  const addBlock = (blockType) => {
    const newBlock = createDefaultBlock(blockType);
    if (newBlock) {
      setBlocks([...blocks, newBlock]);
    }
  };

  const removeBlock = (blockId) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
  };

  const duplicateBlock = (block) => {
    const newBlock = {
      ...block,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    const index = blocks.findIndex(b => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const updateBlockStyle = (blockId, newStyle) => {
    setBlocks(blocks.map(b => 
      b.id === blockId ? { ...b, style: { ...b.style, ...newStyle } } : b
    ));
  };

  const updateBlockContent = (blockId, newContent) => {
    setBlocks(blocks.map(b => 
      b.id === blockId ? { ...b, content: { ...b.content, ...newContent } } : b
    ));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items);
  };

  const handleTemplateSelect = (template) => {
    // Insert template blocks
    if (template.content && template.content.blocks) {
      const newBlocks = template.content.blocks.map(block => ({
        ...block,
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      setBlocks([...blocks, ...newBlocks]);
    }
  };

  const handleAIApply = (aiResult) => {
    // Handle AI generated content
    console.log('AI Result:', aiResult);
    // Could create blocks from AI content or update existing blocks
  };

  const handleAssetSelect = (asset) => {
    // Insert asset into selected block or create new image block
    if (selectedBlock && selectedBlock.type === 'image') {
      updateBlockContent(selectedBlock.id, { image_url: asset.url });
    } else {
      const newBlock = createDefaultBlock('image');
      if (newBlock) {
        newBlock.content.image_url = asset.url;
        setBlocks([...blocks, newBlock]);
      }
    }
  };

  const filteredBlocks = activeCategory === 'all' 
    ? Object.values(advancedBlocks)
    : Object.values(advancedBlocks).filter(b => b.category === activeCategory);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Page: {page.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Toolbar Actions */}
          <button
            onClick={() => setShowTemplateBrowser(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
            title="Browse Templates"
          >
            <Layers size={20} />
            Templates
          </button>
          
          <button
            onClick={() => setShowAIAssistant(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition"
            title="AI Design Assistant"
          >
            <Sparkles size={20} />
            AI Assistant
          </button>

          <button
            onClick={() => setShowAssetManager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
            title="Asset Manager"
          >
            <ImageIcon size={20} />
            Assets
          </button>

          {/* Preview Mode Selector */}
          <div className="flex gap-2 border-l border-gray-200 pl-3">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-lg ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Desktop Preview"
            >
              <Monitor size={20} />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-lg ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Mobile Preview"
            >
              <Smartphone size={20} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
          >
            <Save size={20} />
            Save Page
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Builder Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Block Library Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-bold text-gray-900 mb-4">Add Blocks</h3>
            
            {/* Category Filter */}
            <div className="mb-4 space-y-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  activeCategory === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Blocks
              </button>
              {blockCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    activeCategory === category.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Block List */}
            <div className="space-y-2">
              {filteredBlocks.map(block => (
                <button
                  key={block.type}
                  onClick={() => addBlock(block.type)}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-blue-50 hover:text-blue-600 transition border border-gray-200 flex items-center justify-between group"
                >
                  <span className="font-medium">{block.name}</span>
                  <Plus size={16} className="opacity-0 group-hover:opacity-100 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <div className={`mx-auto bg-white shadow-lg ${previewMode === 'mobile' ? 'max-w-sm' : 'max-w-6xl'}`}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="blocks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {blocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="relative group"
                          >
                            <BlockPreview block={block} />
                            
                            {/* Block Actions Toolbar */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedBlock(block);
                                  setShowBlockEditor(true);
                                }}
                                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                                title="Edit Content"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBlock(block);
                                  setShowStylePanel(true);
                                }}
                                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition"
                                title="Customize Style"
                              >
                                <Palette size={16} />
                              </button>
                              <button
                                onClick={() => duplicateBlock(block)}
                                className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition"
                                title="Duplicate Block"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                onClick={() => removeBlock(block.id)}
                                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                                title="Delete Block"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {blocks.length === 0 && (
              <div className="p-12">
                <div className="text-center text-gray-500 mb-8">
                  <Layers className="mx-auto mb-4" size={64} />
                  <p className="text-2xl font-bold mb-2 text-gray-900">Start Building Your Page</p>
                  <p className="text-lg">Choose how you'd like to begin:</p>
                </div>
                
                {/* Quick Start Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <button
                    onClick={() => setShowTemplateBrowser(true)}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition text-left group"
                  >
                    <Layers className="text-purple-600 mb-4 group-hover:scale-110 transition" size={48} />
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Use a Template</h3>
                    <p className="text-sm text-gray-600">Start with a professional template and customize it</p>
                  </button>
                  
                  <button
                    onClick={() => setShowAIAssistant(true)}
                    className="bg-gradient-to-br from-pink-50 to-purple-100 border-2 border-pink-200 rounded-xl p-6 hover:shadow-lg transition text-left group"
                  >
                    <Sparkles className="text-pink-600 mb-4 group-hover:scale-110 transition" size={48} />
                    <h3 className="font-bold text-lg text-gray-900 mb-2">AI Designer</h3>
                    <p className="text-sm text-gray-600">Let AI create a custom page for your business</p>
                  </button>
                  
                  <div
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition text-left group cursor-default"
                  >
                    <Plus className="text-blue-600 mb-4" size={48} />
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Start from Scratch</h3>
                    <p className="text-sm text-gray-600">Add blocks from the left sidebar to build your page</p>
                  </div>
                </div>
                
                {/* Quick Tips */}
                <div className="mt-12 max-w-3xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="text-blue-600" size={20} />
                    Quick Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <strong>Drag & Drop:</strong> Reorder blocks by dragging them</li>
                    <li>• <strong>Hover Actions:</strong> Hover over any block to edit, style, duplicate, or delete</li>
                    <li>• <strong>Templates:</strong> Browse 24+ professional templates to speed up your design</li>
                    <li>• <strong>AI Assistant:</strong> Generate content, colors, and entire sections with AI</li>
                    <li>• <strong>Preview Modes:</strong> Switch between desktop and mobile views</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Style Panel */}
      {showStylePanel && selectedBlock && (
        <StylePanel
          block={selectedBlock}
          onStyleChange={(newStyle) => updateBlockStyle(selectedBlock.id, newStyle)}
          onClose={() => {
            setShowStylePanel(false);
            setSelectedBlock(null);
          }}
        />
      )}

      {/* AI Design Assistant */}
      {showAIAssistant && (
        <AIDesignAssistant
          onClose={() => setShowAIAssistant(false)}
          onApply={handleAIApply}
        />
      )}

      {/* Template Browser */}
      {showTemplateBrowser && (
        <TemplateBrowser
          onClose={() => setShowTemplateBrowser(false)}
          onSelect={handleTemplateSelect}
        />
      )}

      {/* Asset Manager */}
      {showAssetManager && (
        <AssetManager
          onClose={() => setShowAssetManager(false)}
          onSelect={handleAssetSelect}
        />
      )}

      {/* Block Editor Modal */}
      {showBlockEditor && selectedBlock && (
        <BlockEditorModal
          block={selectedBlock}
          onClose={() => {
            setShowBlockEditor(false);
            setSelectedBlock(null);
          }}
          onSave={(newContent) => {
            updateBlockContent(selectedBlock.id, newContent);
            setShowBlockEditor(false);
            setSelectedBlock(null);
          }}
        />
      )}
    </div>
  );
};

// Block Preview Component
const BlockPreview = ({ block }) => {
  const { type, content, style } = block;

  const containerStyle = {
    backgroundColor: style?.backgroundColor,
    color: style?.textColor,
    padding: style?.padding || '40px 20px',
    textAlign: style?.alignment || 'left'
  };

  // Render different block types
  switch (type) {
    case 'hero':
      return (
        <div style={containerStyle}>
          <h1 style={{ fontSize: style?.headingSize || '48px', margin: '0 0 16px', fontWeight: 'bold' }}>
            {content.headline || 'Hero Headline'}
          </h1>
          <p style={{ fontSize: style?.subheadingSize || '20px', margin: '0 0 24px' }}>
            {content.subheadline || 'Hero subheadline goes here'}
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">
            {content.cta_text || 'Get Started'}
          </button>
        </div>
      );
    
    case 'text':
    case 'rich_text':
      return (
        <div style={containerStyle}>
          <div dangerouslySetInnerHTML={{ __html: content.text || 'Text content goes here' }} />
        </div>
      );
    
    case 'image':
      return (
        <div style={containerStyle}>
          {content.image_url ? (
            <img src={content.image_url} alt={content.alt_text || ''} className="w-full rounded-lg" />
          ) : (
            <div className="bg-gray-200 h-64 flex items-center justify-center rounded-lg">
              <ImageIcon className="text-gray-400" size={64} />
            </div>
          )}
        </div>
      );
    
    case 'button':
      return (
        <div style={containerStyle}>
          <button 
            className="px-6 py-3 rounded-lg font-semibold"
            style={{ 
              backgroundColor: style?.buttonColor || '#3B82F6', 
              color: '#FFFFFF' 
            }}
          >
            {content.text || 'Button Text'}
          </button>
        </div>
      );

    case 'features':
      return (
        <div style={containerStyle}>
          <h2 className="text-3xl font-bold mb-8">{content.headline || 'Our Features'}</h2>
          <div className="grid grid-cols-3 gap-6">
            {(content.features || [{ title: 'Feature 1' }, { title: 'Feature 2' }, { title: 'Feature 3' }]).map((feature, i) => (
              <div key={i} className="p-6 bg-white border border-gray-200 rounded-lg">
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div style={containerStyle}>
          <h2 className="text-3xl font-bold mb-8">{content.headline || 'Testimonials'}</h2>
          <div className="grid grid-cols-2 gap-6">
            {(content.testimonials || [{ name: 'John Doe', text: 'Great product!' }]).map((testimonial, i) => (
              <div key={i} className="p-6 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                <p className="font-bold">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      );
    
    default:
      return (
        <div style={containerStyle}>
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-500">{type} block</p>
          </div>
        </div>
      );
  }
};

// Block Editor Modal
const BlockEditorModal = ({ block, onClose, onSave }) => {
  const [content, setContent] = useState(block.content || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(content);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Block Content</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Render different inputs based on block type */}
          {block.type === 'hero' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
                <input
                  type="text"
                  value={content.headline || ''}
                  onChange={(e) => setContent({ ...content, headline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline</label>
                <textarea
                  value={content.subheadline || ''}
                  onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CTA Button Text</label>
                <input
                  type="text"
                  value={content.cta_text || ''}
                  onChange={(e) => setContent({ ...content, cta_text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {(block.type === 'text' || block.type === 'rich_text') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                value={content.text || ''}
                onChange={(e) => setContent({ ...content, text: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your text content here..."
              />
            </div>
          )}

          {block.type === 'image' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="text"
                  value={content.image_url || ''}
                  onChange={(e) => setContent({ ...content, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
                <input
                  type="text"
                  value={content.alt_text || ''}
                  onChange={(e) => setContent({ ...content, alt_text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {block.type === 'button' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                <input
                  type="text"
                  value={content.text || ''}
                  onChange={(e) => setContent({ ...content, text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                <input
                  type="text"
                  value={content.link_url || ''}
                  onChange={(e) => setContent({ ...content, link_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Page Modal (unchanged from original)
const PageModal = ({ page, onClose, onSave }) => {
  const [formData, setFormData] = useState(page || {
    title: '',
    slug: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      const dataToSubmit = {
        ...formData,
        content: formData.content || { blocks: [] } // Add default content structure
      };
      
      let savedPage;
      if (page) {
        const response = await api.put(`/api/website/pages/${page.id}`, dataToSubmit);
        savedPage = response.data;
      } else {
        const response = await api.post('/api/website/pages', dataToSubmit);
        savedPage = response.data;
      }
      onSave(savedPage);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to save page. Please try again.';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="page-modal">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {page ? 'Edit Page' : 'Create New Page'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter page title"
              data-testid="page-title-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="url-slug"
            />
            <p className="text-sm text-gray-500 mt-1">Leave empty to auto-generate from title</p>
          </div>

          {/* SEO Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
                <textarea
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keywords</label>
                <input
                  type="text"
                  value={formData.seo_keywords}
                  onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="save-page-btn"
            >
              {saving ? 'Saving...' : (page ? 'Update Page' : 'Create Page')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Theme Modal (unchanged from original)
const ThemeModal = ({ theme, onClose, onSave }) => {
  const [formData, setFormData] = useState(theme || {
    name: 'My Theme',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    background_color: '#FFFFFF',
    text_color: '#111827',
    heading_font: 'Inter',
    body_font: 'Inter'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (theme?.id && theme.id !== 'default') {
        await api.put(`/api/website/themes/${theme.id}`, formData);
      } else {
        const response = await api.post('/api/website/themes', formData);
        await api.post(`/api/website/themes/${response.data.id}/activate`);
      }
      onSave();
    } catch (error) {
      alert('Failed to save theme');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Customize Theme</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-full h-12 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                className="w-full h-12 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <input
                type="color"
                value={formData.accent_color}
                onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                className="w-full h-12 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <input
                type="color"
                value={formData.background_color}
                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                className="w-full h-12 rounded-lg border border-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Save Theme
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Menu Card Component (unchanged from original)
const MenuCard = ({ menu, pages, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [menuItems, setMenuItems] = useState(menu.menu_items || []);

  const handleSave = async () => {
    try {
      await api.put(`/api/website/navigation-menus/${menu.id}`, {
        menu_items: menuItems
      });
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      alert('Failed to update menu');
    }
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, {
      id: `item_${Date.now()}`,
      label: 'New Item',
      url: '/',
      type: 'page',
      order: menuItems.length
    }]);
  };

  const removeMenuItem = (itemId) => {
    setMenuItems(menuItems.filter(item => item.id !== itemId));
  };

  const moveItem = (index, direction) => {
    const newItems = [...menuItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    newItems.forEach((item, idx) => item.order = idx);
    setMenuItems(newItems);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-900">{menu.name}</h4>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit Menu
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === menuItems.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              
              <input
                type="text"
                value={item.label}
                onChange={(e) => {
                  const newItems = [...menuItems];
                  newItems[index].label = e.target.value;
                  setMenuItems(newItems);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Menu label"
              />
              
              <input
                type="text"
                value={item.url}
                onChange={(e) => {
                  const newItems = [...menuItems];
                  newItems[index].url = e.target.value;
                  setMenuItems(newItems);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="URL"
              />
              
              <button
                onClick={() => removeMenuItem(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          
          <button
            onClick={addMenuItem}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition"
          >
            <Plus size={20} className="inline mr-2" />
            Add Menu Item
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {menuItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-gray-700">
              <ExternalLink size={16} className="text-gray-400" />
              <span>{item.label}</span>
              <span className="text-gray-400">→</span>
              <span className="text-sm text-gray-500">{item.url}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Menu Modal (unchanged from original)
const MenuModal = ({ pages, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: 'header'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/website/navigation-menus', formData);
      onSave();
    } catch (error) {
      alert('Failed to create menu');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">New Menu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Menu Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Menu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="header">Header</option>
              <option value="footer">Footer</option>
              <option value="sidebar">Sidebar</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Create Menu
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedWebsiteBuilder;
