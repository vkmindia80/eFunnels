import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, Users, Mail, Layout, BookOpen, DollarSign, 
  Video, Zap, FileText, Settings, 
  LogOut, User, Bell, Search, Plus, BarChart2,
  UserPlus, ShoppingCart, Target, Award, MessageSquare,
  Edit, Trash2, Tag, Download, Upload, Filter, 
  ChevronLeft, ChevronRight, Check, FileSpreadsheet,
  Phone, Globe, MapPin, Building, Briefcase, Calendar,
  Activity, MessageCircle, Clock, TrendingUp, Eye
} from 'lucide-react';
import './App.css';
import api from './api';
import EmailMarketingPage from './components/EmailMarketing';
import Funnels from './components/Funnels';
import Forms from './components/Forms';
import WorkflowAutomation from './components/WorkflowAutomation';
import Courses from './components/Courses';
import Blog from './components/Blog';
import WebsiteBuilder from './components/WebsiteBuilder';
import Webinars from './components/Webinars';
import PublicWebinarCatalog from './components/PublicWebinarCatalog';
import AffiliateManagement from './components/AffiliateManagement';
import PaymentEcommerce from './components/PaymentEcommerce';
import Analytics from './components/Analytics';

// Demo credentials banner component
const DemoCredentialsBanner = ({ onFillCredentials }) => {
  const [show, setShow] = useState(true);
  
  if (!show) return null;
  
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">🎯 Quick Test Mode:</span>
          <code className="bg-white/20 px-3 py-1 rounded text-sm">demo@efunnels.com</code>
          <code className="bg-white/20 px-3 py-1 rounded text-sm">demo123</code>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onFillCredentials}
            className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
          >
            Auto-fill Credentials
          </button>
          <button 
            onClick={() => setShow(false)}
            className="text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Login/Register Component
