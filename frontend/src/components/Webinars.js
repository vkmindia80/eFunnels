import React, { useState, useEffect } from 'react';
import {
  Video, Calendar, Users, MessageSquare, HelpCircle, BarChart3,
  Plus, Edit, Trash2, Play, Square, Eye, Download, Send, ThumbsUp,
  Clock, TrendingUp, CheckCircle, X, Settings, MoreVertical, Upload,
  ExternalLink, Copy, Mail, User, Phone, Building
} from 'lucide-react';
import api from '../api';

const Webinars = () => {
  const [activeTab, setActiveTab] = useState('webinars'); // webinars, upcoming, recordings, analytics
  const [webinars, setWebinars] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWebinarView, setShowWebinarView] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [showRecordingModal, setShowRecordingModal] = useState(null);

  useEffect(() => {
    fetchWebinars();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'recordings') {
      fetchAllRecordings();
    }
  }, [activeTab]);

  const fetchWebinars = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/webinars');
      setWebinars(response.data.webinars || []);
    } catch (error) {
      console.error('Error fetching webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/api/webinars/analytics/summary');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchAllRecordings = async () => {
    try {
      setLoading(true);
      // Fetch recordings for all webinars
      const allRecordings = [];
      for (const webinar of webinars) {
        const response = await api.get(`/api/webinars/${webinar.id}/recordings`);
        if (response.data.recordings) {
          allRecordings.push(...response.data.recordings.map(r => ({
            ...r,
            webinar_title: webinar.title
          })));
        }
      }
      setRecordings(allRecordings);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      live: 'bg-green-100 text-green-700 animate-pulse',
      ended: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.draft;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const handleDeleteWebinar = async (webinarId) => {
    if (!window.confirm('Are you sure you want to delete this webinar?')) return;
    
    try {
      await api.delete(`/api/webinars/${webinarId}`);
      fetchWebinars();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting webinar:', error);
      alert('Failed to delete webinar');
    }
  };

  if (showWebinarView) {
    return <WebinarLiveView webinar={showWebinarView} onClose={() => setShowWebinarView(null)} />;
  }

  return (
    <div className="p-6" data-testid="webinars-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Video className="text-blue-600" size={32} />
              Webinars
            </h1>
            <p className="mt-2 text-gray-600">Create and manage live webinars</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            data-testid="create-webinar-btn"
          >
            <Plus size={20} />
            Create Webinar
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Webinars</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.total_webinars}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Video className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.upcoming_webinars}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Registrations</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.total_registrations}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.average_attendance_rate}%</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('webinars')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'webinars'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Webinars
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'upcoming'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('recordings')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'recordings'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Recordings
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'analytics'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      {activeTab === 'webinars' && (
        <WebinarsList
          webinars={webinars}
          onDelete={handleDeleteWebinar}
          onView={setShowWebinarView}
          onEdit={setSelectedWebinar}
          loading={loading}
        />
      )}

      {activeTab === 'upcoming' && (
        <WebinarsList
          webinars={webinars.filter(w => w.status === 'scheduled' && new Date(w.scheduled_at) > new Date())}
          onDelete={handleDeleteWebinar}
          onView={setShowWebinarView}
          onEdit={setSelectedWebinar}
          loading={loading}
        />
      )}

      {activeTab === 'recordings' && (
        <RecordingsPanel
          webinars={webinars}
          recordings={recordings}
          onRefresh={fetchAllRecordings}
          onAddRecording={setShowRecordingModal}
          loading={loading}
        />
      )}

      {activeTab === 'analytics' && (
        <WebinarAnalytics webinars={webinars} />
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || selectedWebinar) && (
        <CreateWebinarModal
          webinar={selectedWebinar}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedWebinar(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setSelectedWebinar(null);
            fetchWebinars();
            fetchAnalytics();
          }}
        />
      )}
    </div>
  );
};

