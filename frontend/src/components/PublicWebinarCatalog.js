import React, { useState, useEffect } from 'react';
import {
  Video, Calendar, Users, Clock, User, ArrowRight, CheckCircle, X,
  Mail, Phone, Building
} from 'lucide-react';
import api from '../api';

const PublicWebinarCatalog = () => {
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchPublicWebinars();
  }, []);

  const fetchPublicWebinars = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/webinars/public/list');
      setWebinars(response.data.webinars || []);
    } catch (error) {
      console.error('Error fetching webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (webinar) => {
    setSelectedWebinar(webinar);
    setShowRegistrationForm(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(date);
  };

  const getTimeUntil = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const scheduled = new Date(dateString);
    const diff = scheduled - now;
    
    if (diff < 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Starting soon';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showConfirmation) {
    return <RegistrationConfirmation webinar={selectedWebinar} onClose={() => {
      setShowConfirmation(false);
      setSelectedWebinar(null);
    }} />;
  }

  if (showRegistrationForm && selectedWebinar) {
    return (
      <RegistrationForm
        webinar={selectedWebinar}
        onClose={() => {
          setShowRegistrationForm(false);
          setSelectedWebinar(null);
        }}
        onSuccess={() => {
          setShowRegistrationForm(false);
          setShowConfirmation(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" data-testid="public-webinar-catalog">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Video size={48} className="mr-4" />
              <h1 className="text-5xl font-bold">Live Webinars</h1>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join our expert-led webinars and learn from industry leaders. Register for free!
            </p>
          </div>
        </div>
      </div>

      {/* Webinars Grid */}
      <div className="container mx-auto px-6 py-16">
        {webinars.length === 0 ? (
          <div className="text-center py-20">
            <Video size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No upcoming webinars</h3>
            <p className="text-gray-600">Check back soon for new sessions!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {webinars.map((webinar) => (
              <WebinarCard
                key={webinar.id}
                webinar={webinar}
                onRegister={handleRegisterClick}
                formatDate={formatDate}
                getTimeUntil={getTimeUntil}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const WebinarCard = ({ webinar, onRegister, formatDate, getTimeUntil }) => {
  const timeUntil = getTimeUntil(webinar.scheduled_at);
  const isFull = webinar.max_attendees && webinar.registration_count >= webinar.max_attendees;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
        {webinar.thumbnail_url ? (
          <img src={webinar.thumbnail_url} alt={webinar.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Video className="text-white opacity-50" size={64} />
          </div>
        )}
        {timeUntil && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
            {timeUntil}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{webinar.title}</h3>
        
        {webinar.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{webinar.description}</p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-blue-600" />
            <span>{formatDate(webinar.scheduled_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} className="text-blue-600" />
            <span>{webinar.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} className="text-blue-600" />
            <span>
              {webinar.registration_count} registered
              {webinar.max_attendees && ` / ${webinar.max_attendees} max`}
            </span>
          </div>
        </div>

        {/* Presenter */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {webinar.presenter_avatar ? (
              <img src={webinar.presenter_avatar} alt={webinar.presenter_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{webinar.presenter_name}</p>
            <p className="text-xs text-gray-600">Host</p>
          </div>
        </div>

        {/* Register Button */}
        <button
          onClick={() => onRegister(webinar)}
          disabled={isFull}
          className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition ${
            isFull
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
          }`}
        >
          {isFull ? 'Webinar Full' : (
            <>
              Register Free
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const RegistrationForm = ({ webinar, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post(`/api/webinars/${webinar.id}/register`, formData);
      onSuccess();
    } catch (error) {
      console.error('Error registering:', error);
      setError(error.response?.data?.detail || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <button onClick={onClose} className="text-white hover:text-blue-200 mb-4">
              <X size={24} />
            </button>
            <h2 className="text-3xl font-bold mb-2">Register for Webinar</h2>
            <p className="text-blue-100">{webinar.title}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline mr-2" size={16} />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline mr-2" size={16} />
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline mr-2" size={16} />
                Company (Optional)
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const RegistrationConfirmation = ({ webinar, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">You're Registered!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for registering for <strong>{webinar.title}</strong>
        </p>

        <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 mt-0.5" />
              <span>Check your email for confirmation and calendar invite</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 mt-0.5" />
              <span>We'll send you reminders 24 hours and 1 hour before the webinar</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 mt-0.5" />
              <span>You'll receive the join link in your reminder emails</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-4 mb-6">
          <p className="text-sm mb-1">Webinar Date & Time</p>
          <p className="font-semibold">{formatDate(webinar.scheduled_at)}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PublicWebinarCatalog;
