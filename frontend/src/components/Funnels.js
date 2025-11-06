import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Eye, Edit, Trash2, BarChart3, Play, Pause, 
  Copy, Settings, ExternalLink, ChevronRight, Layout, 
  Target, Users, TrendingUp, Globe, Search, Filter,
  ArrowLeft, Save, X, Monitor, Smartphone, Code,
  GripVertical, Palette, Type, Image as ImageIcon, Sparkles, Wand2
} from 'lucide-react';
import api from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { defaultBlocks, getBlockIcon, getBlockLabel } from './FunnelBuilder/pageBlocks';
import TemplateBrowser from './TemplateBrowser';
import UniversalAIAssistant from './UniversalAIAssistant';
import { WixPageBuilder } from './WixLikeBuilder';

const Funnels = () => {
  const [activeTab, setActiveTab] = useState('funnels'); // funnels, templates, builder, analytics
  const [funnels, setFunnels] = useState([]);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Page builder states
  const [builderMode, setBuilderMode] = useState(null); // null, 'edit', 'preview'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop, mobile, tablet
  const [pageBlocks, setPageBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showBlockLibrary, setShowBlockLibrary] = useState(false);

  useEffect(() => {
    loadFunnels();
    loadTemplates();
  }, []);

  const loadFunnels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/funnels');
      setFunnels(response.data.funnels);
    } catch (error) {
      console.error('Error loading funnels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/api/funnel-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const createFunnelFromTemplate = async (templateId) => {
    try {
      const name = prompt('Enter funnel name:');
      if (!name) return;

      const response = await api.post('/api/funnels', {
        name,
        description: '',
        funnel_type: 'custom',
        template_id: templateId
      });

      setFunnels([response.data, ...funnels]);
      setShowTemplateModal(false);
      alert('Funnel created successfully!');
    } catch (error) {
      console.error('Error creating funnel:', error);
      alert('Failed to create funnel');
    }
  };

  const createBlankFunnel = async (funnelData) => {
    try {
      const response = await api.post('/api/funnels', funnelData);
      setFunnels([response.data, ...funnels]);
      setShowCreateModal(false);
      alert('Funnel created successfully!');
    } catch (error) {
      console.error('Error creating funnel:', error);
      alert('Failed to create funnel');
    }
  };

  const deleteFunnel = async (funnelId) => {
    if (!window.confirm('Are you sure you want to delete this funnel?')) return;

    try {
      await api.delete(`/api/funnels/${funnelId}`);
      setFunnels(funnels.filter(f => f.id !== funnelId));
      alert('Funnel deleted successfully');
    } catch (error) {
      console.error('Error deleting funnel:', error);
      alert('Failed to delete funnel');
    }
  };

  const updateFunnelStatus = async (funnelId, status) => {
    try {
      await api.put(`/api/funnels/${funnelId}`, { status });
      setFunnels(funnels.map(f => f.id === funnelId ? { ...f, status } : f));
    } catch (error) {
      console.error('Error updating funnel:', error);
      alert('Failed to update funnel status');
    }
  };

  const updateFunnel = async (funnelId, funnelData) => {
    try {
      const response = await api.put(`/api/funnels/${funnelId}`, funnelData);
      setFunnels(funnels.map(f => f.id === funnelId ? response.data : f));
      setShowEditModal(false);
      setSelectedFunnel(null);
      alert('Funnel updated successfully!');
      loadFunnels(); // Reload to get fresh data
    } catch (error) {
      console.error('Error updating funnel:', error);
      alert('Failed to update funnel');
    }
  };

  const openPageBuilder = async (funnel, page) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/funnels/${funnel.id}/pages/${page.id}`);
      setSelectedFunnel(funnel);
      setSelectedPage(response.data);
      setPageBlocks(response.data.content?.blocks || []);
      setBuilderMode('edit');
      setActiveTab('builder');
    } catch (error) {
      console.error('Error loading page:', error);
      alert('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const savePageContent = async () => {
    if (!selectedPage) return;

    try {
      setLoading(true);
      await api.put(
        `/api/funnels/${selectedFunnel.id}/pages/${selectedPage.id}`,
        {
          content: { blocks: pageBlocks }
        }
      );
      alert('Page saved successfully!');
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page');
    } finally {
      setLoading(false);
    }
  };

  const addBlock = (blockType) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      ...defaultBlocks[blockType]
    };
    setPageBlocks([...pageBlocks, newBlock]);
    setShowBlockLibrary(false);
  };

  const updateBlock = (blockId, updates) => {
    setPageBlocks(pageBlocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (blockId) => {
    setPageBlocks(pageBlocks.filter(block => block.id !== blockId));
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null);
    }
  };

  const duplicateBlock = (blockId) => {
    const block = pageBlocks.find(b => b.id === blockId);
    if (block) {
      const newBlock = {
        ...block,
        id: `block-${Date.now()}`
      };
      const index = pageBlocks.findIndex(b => b.id === blockId);
      const newBlocks = [...pageBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setPageBlocks(newBlocks);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(pageBlocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPageBlocks(items);
  };

  const filteredFunnels = funnels.filter(funnel => {
    const matchesSearch = funnel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || funnel.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Render different views
  if (activeTab === 'builder' && builderMode) {
    return <WixPageBuilder 
      page={selectedPage}
      onClose={() => {
        setBuilderMode(null);
        setActiveTab('funnels');
        setSelectedBlock(null);
      }}
      onSave={async (updatedPage) => {
        try {
          await api.put(
            `/api/funnels/${selectedFunnel.id}/pages/${selectedPage.id}`,
            updatedPage
          );
          setBuilderMode(null);
          setActiveTab('funnels');
          alert('Page saved successfully!');
        } catch (error) {
          alert('Failed to save page: ' + (error.response?.data?.detail || error.message));
        }
      }}
    />;
  }

  if (activeTab === 'templates') {
    return <TemplatesView 
      templates={templates}
      onSelectTemplate={createFunnelFromTemplate}
      onBack={() => setActiveTab('funnels')}
    />;
  }

  // Main funnels dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-600" />
            Sales Funnels
          </h1>
          <p className="text-gray-600 mt-1">Create high-converting sales funnels and landing pages</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Layout className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Funnel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Layout className="w-5 h-5" />}
          label="Total Funnels"
          value={funnels.length}
          color="blue"
        />
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Total Visits"
          value={funnels.reduce((sum, f) => sum + (f.total_visits || 0), 0)}
          color="green"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Conversions"
          value={funnels.reduce((sum, f) => sum + (f.total_conversions || 0), 0)}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg. Conv. Rate"
          value={`${(funnels.reduce((sum, f) => sum + (f.conversion_rate || 0), 0) / funnels.length || 0).toFixed(1)}%`}
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search funnels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Funnels List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading funnels...</p>
        </div>
      ) : filteredFunnels.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No funnels yet</h3>
          <p className="text-gray-600 mb-4">Create your first funnel to start converting visitors</p>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFunnels.map(funnel => (
            <FunnelCard
              key={funnel.id}
              funnel={funnel}
              onEdit={() => {
                setSelectedFunnel(funnel);
                setShowEditModal(true);
              }}
              onDelete={() => deleteFunnel(funnel.id)}
              onStatusChange={(status) => updateFunnelStatus(funnel.id, status)}
              onOpenBuilder={openPageBuilder}
            />
          ))}
        </div>
      )}

      {/* Create Funnel Modal */}
      {showCreateModal && (
        <CreateFunnelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createBlankFunnel}
          onUseTemplate={() => {
            setShowCreateModal(false);
            setShowTemplateModal(true);
          }}
        />
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <TemplateModal
          templates={templates}
          onClose={() => setShowTemplateModal(false)}
          onSelect={createFunnelFromTemplate}
        />
      )}

      {/* Edit Funnel Modal */}
      {showEditModal && selectedFunnel && (
        <EditFunnelModal
          funnel={selectedFunnel}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFunnel(null);
          }}
          onUpdate={updateFunnel}
        />
      )}
    </div>
  );
};

// Sub-components
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

const FunnelCard = ({ funnel, onEdit, onDelete, onStatusChange, onOpenBuilder }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  const loadPages = async () => {
    if (pages.length > 0) return;
    try {
      setLoadingPages(true);
      const response = await api.get(`/api/funnels/${funnel.id}/pages`);
      setPages(response.data);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoadingPages(false);
    }
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-red-100 text-red-700'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{funnel.name}</h3>
            <p className="text-sm text-gray-600">{funnel.description || 'No description'}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[funnel.status]}`}>
            {funnel.status}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
          <div>
            <div className="text-xs text-gray-500">Pages</div>
            <div className="text-lg font-bold text-gray-900">{funnel.page_count || 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Visits</div>
            <div className="text-lg font-bold text-gray-900">{funnel.total_visits || 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Conv. Rate</div>
            <div className="text-lg font-bold text-gray-900">{funnel.conversion_rate || 0}%</div>
          </div>
        </div>

        {/* Pages List */}
        <div className="mb-4">
          <button
            onClick={loadPages}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
          >
            {pages.length > 0 ? 'Pages' : 'View Pages'} ({funnel.page_count || 0})
          </button>
          {loadingPages && (
            <div className="text-xs text-gray-500">Loading...</div>
          )}
          {pages.length > 0 && (
            <div className="space-y-2">
              {pages.slice(0, 3).map(page => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => onOpenBuilder(funnel, page)}
                >
                  <span className="text-sm text-gray-700">{page.name}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
              {pages.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{pages.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {funnel.status === 'draft' && (
            <button
              onClick={() => onStatusChange('active')}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center gap-1"
            >
              <Play className="w-4 h-4" />
              Publish
            </button>
          )}
          {funnel.status === 'active' && (
            <button
              onClick={() => onStatusChange('paused')}
              className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 flex items-center justify-center gap-1"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 border border-red-300 text-red-700 text-sm rounded hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateFunnelModal = ({ onClose, onCreate, onUseTemplate }) => {
  const [step, setStep] = useState(1); // 1: Choose method, 2: Fill details
  const [selectedMethod, setSelectedMethod] = useState(null); // 'template' or 'blank'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    funnel_type: 'custom'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  const funnelTypeDescriptions = {
    custom: 'Start from scratch and build your own custom funnel',
    lead_gen: 'Capture leads with opt-in forms and lead magnets',
    sales: 'Sell products or services with sales pages',
    webinar: 'Host webinars with registration and replay pages',
    product_launch: 'Launch products with pre-launch and sales pages'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-7 h-7" />
            Create New Funnel
          </h2>
          <p className="text-white text-opacity-90 text-sm mt-1">
            {step === 1 ? 'Choose how you want to start' : 'Fill in your funnel details'}
          </p>
        </div>

        {step === 1 ? (
          /* Step 1: Choose Method */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Use Template Option */}
              <div
                onClick={() => {
                  setSelectedMethod('template');
                  onUseTemplate();
                }}
                className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 group-hover:bg-blue-500 rounded-full flex items-center justify-center mb-4 transition">
                    <Layout className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Use a Template</h3>
                  <p className="text-gray-600 text-sm">
                    Start with a professionally designed funnel template and customize it to your needs
                  </p>
                  <div className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg group-hover:bg-blue-600 transition font-medium">
                    Browse Templates
                  </div>
                </div>
              </div>

              {/* Start from Scratch Option */}
              <div
                onClick={() => {
                  setSelectedMethod('blank');
                  setStep(2);
                }}
                className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 group-hover:bg-purple-500 rounded-full flex items-center justify-center mb-4 transition">
                    <Plus className="w-8 h-8 text-purple-600 group-hover:text-white transition" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Start from Scratch</h3>
                  <p className="text-gray-600 text-sm">
                    Create a blank funnel and build it from the ground up with full creative control
                  </p>
                  <div className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg group-hover:bg-purple-600 transition font-medium">
                    Create Blank
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Fill Details */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Funnel Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., Summer Product Launch"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Brief description of what this funnel is for..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Funnel Type
              </label>
              <select
                value={formData.funnel_type}
                onChange={(e) => setFormData({ ...formData, funnel_type: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="custom">Custom Funnel</option>
                <option value="lead_gen">Lead Generation</option>
                <option value="sales">Sales Funnel</option>
                <option value="webinar">Webinar Funnel</option>
                <option value="product_launch">Product Launch</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {funnelTypeDescriptions[formData.funnel_type]}
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Create Funnel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const EditFunnelModal = ({ funnel, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: funnel?.name || '',
    description: funnel?.description || '',
    funnel_type: funnel?.funnel_type || 'custom'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(funnel.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Edit Funnel</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Funnel Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="My Sales Funnel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your funnel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Funnel Type
            </label>
            <select
              value={formData.funnel_type}
              onChange={(e) => setFormData({ ...formData, funnel_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="custom">Custom</option>
              <option value="lead_gen">Lead Generation</option>
              <option value="sales">Sales</option>
              <option value="webinar">Webinar</option>
              <option value="product_launch">Product Launch</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TemplateModal = ({ templates, onClose, onSelect }) => {
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const handleEditTemplate = async (template) => {
    // For funnel templates, we can edit by creating a funnel from template and then editing pages
    alert('Edit functionality: This will create a funnel from this template that you can then edit.');
    onSelect(template.id);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this funnel template?')) {
      return;
    }
    
    try {
      await api.delete(`/api/funnel-templates/${templateId}`);
      alert('Template deleted successfully');
      window.location.reload(); // Refresh templates
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map(template => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative group">
                  {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                  ) : (
                    <Layout className="w-16 h-16 text-white opacity-50" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{template.pages?.length || 0} pages</span>
                  </div>
                  
                  {/* Action Buttons - Always Visible */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                      className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center justify-center gap-2"
                      title="Preview"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(template);
                      }}
                      className="flex-1 px-3 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-lg transition flex items-center justify-center gap-2"
                      title="Edit"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    {!template.is_public && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition flex items-center justify-center gap-1"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simple Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{previewTemplate.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{previewTemplate.description}</p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Template Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Pages:</span>
                        <span className="ml-2 font-medium">{previewTemplate.pages?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium capitalize">{previewTemplate.funnel_type || 'Custom'}</span>
                      </div>
                    </div>
                  </div>
                  {previewTemplate.pages && previewTemplate.pages.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Pages in This Funnel</h4>
                      <div className="space-y-2">
                        {previewTemplate.pages.map((page, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{page.name}</div>
                              <div className="text-sm text-gray-500">{page.path}</div>
                            </div>
                            <div className="text-sm text-gray-500">Step {page.order}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onSelect(previewTemplate.id);
                    setPreviewTemplate(null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TemplatesView = ({ templates, onSelectTemplate, onBack }) => {
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const handleEditTemplate = async (template) => {
    alert('Edit functionality: This will create a funnel from this template that you can then edit.');
    onSelectTemplate(template.id);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this funnel template?')) {
      return;
    }
    
    try {
      await api.delete(`/api/funnel-templates/${templateId}`);
      alert('Template deleted successfully');
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Funnels
        </button>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Funnel Templates</h1>
        <p className="text-gray-600">Choose a pre-built template to get started quickly</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all"
          >
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {template.thumbnail ? (
                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
              ) : (
                <Layout className="w-20 h-20 text-white opacity-50" />
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-gray-600 mb-4">{template.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">{template.pages?.length || 0} pages included</span>
                <span className="text-sm text-gray-500">Used {template.usage_count || 0} times</span>
              </div>
              
              {/* Action Buttons - Always Visible */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(template);
                  }}
                  className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Preview
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTemplate(template);
                  }}
                  className="flex-1 px-3 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Use & Edit
                </button>
                {!template.is_public && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id);
                    }}
                    className="px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{previewTemplate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{previewTemplate.description}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Template Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Pages:</span>
                      <span className="ml-2 font-medium">{previewTemplate.pages?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium capitalize">{previewTemplate.funnel_type || 'Custom'}</span>
                    </div>
                  </div>
                </div>
                {previewTemplate.pages && previewTemplate.pages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Pages in This Funnel</h4>
                    <div className="space-y-2">
                      {previewTemplate.pages.map((page, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{page.name}</div>
                            <div className="text-sm text-gray-500">{page.path}</div>
                          </div>
                          <div className="text-sm text-gray-500">Step {page.order}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectTemplate(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PageBuilderView = ({ 
  funnel, page, blocks, selectedBlock, previewDevice, showBlockLibrary,
  onBack, onSave, onAddBlock, onUpdateBlock, onDeleteBlock, onDuplicateBlock, 
  onDragEnd, onSelectBlock, onPreviewDeviceChange, onToggleBlockLibrary, loading 
}) => {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">{page.name}</h2>
            <p className="text-sm text-gray-500">{funnel.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Device Preview Selector */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => onPreviewDeviceChange('desktop')}
              className={`px-3 py-1 rounded ${previewDevice === 'desktop' ? 'bg-white shadow' : ''}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPreviewDeviceChange('tablet')}
              className={`px-3 py-1 rounded ${previewDevice === 'tablet' ? 'bg-white shadow' : ''}`}
            >
              <Monitor className="w-4 h-4 transform scale-75" />
            </button>
            <button
              onClick={() => onPreviewDeviceChange('mobile')}
              className={`px-3 py-1 rounded ${previewDevice === 'mobile' ? 'bg-white shadow' : ''}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={onSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Block Library Sidebar */}
        {showBlockLibrary && (
          <div className="w-64 bg-white border-r overflow-y-auto p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Add Blocks</h3>
            <div className="space-y-2">
              {Object.keys(defaultBlocks).map(blockType => (
                <button
                  key={blockType}
                  onClick={() => onAddBlock(blockType)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getBlockIcon(blockType)}</span>
                    <span className="text-sm font-medium text-gray-700">{getBlockLabel(blockType)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className={`mx-auto bg-white shadow-lg ${
            previewDevice === 'desktop' ? 'max-w-6xl' :
            previewDevice === 'tablet' ? 'max-w-3xl' :
            'max-w-sm'
          }`}>
            {blocks.length === 0 ? (
              <div className="text-center py-20">
                <Layout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Empty Page</h3>
                <p className="text-gray-600 mb-4">Add blocks to start building your page</p>
                <button
                  onClick={onToggleBlockLibrary}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add First Block
                </button>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="blocks">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {blocks.map((block, index) => (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`group relative ${snapshot.isDragging ? 'opacity-50' : ''} ${
                                selectedBlock?.id === block.id ? 'ring-2 ring-blue-500' : ''
                              }`}
                              onClick={() => onSelectBlock(block)}
                            >
                              <BlockRenderer block={block} />
                              
                              {/* Block Controls */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow-lg rounded p-1">
                                <button
                                  {...provided.dragHandleProps}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <GripVertical className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDuplicateBlock(block.id);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Copy className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteBlock(block.id);
                                  }}
                                  className="p-1 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
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
            )}
          </div>
        </div>

        {/* Block Settings Panel */}
        {selectedBlock && (
          <div className="w-80 bg-white border-l overflow-y-auto p-4">
            <BlockSettingsPanel
              block={selectedBlock}
              onUpdate={(updates) => onUpdateBlock(selectedBlock.id, updates)}
              onClose={() => onSelectBlock(null)}
            />
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="bg-white border-t px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleBlockLibrary}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showBlockLibrary ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Block
          </button>
        </div>
        <div className="text-sm text-gray-600">
          {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
        </div>
      </div>
    </div>
  );
};

const BlockRenderer = ({ block }) => {
  const style = {
    backgroundColor: block.style?.backgroundColor || '#ffffff',
    color: block.style?.textColor || '#000000',
    padding: block.style?.padding || '20px',
    textAlign: block.style?.alignment || 'left'
  };

  switch (block.type) {
    case 'hero':
      return (
        <div style={style} className="min-h-[400px] flex items-center justify-center">
          <div className="max-w-4xl mx-auto text-center">
            <h1 style={{ fontSize: block.style?.headingSize || '48px' }} className="font-bold mb-4">
              {block.content.headline}
            </h1>
            <p style={{ fontSize: block.style?.subheadingSize || '20px' }} className="mb-6">
              {block.content.subheadline}
            </p>
            {block.content.cta_text && (
              <button className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                {block.content.cta_text}
              </button>
            )}
          </div>
        </div>
      );
    
    case 'features':
      return (
        <div style={style}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2">{block.content.title}</h2>
            {block.content.subtitle && (
              <p className="text-center text-gray-600 mb-12">{block.content.subtitle}</p>
            )}
            <div className={`grid grid-cols-1 md:grid-cols-${block.style?.columns || 3} gap-8`}>
              {block.content.features?.map((feature, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    
    case 'form':
      return (
        <div style={style}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2">{block.content.title}</h2>
            {block.content.subtitle && (
              <p className="text-center text-gray-600 mb-8">{block.content.subtitle}</p>
            )}
            <form className="space-y-4">
              {block.content.fields?.map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                style={{ backgroundColor: block.style?.buttonColor || '#3b82f6' }}
                className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90"
              >
                {block.content.submit_text}
              </button>
            </form>
          </div>
        </div>
      );
    
    case 'cta':
      return (
        <div style={style} className="min-h-[300px] flex items-center justify-center">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">{block.content.headline}</h2>
            <p className="text-xl mb-6">{block.content.subheadline}</p>
            <button className="px-8 py-4 bg-white text-gray-900 font-bold rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              {block.content.button_text}
            </button>
            {block.content.secondary_text && (
              <p className="mt-4 text-sm opacity-75">{block.content.secondary_text}</p>
            )}
          </div>
        </div>
      );
    
    case 'pricing':
      return (
        <div style={style}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2">{block.content.title}</h2>
            {block.content.subtitle && (
              <p className="text-center text-gray-600 mb-12">{block.content.subtitle}</p>
            )}
            <div className={`grid grid-cols-1 md:grid-cols-${block.content.plans?.length || 3} gap-8`}>
              {block.content.plans?.map((plan, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-8 ${plan.recommended ? 'border-blue-500 shadow-xl' : 'border-gray-200'}`}
                >
                  {plan.recommended && (
                    <div className="text-center mb-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Recommended
                      </span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features?.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-lg font-semibold ${
                    plan.recommended
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}>
                    {plan.cta_text}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    
    default:
      return (
        <div style={style} className="p-8">
          <div className="text-center text-gray-500">
            {getBlockIcon(block.type)} {getBlockLabel(block.type)}
          </div>
        </div>
      );
  }
};

const BlockSettingsPanel = ({ block, onUpdate, onClose }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Block Settings</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Block Type
          </label>
          <div className="text-sm text-gray-600">{getBlockLabel(block.type)}</div>
        </div>

        {/* Style Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Background Color
          </label>
          <input
            type="color"
            value={block.style?.backgroundColor || '#ffffff'}
            onChange={(e) => onUpdate({
              style: { ...block.style, backgroundColor: e.target.value }
            })}
            className="w-full h-10 rounded border border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text Color
          </label>
          <input
            type="color"
            value={block.style?.textColor || '#000000'}
            onChange={(e) => onUpdate({
              style: { ...block.style, textColor: e.target.value }
            })}
            className="w-full h-10 rounded border border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Padding
          </label>
          <input
            type="text"
            value={block.style?.padding || '20px'}
            onChange={(e) => onUpdate({
              style: { ...block.style, padding: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 20px or 20px 40px"
          />
        </div>

        {block.type === 'hero' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Headline
              </label>
              <input
                type="text"
                value={block.content.headline}
                onChange={(e) => onUpdate({
                  content: { ...block.content, headline: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subheadline
              </label>
              <textarea
                value={block.content.subheadline}
                onChange={(e) => onUpdate({
                  content: { ...block.content, subheadline: e.target.value }
                })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={block.content.cta_text}
                onChange={(e) => onUpdate({
                  content: { ...block.content, cta_text: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Add more type-specific settings as needed */}
      </div>
    </div>
  );
};

export default Funnels;