const WebinarsList = ({ webinars, onDelete, onView, onEdit, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (webinars.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Video className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No webinars yet</h3>
        <p className="text-gray-600">Create your first webinar to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {webinars.map((webinar) => (
        <WebinarCard
          key={webinar.id}
          webinar={webinar}
          onDelete={onDelete}
          onView={onView}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

const WebinarCard = ({ webinar, onDelete, onView, onEdit }) => {
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      live: 'bg-green-100 text-green-700 animate-pulse',
      ended: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.draft;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
      {/* Thumbnail */}
      <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 relative">
        {webinar.thumbnail_url ? (
          <img src={webinar.thumbnail_url} alt={webinar.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Video className="text-white opacity-50" size={48} />
          </div>
        )}
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(webinar.status)}`}>
          {webinar.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{webinar.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>{formatDate(webinar.scheduled_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>{webinar.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} />
            <span>{webinar.registration_count} registered</span>
          </div>
        </div>

        {/* Presenter */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="text-blue-600" size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{webinar.presenter_name}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {webinar.status === 'live' && (
            <button
              onClick={() => onView(webinar)}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              <Play size={16} />
              Join Live
            </button>
          )}
          {webinar.status === 'scheduled' && (
            <button
              onClick={() => onView(webinar)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Eye size={16} />
              View
            </button>
          )}
          {(webinar.status === 'draft' || webinar.status === 'ended') && (
            <button
              onClick={() => onEdit(webinar)}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              <Edit size={16} />
              Edit
            </button>
          )}
          <button
            onClick={() => onDelete(webinar.id)}
            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateWebinarModal = ({ webinar, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: webinar?.title || '',
    description: webinar?.description || '',
    scheduled_at: webinar?.scheduled_at ? new Date(webinar.scheduled_at).toISOString().slice(0, 16) : '',
    duration_minutes: webinar?.duration_minutes || 60,
    timezone: webinar?.timezone || 'UTC',
    max_attendees: webinar?.max_attendees || '',
    presenter_name: webinar?.presenter_name || '',
    presenter_bio: webinar?.presenter_bio || '',
    presenter_avatar: webinar?.presenter_avatar || '',
    thumbnail_url: webinar?.thumbnail_url || '',
    registration_required: webinar?.registration_required ?? true,
    send_reminders: webinar?.send_reminders ?? true
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        duration_minutes: parseInt(formData.duration_minutes)
      };

      if (webinar) {
        await api.put(`/api/webinars/${webinar.id}`, payload);
      } else {
        await api.post('/api/webinars', payload);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving webinar:', error);
      alert('Failed to save webinar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {webinar ? 'Edit Webinar' : 'Create New Webinar'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webinar Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Master Digital Marketing in 2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what attendees will learn..."
            />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="15"
                step="15"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Attendees (optional)
              </label>
              <input
                type="number"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
          </div>

          {/* Presenter Info */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Presenter Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presenter Name *
                </label>
                <input
                  type="text"
                  value={formData.presenter_name}
                  onChange={(e) => setFormData({ ...formData, presenter_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presenter Bio
                </label>
                <textarea
                  value={formData.presenter_bio}
                  onChange={(e) => setFormData({ ...formData, presenter_bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief bio about the presenter..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presenter Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.presenter_avatar}
                  onChange={(e) => setFormData({ ...formData, presenter_avatar: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail URL
            </label>
            <input
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          {/* Settings */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.registration_required}
                onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require registration to attend</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.send_reminders}
                onChange={(e) => setFormData({ ...formData, send_reminders: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Send reminder emails to registrants</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : webinar ? 'Update Webinar' : 'Create Webinar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WebinarLiveView = ({ webinar, onClose }) => {
  const [activePanel, setActivePanel] = useState('chat'); // chat, qa, polls
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChat Input] = useState('');
  const [qaQuestions, setQaQuestions] = useState([]);
  const [qaInput, setQaInput] = useState('');
  const [polls, setPolls] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    fetchChatMessages();
    fetchQAQuestions();
    fetchPolls();
    fetchRegistrations();

    // Poll for new messages every 3 seconds
    const chatInterval = setInterval(fetchChatMessages, 3000);
    const qaInterval = setInterval(fetchQAQuestions, 5000);

    return () => {
      clearInterval(chatInterval);
      clearInterval(qaInterval);
    };
  }, [webinar.id]);

  const fetchChatMessages = async () => {
    try {
      const response = await api.get(`/api/webinars/${webinar.id}/chat`);
      setChatMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const fetchQAQuestions = async () => {
    try {
      const response = await api.get(`/api/webinars/${webinar.id}/qa`);
      setQaQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Error fetching Q&A:', error);
    }
  };

  const fetchPolls = async () => {
    try {
      const response = await api.get(`/api/webinars/${webinar.id}/polls`);
      setPolls(response.data.polls || []);
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await api.get(`/api/webinars/${webinar.id}/registrations`);
      setRegistrations(response.data.registrations || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    try {
      await api.post(`/api/webinars/${webinar.id}/chat`, {
        message: chatInput,
        sender_name: 'Host',
        webinar_id: webinar.id
      });
      setChatInput('');
      fetchChatMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStartWebinar = async () => {
    try {
      await api.post(`/api/webinars/${webinar.id}/start`);
      alert('Webinar started!');
    } catch (error) {
      console.error('Error starting webinar:', error);
    }
  };

  const handleEndWebinar = async () => {
    if (!window.confirm('Are you sure you want to end the webinar?')) return;

    try {
      await api.post(`/api/webinars/${webinar.id}/end`);
      alert('Webinar ended');
      onClose();
    } catch (error) {
      console.error('Error ending webinar:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">{webinar.title}</h2>
              <p className="text-sm text-gray-400">
                {registrations.length} registered · {webinar.status === 'live' ? 'LIVE' : 'Not Started'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {webinar.status !== 'live' && (
              <button
                onClick={handleStartWebinar}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
              >
                <Play size={20} />
                Start Webinar
              </button>
            )}
            {webinar.status === 'live' && (
              <button
                onClick={handleEndWebinar}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-medium"
              >
                <Square size={20} />
                End Webinar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <Video size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">Live Video Stream</h3>
            <p className="text-gray-400">Mock video player - integrate with your streaming service</p>
            {webinar.status === 'live' && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-500 font-medium">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Panel Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActivePanel('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activePanel === 'chat'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare size={16} className="inline mr-2" />
              Chat
            </button>
            <button
              onClick={() => setActivePanel('qa')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activePanel === 'qa'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <HelpCircle size={16} className="inline mr-2" />
              Q&A
            </button>
            <button
              onClick={() => setActivePanel('polls')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activePanel === 'polls'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Polls
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'chat' && (
              <ChatPanel
                messages={chatMessages}
                input={chatInput}
                setInput={setChatInput}
                onSend={sendChatMessage}
              />
            )}
            {activePanel === 'qa' && (
              <QAPanel questions={qaQuestions} webinarId={webinar.id} onRefresh={fetchQAQuestions} />
            )}
            {activePanel === 'polls' && (
              <PollsPanel polls={polls} webinarId={webinar.id} onRefresh={fetchPolls} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatPanel = ({ messages, input, setInput, onSend }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white">{msg.sender_name}</span>
                {msg.is_host && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Host</span>
                )}
              </div>
              <p className="text-sm text-gray-300">{msg.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSend()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={onSend}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

const QAPanel = ({ questions, webinarId, onRefresh }) => {
  const [answerInput, setAnswerInput] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const handleAnswer = async () => {
    if (!answerInput.trim() || !selectedQuestion) return;

    try {
      await api.put(`/api/webinars/${webinarId}/qa/${selectedQuestion}/answer?answer_text=${encodeURIComponent(answerInput)}`);
      setAnswerInput('');
      setSelectedQuestion(null);
      onRefresh();
    } catch (error) {
      console.error('Error answering question:', error);
    }
  };

  return (
    <div className="space-y-3">
      {questions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <HelpCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No questions yet</p>
        </div>
      ) : (
        questions.map((q) => (
          <div key={q.id} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">{q.question}</p>
                <p className="text-xs text-gray-400">Asked by {q.asker_name}</p>
              </div>
              <button
                className="text-gray-400 hover:text-blue-400 transition"
              >
                <ThumbsUp size={16} />
                <span className="text-xs ml-1">{q.upvotes}</span>
              </button>
            </div>

            {q.is_answered ? (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <p className="text-xs text-gray-400 mb-1">Answer:</p>
                <p className="text-sm text-gray-300">{q.answer}</p>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-gray-600">
                {selectedQuestion === q.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Type your answer..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAnswer}
                        className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                      >
                        Submit Answer
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuestion(null);
                          setAnswerInput('');
                        }}
                        className="bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedQuestion(q.id)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition"
                  >
                    Answer this question
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const PollsPanel = ({ polls, webinarId, onRefresh }) => {
  return (
    <div className="space-y-4">
      {polls.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No polls yet</p>
        </div>
      ) : (
        polls.map((poll) => (
          <div key={poll.id} className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">{poll.question}</h4>
            <div className="space-y-2">
              {poll.options.map((option, idx) => {
                const votes = poll.votes[idx] || 0;
                const percentage = poll.total_votes > 0 ? (votes / poll.total_votes) * 100 : 0;

                return (
                  <div key={idx} className="bg-gray-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{option}</span>
                      <span className="text-xs text-gray-400">{votes} votes</span>
                    </div>
                    <div className="w-full bg-gray-500 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Total votes: {poll.total_votes}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

const WebinarAnalytics = ({ webinars }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Webinar Performance</h3>

      {webinars.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No analytics data yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webinars.map((webinar) => (
            <div key={webinar.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{webinar.title}</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  webinar.status === 'ended' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {webinar.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Registrations</p>
                  <p className="text-2xl font-bold text-gray-900">{webinar.registration_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Attendees</p>
                  <p className="text-2xl font-bold text-gray-900">{webinar.attendee_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {webinar.registration_count > 0
                      ? Math.round((webinar.attendee_count / webinar.registration_count) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Webinars;
