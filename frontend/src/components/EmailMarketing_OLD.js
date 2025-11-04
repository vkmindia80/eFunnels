import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, Plus, Send, Save, Eye, Trash2, Copy, Settings, 
  Image, Type, Square, Minus, Columns, List, ChevronDown,
  Edit, ArrowLeft, Users, Calendar, BarChart2, Sparkles,
  Check, X, Play, Pause, Archive, Search, Filter, Download,
  Upload, Tag, Layout, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Link, Code, Smartphone, Monitor,
  ChevronUp, GripVertical, Palette, MoreVertical, Clock,
  TrendingUp, MousePointer, ExternalLink, Undo, Redo
} from 'lucide-react';
import api from '../api';

// Email Marketing Main Page
const EmailMarketingPage = () => {
  const [activeView, setActiveView] = useState('campaigns'); // campaigns, templates, settings, analytics
  
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
            >
              <Plus size={20} />
              New Campaign
            </button>
          )}
          {activeView === 'templates' && (
            <button 
              onClick={() => setActiveView('create-template')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
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
      {activeView === 'create-template' && <EmailEditorView onBack={() => setActiveView('templates')} isTemplate={true} />}
    </div>
  );
};

// Campaigns List View
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
    return <div className="text-center py-12">Loading campaigns...</div>;
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
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Mail className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-600 mb-6">Create your first email campaign to get started</p>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
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
                  <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                    <Eye size={16} className="inline mr-2" />
                    View
                  </button>
                  {campaign.status === 'draft' && (
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                      <Send size={16} className="inline mr-2" />
                      Send
                    </button>
                  )}
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
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

// Templates View
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Layout className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-6">Create reusable email templates to speed up your workflow</p>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
              {/* Template Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center border-b border-gray-200">
                {template.thumbnail ? (
                  <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                  <Layout size={48} className="text-gray-400" />
                )}
              </div>

              {/* Template Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.subject}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span className="px-2 py-1 bg-gray-100 rounded">{template.category}</span>
                  <span>{template.usage_count || 0} uses</span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                    <Edit size={14} className="inline mr-1" />
                    Edit
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
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

// Analytics View
const AnalyticsView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/email/analytics/summary');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Campaigns', value: stats?.total_campaigns || 0, icon: Mail, color: 'bg-blue-500' },
          { label: 'Emails Sent', value: stats?.total_sent || 0, icon: Send, color: 'bg-green-500' },
          { label: 'Open Rate', value: `${stats?.open_rate || 0}%`, icon: Eye, color: 'bg-purple-500' },
          { label: 'Click Rate', value: `${stats?.click_rate || 0}%`, icon: MousePointer, color: 'bg-orange-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'Delivered', value: stats?.total_delivered || 0, percent: stats?.delivery_rate || 0 },
              { label: 'Opened', value: stats?.total_opened || 0, percent: stats?.open_rate || 0 },
              { label: 'Clicked', value: stats?.total_clicked || 0, percent: stats?.click_rate || 0 },
            ].map((metric, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <span className="text-sm font-medium text-gray-900">{metric.value} ({metric.percent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${metric.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Sent Campaigns</span>
              <span className="text-sm font-medium text-gray-900">{stats?.sent_campaigns || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Sent</span>
              <span className="text-sm font-medium text-gray-900">{stats?.total_sent || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Delivery Rate</span>
              <span className="text-sm font-medium text-green-600">{stats?.delivery_rate || 0}%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Avg. Open Rate</span>
              <span className="text-sm font-medium text-blue-600">{stats?.open_rate || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Email Settings View
const EmailSettingsView = () => {
  const [settings, setSettings] = useState({
    provider: 'mock',
    from_email: '',
    sendgrid_api_key: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    aws_access_key_id: '',
    aws_secret_access_key: '',
    aws_region: 'us-east-1',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/email/settings');
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      await api.put('/api/email/settings', settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving settings: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      {/* Provider Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { id: 'mock', name: 'Mock (Testing)', icon: '🧪' },
            { id: 'sendgrid', name: 'SendGrid', icon: '📧' },
            { id: 'smtp', name: 'Custom SMTP', icon: '🔧' },
            { id: 'aws_ses', name: 'AWS SES', icon: '☁️' },
          ].map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSettings({ ...settings, provider: provider.id })}
              className={`p-4 border-2 rounded-lg transition ${
                settings.provider === provider.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{provider.icon}</div>
              <div className="font-medium text-sm">{provider.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Provider-specific Configuration */}
      {settings.provider === 'sendgrid' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SendGrid Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="password"
                value={settings.sendgrid_api_key}
                onChange={(e) => setSettings({ ...settings, sendgrid_api_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="SG.xxxxxxxxxxxxxxxx"
              />
            </div>
          </div>
        </div>
      )}

      {settings.provider === 'smtp' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SMTP Configuration</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                <input
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={settings.smtp_username}
                onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={settings.smtp_password}
                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {settings.provider === 'aws_ses' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AWS SES Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AWS Access Key ID</label>
              <input
                type="text"
                value={settings.aws_access_key_id}
                onChange={(e) => setSettings({ ...settings, aws_access_key_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AWS Secret Access Key</label>
              <input
                type="password"
                value={settings.aws_secret_access_key}
                onChange={(e) => setSettings({ ...settings, aws_secret_access_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AWS Region</label>
              <select
                value={settings.aws_region}
                onChange={(e) => setSettings({ ...settings, aws_region: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">EU (Ireland)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

// Campaign Creation Wizard (placeholder - will be expanded)
const CreateCampaignWizard = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    from_name: '',
    from_email: '',
    recipient_type: 'all',
    recipient_list: [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Campaign</h2>
          <p className="text-gray-600">Step {step} of 4</p>
        </div>
      </div>

      {/* Wizard steps will go here */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Campaign wizard coming in next iteration...</p>
        <p className="text-sm text-gray-500 mt-2">Will include: Name → Recipients → Design → Schedule → Review</p>
      </div>
    </div>
  );
};

// Email Editor View (placeholder - will be expanded with advanced drag-drop)
const EmailEditorView = ({ onBack, isTemplate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isTemplate ? 'Create Template' : 'Design Email'}
          </h2>
          <p className="text-gray-600">Advanced drag-drop email builder</p>
        </div>
      </div>

      {/* Advanced email editor will go here */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Layout className="mx-auto text-gray-400 mb-4" size={64} />
        <p className="text-gray-600 text-lg mb-2">Advanced Email Builder</p>
        <p className="text-sm text-gray-500">Coming in next iteration with full drag-drop capabilities</p>
      </div>
    </div>
  );
};

export default EmailMarketingPage;