const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoFill = () => {
    setFormData({
      email: 'demo@efunnels.com',
      password: 'demo123',
      full_name: '',
    });
    setIsLogin(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await api.post(endpoint, payload);
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DemoCredentialsBanner onFillCredentials={handleDemoFill} />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)] px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Zap className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">eFunnels</h1>
            <p className="text-gray-600">All-in-One Business Platform</p>
          </div>

          {/* Auth Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  isLogin 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  !isLogin 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};


// Contacts Page Component
const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [tags, setTags] = useState([]);
  const [segments, setSegments] = useState([]);
  const [stats, setStats] = useState({});
  const [newActivity, setNewActivity] = useState({ activity_type: 'note', title: '', description: '' });

  useEffect(() => {
    fetchContacts();
    fetchTags();
    fetchSegments();
    fetchStats();
  }, [page, searchTerm, statusFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/api/contacts?${params}`);
      setContacts(response.data.contacts);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/api/tags');
      setTags(response.data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await api.get('/api/segments');
      setSegments(response.data);
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/contacts/stats/summary');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchContactDetails = async (contactId) => {
    try {
      const response = await api.get(`/api/contacts/${contactId}`);
      setCurrentContact(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch contact details:', error);
    }
  };

  const handleCreateContact = async (contactData) => {
    try {
      await api.post('/api/contacts', contactData);
      fetchContacts();
      fetchStats();
      setShowCreateModal(false);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create contact');
    }
  };

  const handleUpdateContact = async (contactId, contactData) => {
    try {
      await api.put(`/api/contacts/${contactId}`, contactData);
      fetchContacts();
      fetchContactDetails(contactId);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update contact');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await api.delete(`/api/contacts/${contactId}`);
      fetchContacts();
      fetchStats();
      setShowDetailModal(false);
    } catch (error) {
      alert('Failed to delete contact');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedContacts.length} contacts?`)) return;
    
    try {
      await api.post('/api/contacts/bulk/delete', { contact_ids: selectedContacts });
      setSelectedContacts([]);
      fetchContacts();
      fetchStats();
    } catch (error) {
      alert('Failed to delete contacts');
    }
  };

  const handleImport = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert(`Imported: ${response.data.imported}, Skipped: ${response.data.skipped}`);
      fetchContacts();
      fetchStats();
      setShowImportModal(false);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to import contacts');
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/api/contacts/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contacts.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export contacts');
    }
  };

  const handleAddActivity = async (contactId) => {
    try {
      await api.post(`/api/contacts/${contactId}/activities`, newActivity);
      setNewActivity({ activity_type: 'note', title: '', description: '' });
      fetchContactDetails(contactId);
    } catch (error) {
      alert('Failed to add activity');
    }
  };

  const handleCreateTag = async (tagName) => {
    try {
      await api.post('/api/tags', { name: tagName, color: '#3B82F6' });
      fetchTags();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create tag');
    }
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Contacts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total || 0}</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-4">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.by_status?.lead || 0}</p>
            </div>
            <div className="bg-yellow-100 rounded-xl p-4">
              <Target className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.by_status?.customer || 0}</p>
            </div>
            <div className="bg-green-100 rounded-xl p-4">
              <Check className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Recent (30d)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.recent || 0}</p>
            </div>
            <div className="bg-purple-100 rounded-xl p-4">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="lead">Lead</option>
              <option value="qualified">Qualified</option>
              <option value="customer">Customer</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
              data-testid="create-contact-btn"
            >
              <Plus size={20} />
              Add Contact
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-white border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Upload size={20} />
              Import
            </button>
            
            <div className="relative group">
              <button className="bg-white border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2">
                <Download size={20} />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText size={16} />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} />
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedContacts.length > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedContacts.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="spinner mx-auto"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No contacts yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first contact</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Add Your First Contact
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="contacts-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === contacts.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-50" data-testid={`contact-row-${contact.id}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {contact.first_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{contact.job_title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{contact.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{contact.company || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        contact.status === 'lead' ? 'bg-yellow-100 text-yellow-700' :
                        contact.status === 'qualified' ? 'bg-blue-100 text-blue-700' :
                        contact.status === 'customer' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags?.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {contact.tags?.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{contact.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{contact.score}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchContactDetails(contact.id)}
                          className="text-blue-600 hover:text-blue-700"
                          data-testid={`view-contact-${contact.id}`}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} contacts
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-1 text-sm font-medium">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Contact Modal */}
      {showCreateModal && (
        <ContactModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateContact}
          tags={tags}
          onCreateTag={handleCreateTag}
        />
      )}

      {/* Contact Detail Modal */}
      {showDetailModal && currentContact && (
        <ContactDetailModal
          contact={currentContact}
          onClose={() => setShowDetailModal(false)}
          onUpdate={handleUpdateContact}
          onDelete={handleDeleteContact}
          onAddActivity={handleAddActivity}
          newActivity={newActivity}
          setNewActivity={setNewActivity}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
};

// Contact Modal Component
const ContactModal = ({ contact = null, onClose, onSave, tags, onCreateTag }) => {
  const [formData, setFormData] = useState(contact || {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    website: '',
    address: '',
    city: '',
    country: '',
    source: '',
    notes: '',
    tags: [],
    custom_fields: {}
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="first-name-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="email-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <input
                type="text"
                placeholder="e.g., Website, Referral"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
              data-testid="save-contact-btn"
            >
              {contact ? 'Update Contact' : 'Create Contact'}
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

// Contact Detail Modal Component
const ContactDetailModal = ({ contact, onClose, onUpdate, onDelete, onAddActivity, newActivity, setNewActivity }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: contact.status,
    score: contact.score,
    notes: contact.notes
  });

  const handleUpdate = () => {
    onUpdate(contact.id, editData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {contact.first_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {contact.first_name} {contact.last_name}
              </h2>
              <p className="text-gray-600">{contact.job_title || contact.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Contact Information</h3>
              
              <div className="flex items-center gap-3 text-gray-700">
                <Mail size={20} className="text-gray-400" />
                <span>{contact.email}</span>
              </div>
              
              {contact.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone size={20} className="text-gray-400" />
                  <span>{contact.phone}</span>
                </div>
              )}
              
              {contact.company && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Building size={20} className="text-gray-400" />
                  <span>{contact.company}</span>
                </div>
              )}
              
              {contact.website && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Globe size={20} className="text-gray-400" />
                  <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {contact.website}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Status & Metrics</h3>
              
              <div>
                <label className="text-sm text-gray-600">Status</label>
                {isEditing ? (
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="lead">Lead</option>
                    <option value="qualified">Qualified</option>
                    <option value="customer">Customer</option>
                    <option value="lost">Lost</option>
                  </select>
                ) : (
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      contact.status === 'lead' ? 'bg-yellow-100 text-yellow-700' :
                      contact.status === 'qualified' ? 'bg-blue-100 text-blue-700' :
                      contact.status === 'customer' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {contact.status}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Score</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editData.score}
                    onChange={(e) => setEditData({ ...editData, score: parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="mt-1 text-2xl font-bold text-gray-900">{contact.score}/100</div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Engagement</label>
                <div className="mt-1 text-lg font-semibold text-gray-900">{contact.engagement_count} interactions</div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-3">Tags</h3>
              <div className="flex gap-2 flex-wrap">
                {contact.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Activity Timeline</h3>
            
            {/* Add Activity Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newActivity.activity_type}
                    onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="note">Note</option>
                    <option value="email">Email</option>
                    <option value="call">Call</option>
                    <option value="meeting">Meeting</option>
                  </select>
                  
                  <input
                    type="text"
                    placeholder="Activity title"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <textarea
                  placeholder="Description (optional)"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                
                <button
                  onClick={() => onAddActivity(contact.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Activity
                </button>
              </div>
            </div>

            {/* Activities List */}
            <div className="space-y-3">
              {contact.activities && contact.activities.length > 0 ? (
                contact.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.activity_type === 'email' ? 'bg-purple-100' :
                      activity.activity_type === 'call' ? 'bg-green-100' :
                      activity.activity_type === 'meeting' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.activity_type === 'email' ? <Mail size={20} /> :
                       activity.activity_type === 'call' ? <Phone size={20} /> :
                       activity.activity_type === 'meeting' ? <Calendar size={20} /> :
                       <MessageCircle size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No activities yet</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Edit size={20} />
                  Edit Contact
                </button>
                <button
                  onClick={() => onDelete(contact.id)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Delete Contact
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Import Modal Component
const ImportModal = ({ onClose, onImport }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (file) {
      onImport(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Import Contacts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-gray-600 mb-4">
              Upload a CSV or Excel file with your contacts. Required columns: email, first_name.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto text-gray-400 mb-4" size={48} />
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
              >
                Choose a file
              </label>
              {file && (
                <p className="mt-2 text-sm text-gray-700">{file.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!file}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Contacts
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Dashboard Component
const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'funnels', name: 'Sales Funnels', icon: Layout },
    { id: 'emails', name: 'Email Marketing', icon: Mail },
    { id: 'contacts', name: 'Contacts', icon: Users },
    { id: 'courses', name: 'Courses', icon: BookOpen },
    { id: 'webinars', name: 'Webinars', icon: Video },
    { id: 'blog', name: 'Blog', icon: FileText },
    { id: 'website', name: 'Website', icon: Layout },
    { id: 'forms', name: 'Forms', icon: MessageSquare },
    { id: 'affiliates', name: 'Affiliates', icon: Award },
    { id: 'workflows', name: 'Automations', icon: Zap },
    { id: 'payments', name: 'Products', icon: ShoppingCart },
    { id: 'analytics', name: 'Analytics', icon: BarChart2 },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const stats = [
    { name: 'Total Revenue', value: '$12,345', change: '+12.5%', icon: DollarSign, color: 'bg-green-500' },
    { name: 'Active Funnels', value: '24', change: '+3', icon: Layout, color: 'bg-blue-500' },
    { name: 'Total Contacts', value: '1,234', change: '+156', icon: Users, color: 'bg-purple-500' },
    { name: 'Email Campaigns', value: '18', change: '+5', icon: Mail, color: 'bg-pink-500' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name}!</h2>
                <p className="text-gray-600 mt-1">Here's what's happening with your business today.</p>
              </div>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2">
                <Plus size={20} />
                Create New Funnel
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">{stat.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-sm text-green-600 font-medium mt-2">{stat.change}</p>
                    </div>
                    <div className={`${stat.color} rounded-xl p-4`}>
                      <stat.icon className="text-white" size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {[
                    { icon: Layout, text: 'Create Sales Funnel', color: 'text-blue-600' },
                    { icon: Mail, text: 'Send Email Campaign', color: 'text-purple-600' },
                    { icon: UserPlus, text: 'Import Contacts', color: 'text-green-600' },
                    { icon: Video, text: 'Schedule Webinar', color: 'text-red-600' },
                  ].map((action, index) => (
                    <button key={index} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left">
                      <action.icon className={action.color} size={20} />
                      <span className="font-medium text-gray-700">{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { text: 'New contact added: john@example.com', time: '2 minutes ago' },
                    { text: 'Email campaign "Summer Sale" sent', time: '1 hour ago' },
                    { text: 'Funnel "Product Launch" created', time: '3 hours ago' },
                    { text: 'Webinar registration: 15 new attendees', time: '5 hours ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{activity.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'contacts':
        return <ContactsPage />;
      
      case 'emails':
        return <EmailMarketingPage />;
      
      case 'funnels':
        return <Funnels />;
      
      case 'forms':
        return <Forms />;
      
      case 'workflows':
        return <WorkflowAutomation />;
      
      case 'courses':
        return <Courses user={user} />;
      
      case 'blog':
        return <Blog />;
      
      case 'website':
        return <WebsiteBuilder />;
      
      case 'webinars':
        return <Webinars />;
      
      case 'affiliates':
        return <AffiliateManagement />;
      
      case 'payments':
        return <PaymentEcommerce />;
      
      case 'analytics':
        return <Analytics />;
      
      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <Zap className="text-blue-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {menuItems.find(item => item.id === activeTab)?.name}
            </h3>
            <p className="text-gray-600 mb-6">
              This feature is coming soon in the next phase of development!
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium">
              <Target size={16} />
              Phase {Math.ceil((menuItems.findIndex(item => item.id === activeTab) + 1) / 3)} Feature
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold text-gray-900">eFunnels</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.subscription_plan}</p>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                      <User size={16} />
                      Profile
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                      <Settings size={16} />
                      Settings
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={onLogout}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] sticky top-16">
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner"></div>
      </div>
    );
  }

  // Check for public routes (public webinar catalog)
  const path = window.location.pathname;
  if (path === '/public/webinars' || path.startsWith('/public/webinars/')) {
    return <PublicWebinarCatalog />;
  }

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <AuthPage onLogin={handleLogin} />
  );
}

export default App;
