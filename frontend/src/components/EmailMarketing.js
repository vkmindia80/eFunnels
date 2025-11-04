import React, { useState, useEffect } from 'react';
import { 
  Mail, Plus, Send, Eye, Trash2, Copy, Settings, 
  Edit, ArrowLeft, Users, Calendar, BarChart2,
  Check, Search, Layout, TrendingUp, MousePointer,
  ChevronRight, Clock, Sparkles
} from 'lucide-react';
import api from '../api';
import EmailBuilder from './EmailBuilder/EmailBuilder';

// Email Marketing Main Page
const EmailMarketingPage = () => {
  const [activeView, setActiveView] = useState('campaigns');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Email Marketing</h2>
          <p className="text-gray-600 mt-1">Create, send, and track email campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          {activeView === 'campaigns' && (
            <button 
              onClick={() => setActiveView('create-campaign')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
              data-testid="new-campaign-btn"
            >
              <Plus size={20} />
              New Campaign
            </button>
          )}
          {activeView === 'templates' && (
            <button 
              onClick={() => setActiveView('create-template')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
              data-testid="new-template-btn"
            >
              <Plus size={20} />
              New Template
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'campaigns', label: 'Campaigns', icon: Mail },
            { id: 'templates', label: 'Templates', icon: Layout },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                activeView === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeView === 'campaigns' && <CampaignsView onCreateNew={() => setActiveView('create-campaign')} />}
      {activeView === 'templates' && <TemplatesView onCreateNew={() => setActiveView('create-template')} />}
      {activeView === 'analytics' && <AnalyticsView />}
      {activeView === 'settings' && <EmailSettingsView />}
      {activeView === 'create-campaign' && <CreateCampaignWizard onBack={() => setActiveView('campaigns')} />}
      {activeView === 'create-template' && <EmailBuilder onBack={() => setActiveView('templates')} isTemplate={true} />}
    </div>
  );
};

// Campaigns List View (keeping existing implementation)
const CampaignsView = ({ onCreateNew }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadCampaigns();
  }, [statusFilter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/api/email/campaigns', { params });
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/api/email/campaigns/${id}`);
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800',
    };
    return badges[status] || badges.draft;
  };

  if (loading) {
    return <div className="text-center py-12" data-testid="campaigns-loading">Loading campaigns...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="campaigns-search"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="campaigns-filter"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="sending">Sending</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center" data-testid="campaigns-empty">
          <Mail className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-600 mb-6">Create your first email campaign to get started</p>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
            data-testid="create-first-campaign-btn"
          >
            <Plus size={20} />
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="campaigns-grid">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition" data-testid={`campaign-card-${campaign.id}`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{campaign.subject}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span>{campaign.total_recipients || 0} recipients</span>
                  </div>
                  {campaign.sent_at && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Sent {new Date(campaign.sent_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {campaign.status === 'sent' && (
                  <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{campaign.total_sent || 0}</div>
                      <div className="text-xs text-gray-600">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {campaign.total_sent > 0 ? Math.round((campaign.total_opened / campaign.total_sent) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-600">Opened</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {campaign.total_opened > 0 ? Math.round((campaign.total_clicked / campaign.total_opened) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-600">Clicked</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium" data-testid={`view-campaign-${campaign.id}`}>
                    <Eye size={16} className="inline mr-2" />
                    View
                  </button>
                  {campaign.status === 'draft' && (
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium" data-testid={`send-campaign-${campaign.id}`}>
                      <Send size={16} className="inline mr-2" />
                      Send
                    </button>
                  )}
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                    data-testid={`delete-campaign-${campaign.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Templates View (keeping existing)
const TemplatesView = ({ onCreateNew }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/email/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/api/email/templates/${id}`);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center" data-testid="templates-empty">
          <Layout className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-6">Create reusable email templates to speed up your workflow</p>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
            data-testid="create-first-template-btn"
          >
            <Plus size={20} />
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden" data-testid={`template-card-${template.id}`}>
              <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center border-b border-gray-200">
                {template.thumbnail ? (
                  <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                  <Layout size={48} className="text-gray-400" />
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.subject}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span className="px-2 py-1 bg-gray-100 rounded">{template.category}</span>
                  <span>{template.usage_count || 0} uses</span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium" data-testid={`edit-template-${template.id}`}>
                    <Edit size={14} className="inline mr-1" />
                    Edit
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition" data-testid={`copy-template-${template.id}`}>
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                    data-testid={`delete-template-${template.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 5-Step Campaign Creation Wizard
const CreateCampaignWizard = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    preview_text: '',
    from_name: '',
    from_email: '',
    reply_to: '',
    recipient_type: 'all',
    recipient_list: [],
    content: { blocks: [] },
    schedule_type: 'immediate',
    scheduled_at: '',
    enable_ab_test: false,
  });
  const [contacts, setContacts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailBuilder, setShowEmailBuilder] = useState(false);

  const steps = [
    { num: 1, title: 'Campaign Details', icon: Edit },
    { num: 2, title: 'Select Recipients', icon: Users },
    { num: 3, title: 'Design Email', icon: Layout },
    { num: 4, title: 'Schedule', icon: Calendar },
    { num: 5, title: 'Review & Send', icon: Send },
  ];

  // Load contacts and segments
  useEffect(() => {
    loadContactsAndSegments();
  }, []);

  const loadContactsAndSegments = async () => {
    try {
      const [contactsRes, segmentsRes] = await Promise.all([
        api.get('/api/contacts'),
        api.get('/api/segments'),
      ]);
      setContacts(contactsRes.data.contacts || []);
      setSegments(segmentsRes.data || []);
    } catch (error) {
      console.error('Error loading contacts/segments:', error);
    }
  };

  const updateCampaignData = (field, value) => {
    setCampaignData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!campaignData.name || !campaignData.subject || !campaignData.from_name || !campaignData.from_email) {
          alert('Please fill in all required fields');
          return false;
        }
        return true;
      case 2:
        if (campaignData.recipient_type !== 'all' && campaignData.recipient_list.length === 0) {
          alert('Please select at least one recipient');
          return false;
        }
        return true;
      case 3:
        if (!campaignData.content || !campaignData.content.blocks || campaignData.content.blocks.length === 0) {
          alert('Please design your email');
          return false;
        }
        return true;
      case 4:
        if (campaignData.schedule_type === 'scheduled' && !campaignData.scheduled_at) {
          alert('Please select a date and time');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Create campaign
      await api.post('/api/email/campaigns', campaignData);
      
      alert('Campaign created successfully!');
      onBack();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTest = async () => {
    try {
      const testEmail = prompt('Enter email address to send test to:');
      if (!testEmail) return;

      await api.post(`/api/email/campaigns/test`, {
        to_email: testEmail,
        subject: campaignData.subject,
        content: campaignData.content,
        from_name: campaignData.from_name,
        from_email: campaignData.from_email,
      });

      alert(`Test email sent to ${testEmail}!`);
    } catch (error) {
      console.error('Error sending test:', error);
      alert('Failed to send test email');
    }
  };

  const handleAISubject = async () => {
    try {
      const res = await api.post('/api/email/ai/improve-subject', {
        subject: campaignData.subject || 'Amazing offer',
        tone: 'professional',
      });
      
      if (res.data.alternatives && res.data.alternatives.length > 0) {
        const selected = res.data.alternatives[0];
        updateCampaignData('subject', selected);
      }
    } catch (error) {
      console.error('AI subject generation failed:', error);
    }
  };

  // If email builder is open, show it fullscreen
  if (showEmailBuilder) {
    return (
      <EmailBuilder
        onBack={() => setShowEmailBuilder(false)}
        initialData={campaignData.content.blocks.length > 0 ? campaignData : null}
        isTemplate={false}
        onSave={(emailData) => {
          updateCampaignData('name', emailData.name);
          updateCampaignData('subject', emailData.subject);
          updateCampaignData('content', emailData.content);
          setShowEmailBuilder(false);
        }}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition" data-testid="wizard-back-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Campaign</h2>
          <p className="text-gray-600">Step {currentStep} of {steps.length}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            
            return (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                    data-testid={`step-indicator-${step.num}`}
                  >
                    {isCompleted ? <Check size={24} /> : <StepIcon size={24} />}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Step 1: Campaign Details */}
        {currentStep === 1 && (
          <div className="space-y-6" data-testid="step-1-content">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
              <p className="text-gray-600 mb-6">Enter basic information about your campaign</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => updateCampaignData('name', e.target.value)}
                  placeholder="e.g., Summer Sale 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="campaign-name-input"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <span>Email Subject <span className="text-red-500">*</span></span>
                  <button
                    onClick={handleAISubject}
                    className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700"
                  >
                    <Sparkles size={14} />
                    AI Improve
                  </button>
                </label>
                <input
                  type="text"
                  value={campaignData.subject}
                  onChange={(e) => updateCampaignData('subject', e.target.value)}
                  placeholder="e.g., 🔥 50% Off Everything - Limited Time!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="campaign-subject-input"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Text (optional)
                </label>
                <input
                  type="text"
                  value={campaignData.preview_text}
                  onChange={(e) => updateCampaignData('preview_text', e.target.value)}
                  placeholder="Text shown in email preview..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="campaign-preview-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={campaignData.from_name}
                  onChange={(e) => updateCampaignData('from_name', e.target.value)}
                  placeholder="e.g., John from eFunnels"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="from-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={campaignData.from_email}
                  onChange={(e) => updateCampaignData('from_email', e.target.value)}
                  placeholder="e.g., hello@efunnels.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="from-email-input"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reply-To Email (optional)
                </label>
                <input
                  type="email"
                  value={campaignData.reply_to}
                  onChange={(e) => updateCampaignData('reply_to', e.target.value)}
                  placeholder="e.g., support@efunnels.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="reply-to-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Recipients */}
        {currentStep === 2 && (
          <div className="space-y-6" data-testid="step-2-content">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Recipients</h3>
              <p className="text-gray-600 mb-6">Choose who will receive this campaign</p>
            </div>

            <div className="space-y-4">
              {/* All Contacts */}
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input
                  type="radio"
                  name="recipient_type"
                  value="all"
                  checked={campaignData.recipient_type === 'all'}
                  onChange={(e) => {
                    updateCampaignData('recipient_type', e.target.value);
                    updateCampaignData('recipient_list', []);
                  }}
                  className="mt-1"
                  data-testid="recipient-all"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">All Contacts</div>
                  <div className="text-sm text-gray-600">Send to all contacts in your database ({contacts.length} contacts)</div>
                </div>
              </label>

              {/* Specific Contacts */}
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input
                  type="radio"
                  name="recipient_type"
                  value="contacts"
                  checked={campaignData.recipient_type === 'contacts'}
                  onChange={(e) => updateCampaignData('recipient_type', e.target.value)}
                  className="mt-1"
                  data-testid="recipient-contacts"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Specific Contacts</div>
                  <div className="text-sm text-gray-600 mb-3">Choose individual contacts</div>
                  
                  {campaignData.recipient_type === 'contacts' && (
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                      {contacts.map((contact) => (
                        <label key={contact.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={campaignData.recipient_list.includes(contact.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateCampaignData('recipient_list', [...campaignData.recipient_list, contact.id]);
                              } else {
                                updateCampaignData('recipient_list', campaignData.recipient_list.filter(id => id !== contact.id));
                              }
                            }}
                            data-testid={`contact-${contact.id}`}
                          />
                          <span className="text-sm">
                            {contact.first_name} {contact.last_name} ({contact.email})
                          </span>
                        </label>
                      ))}
                      {contacts.length === 0 && (
                        <div className="text-center text-gray-500 py-4">No contacts available</div>
                      )}
                    </div>
                  )}
                </div>
              </label>

              {/* Segments */}
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input
                  type="radio"
                  name="recipient_type"
                  value="segments"
                  checked={campaignData.recipient_type === 'segments'}
                  onChange={(e) => updateCampaignData('recipient_type', e.target.value)}
                  className="mt-1"
                  data-testid="recipient-segments"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Segments</div>
                  <div className="text-sm text-gray-600 mb-3">Send to specific segments/lists</div>
                  
                  {campaignData.recipient_type === 'segments' && (
                    <div className="space-y-2">
                      {segments.map((segment) => (
                        <label key={segment.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={campaignData.recipient_list.includes(segment.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateCampaignData('recipient_list', [...campaignData.recipient_list, segment.id]);
                              } else {
                                updateCampaignData('recipient_list', campaignData.recipient_list.filter(id => id !== segment.id));
                              }
                            }}
                            data-testid={`segment-${segment.id}`}
                          />
                          <span className="text-sm font-medium">{segment.name}</span>
                          <span className="text-xs text-gray-500">({segment.contact_count || 0} contacts)</span>
                        </label>
                      ))}
                      {segments.length === 0 && (
                        <div className="text-center text-gray-500 py-4">No segments available</div>
                      )}
                    </div>
                  )}
                </div>
              </label>

              {/* Recipient Count */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-900">
                  <Users size={18} />
                  <span className="font-medium">
                    Estimated Recipients: {
                      campaignData.recipient_type === 'all' 
                        ? contacts.length
                        : campaignData.recipient_list.length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Design Email */}
        {currentStep === 3 && (
          <div className="space-y-6" data-testid="step-3-content">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Your Email</h3>
              <p className="text-gray-600 mb-6">Use our visual email builder to create your campaign</p>
            </div>

            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              {campaignData.content.blocks && campaignData.content.blocks.length > 0 ? (
                <div>
                  <Check size={48} className="mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Design Complete</h3>
                  <p className="text-gray-600 mb-4">{campaignData.content.blocks.length} blocks added</p>
                  <button
                    onClick={() => setShowEmailBuilder(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
                    data-testid="edit-email-btn"
                  >
                    <Edit size={20} />
                    Edit Email Design
                  </button>
                </div>
              ) : (
                <div>
                  <Layout size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Designing</h3>
                  <p className="text-gray-600 mb-4">Open the email builder to create your campaign</p>
                  <button
                    onClick={() => setShowEmailBuilder(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
                    data-testid="open-email-builder-btn"
                  >
                    <Layout size={20} />
                    Open Email Builder
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Schedule */}
        {currentStep === 4 && (
          <div className="space-y-6" data-testid="step-4-content">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Campaign</h3>
              <p className="text-gray-600 mb-6">Choose when to send your campaign</p>
            </div>

            <div className="space-y-4">
              {/* Send Immediately */}
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input
                  type="radio"
                  name="schedule_type"
                  value="immediate"
                  checked={campaignData.schedule_type === 'immediate'}
                  onChange={(e) => updateCampaignData('schedule_type', e.target.value)}
                  className="mt-1"
                  data-testid="schedule-immediate"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900 mb-1">
                    <Send size={18} />
                    Send Immediately
                  </div>
                  <div className="text-sm text-gray-600">Campaign will be sent as soon as you confirm</div>
                </div>
              </label>

              {/* Schedule for Later */}
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input
                  type="radio"
                  name="schedule_type"
                  value="scheduled"
                  checked={campaignData.schedule_type === 'scheduled'}
                  onChange={(e) => updateCampaignData('schedule_type', e.target.value)}
                  className="mt-1"
                  data-testid="schedule-later"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900 mb-1">
                    <Clock size={18} />
                    Schedule for Later
                  </div>
                  <div className="text-sm text-gray-600 mb-3">Choose a specific date and time</div>
                  
                  {campaignData.schedule_type === 'scheduled' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={campaignData.scheduled_at}
                          onChange={(e) => updateCampaignData('scheduled_at', e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          data-testid="scheduled-datetime-input"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Campaign will be sent at the specified time in your local timezone
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Review & Send */}
        {currentStep === 5 && (
          <div className="space-y-6" data-testid="step-5-content">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Send</h3>
              <p className="text-gray-600 mb-6">Review your campaign before sending</p>
            </div>

            <div className="space-y-4">
              {/* Campaign Summary */}
              <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Campaign Name</div>
                    <div className="font-medium text-gray-900">{campaignData.name}</div>
                  </div>
                  <button onClick={() => setCurrentStep(1)} className="text-blue-600 text-sm hover:underline">Edit</button>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Email Subject</div>
                    <div className="font-medium text-gray-900">{campaignData.subject}</div>
                  </div>
                  <button onClick={() => setCurrentStep(1)} className="text-blue-600 text-sm hover:underline">Edit</button>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-600">From</div>
                    <div className="font-medium text-gray-900">{campaignData.from_name} &lt;{campaignData.from_email}&gt;</div>
                  </div>
                  <button onClick={() => setCurrentStep(1)} className="text-blue-600 text-sm hover:underline">Edit</button>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Recipients</div>
                    <div className="font-medium text-gray-900">
                      {campaignData.recipient_type === 'all' ? 'All Contacts' : `${campaignData.recipient_list.length} selected`}
                      {' '}(~{campaignData.recipient_type === 'all' ? contacts.length : campaignData.recipient_list.length} recipients)
                    </div>
                  </div>
                  <button onClick={() => setCurrentStep(2)} className="text-blue-600 text-sm hover:underline">Edit</button>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Email Design</div>
                    <div className="font-medium text-gray-900">{campaignData.content.blocks.length} blocks</div>
                  </div>
                  <button onClick={() => setCurrentStep(3)} className="text-blue-600 text-sm hover:underline">Edit</button>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Schedule</div>
                    <div className="font-medium text-gray-900">
                      {campaignData.schedule_type === 'immediate' 
                        ? 'Send Immediately' 
                        : `Scheduled for ${new Date(campaignData.scheduled_at).toLocaleString()}`
                      }
                    </div>
                  </div>
                  <button onClick={() => setCurrentStep(4)} className="text-blue-600 text-sm hover:underline">Edit</button>
                </div>
              </div>

              {/* Test Email */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-2">Send Test Email</h4>
                <p className="text-sm text-gray-600 mb-4">Send a test email to yourself before sending to all recipients</p>
                <button
                  onClick={handleSendTest}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                  data-testid="send-test-email-btn"
                >
                  Send Test Email
                </button>
              </div>

              {/* Final Confirmation */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="text-yellow-600 mt-0.5">⚠️</div>
                  <div className="flex-1">
                    <div className="font-medium text-yellow-900 mb-1">Ready to send?</div>
                    <div className="text-sm text-yellow-800">
                      Once you click "Create Campaign", your campaign will be {campaignData.schedule_type === 'immediate' ? 'sent immediately' : 'scheduled for the specified time'}.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div>
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
              data-testid="wizard-prev-btn"
            >
              <ArrowLeft size={18} />
              Previous
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
              data-testid="wizard-next-btn"
            >
              Next Step
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2 disabled:opacity-50"
              data-testid="wizard-submit-btn"
            >
              {isSubmitting ? (
                <>Creating...</>
              ) : (
                <>
                  <Send size={18} />
                  {campaignData.schedule_type === 'immediate' ? 'Create & Send Campaign' : 'Create Campaign'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Analytics View and Email Settings View (keeping from original)
const AnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/email/analytics/summary');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set default analytics on error
      setAnalytics({
        total_campaigns: 0,
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_bounced: 0,
        avg_open_rate: 0,
        avg_click_rate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return <div className="text-center py-12" data-testid="analytics-loading">Loading analytics...</div>;
  }

  // Safe access with defaults
  const totalCampaigns = analytics.total_campaigns || 0;
  const totalSent = analytics.total_sent || 0;
  const totalDelivered = analytics.total_delivered || 0;
  const totalOpened = analytics.total_opened || 0;
  const totalClicked = analytics.total_clicked || 0;
  const totalBounced = analytics.total_bounced || 0;
  const avgOpenRate = analytics.avg_open_rate || 0;
  const avgClickRate = analytics.avg_click_rate || 0;

  return (
    <div className="space-y-6" data-testid="analytics-view">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Campaigns</div>
            <Mail size={20} className="text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalCampaigns}</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Emails Sent</div>
            <Send size={20} className="text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalSent.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Open Rate</div>
            <TrendingUp size={20} className="text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{avgOpenRate.toFixed(1)}%</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Click Rate</div>
            <MousePointer size={20} className="text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{avgClickRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Delivery Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Metrics</h3>
        <div className="space-y-4">
          {[
            { label: 'Delivered', value: totalDelivered, total: totalSent, color: 'bg-green-500' },
            { label: 'Opened', value: totalOpened, total: totalSent, color: 'bg-blue-500' },
            { label: 'Clicked', value: totalClicked, total: totalSent, color: 'bg-purple-500' },
            { label: 'Bounced', value: totalBounced, total: totalSent, color: 'bg-red-500' },
          ].map((metric) => {
            const percentage = totalSent > 0 ? (metric.value / totalSent) * 100 : 0;
            return (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <span className="text-sm text-gray-600">
                    {metric.value.toLocaleString()} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${metric.color} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const EmailSettingsView = () => {
  const [settings, setSettings] = useState({
    provider: 'mock',
    sendgrid_api_key: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_use_tls: true,
    aws_ses_access_key: '',
    aws_ses_secret_key: '',
    aws_ses_region: 'us-east-1',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/email/settings');
      if (response.data) {
        setSettings({ ...settings, ...response.data });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/api/email/settings', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Provider</h3>
        <p className="text-gray-600 mb-6">Choose your email sending provider</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { value: 'mock', label: 'Mock', icon: '🧪', desc: 'For testing (no emails sent)' },
            { value: 'sendgrid', label: 'SendGrid', icon: '📧', desc: 'Reliable email delivery' },
            { value: 'smtp', label: 'SMTP', icon: '🔧', desc: 'Custom SMTP server' },
            { value: 'aws_ses', label: 'AWS SES', icon: '☁️', desc: 'Amazon email service' },
          ].map((provider) => (
            <label
              key={provider.value}
              className={`flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition ${
                settings.provider === provider.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name="provider"
                value={provider.value}
                checked={settings.provider === provider.value}
                onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                className="sr-only"
              />
              <div className="text-4xl mb-2">{provider.icon}</div>
              <div className="font-semibold text-gray-900 mb-1">{provider.label}</div>
              <div className="text-xs text-gray-600 text-center">{provider.desc}</div>
            </label>
          ))}
        </div>

        {/* Provider-specific settings */}
        {settings.provider === 'sendgrid' && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SendGrid API Key</label>
              <input
                type="password"
                value={settings.sendgrid_api_key}
                onChange={(e) => setSettings({ ...settings, sendgrid_api_key: e.target.value })}
                placeholder="SG.xxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {settings.provider === 'smtp' && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  placeholder="smtp.example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                <input
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                  placeholder="587"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={settings.smtp_username}
                  onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={settings.smtp_password}
                  onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.smtp_use_tls}
                onChange={(e) => setSettings({ ...settings, smtp_use_tls: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Use TLS</span>
            </label>
          </div>
        )}

        {settings.provider === 'aws_ses' && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AWS Access Key</label>
                <input
                  type="password"
                  value={settings.aws_ses_access_key}
                  onChange={(e) => setSettings({ ...settings, aws_ses_access_key: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AWS Secret Key</label>
                <input
                  type="password"
                  value={settings.aws_ses_secret_key}
                  onChange={(e) => setSettings({ ...settings, aws_ses_secret_key: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AWS Region</label>
                <select
                  value={settings.aws_ses_region}
                  onChange={(e) => setSettings({ ...settings, aws_ses_region: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="eu-central-1">EU (Frankfurt)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailMarketingPage;
