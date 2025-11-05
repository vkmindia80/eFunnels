import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, User, Bell, Lock, Mail, Globe,
  Database, Key, CreditCard, Shield, Zap, Save, Eye, EyeOff
} from 'lucide-react';
import api from '../api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile settings
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    company: '',
    phone: '',
    website: ''
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    provider: 'mock',
    sendgrid_api_key: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    aws_access_key: '',
    aws_secret_key: '',
    aws_region: 'us-east-1',
    email_from: ''
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    marketing_emails: true,
    product_updates: true,
    weekly_reports: true,
    system_alerts: true
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setProfile({
        full_name: user.full_name || '',
        email: user.email || '',
        company: '',
        phone: '',
        website: ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await api.put('/api/user/profile', profile);
      
      // Update local storage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.full_name = profile.full_name;
      localStorage.setItem('user', JSON.stringify(user));
      
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      setLoading(true);
      await api.put('/api/settings/email', emailSettings);
      showMessage('success', 'Email settings updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      await api.put('/api/settings/notifications', notifications);
      showMessage('success', 'Notification preferences updated!');
    } catch (error) {
      showMessage('error', 'Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/user/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      showMessage('success', 'Password changed successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const renderProfile = () => (
    <div className="bg-white rounded-lg shadow p-6" data-testid="profile-settings">
      <div className="flex items-center gap-3 mb-6">
        <User className="text-blue-500" size={24} />
        <h3 className="text-lg font-semibold">Profile Settings</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="profile-fullname-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled
            data-testid="profile-email-input"
          />
          <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            value={profile.company}
            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="profile-company-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="profile-phone-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            value={profile.website}
            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://"
            data-testid="profile-website-input"
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          data-testid="save-profile-button"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="bg-white rounded-lg shadow p-6" data-testid="security-settings">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="text-red-500" size={24} />
        <h3 className="text-lg font-semibold">Security Settings</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? "text" : "password"}
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
              data-testid="current-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
              data-testid="new-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
              data-testid="confirm-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={loading || !passwordData.current_password || !passwordData.new_password}
          className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
          data-testid="change-password-button"
        >
          <Shield size={18} />
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="bg-white rounded-lg shadow p-6" data-testid="notification-settings">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-yellow-500" size={24} />
        <h3 className="text-lg font-semibold">Notification Preferences</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-gray-600">Receive notifications via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.email_notifications}
              onChange={(e) => setNotifications({ ...notifications, email_notifications: e.target.checked })}
              className="sr-only peer"
              data-testid="email-notifications-toggle"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium">Marketing Emails</p>
            <p className="text-sm text-gray-600">Receive marketing and promotional emails</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.marketing_emails}
              onChange={(e) => setNotifications({ ...notifications, marketing_emails: e.target.checked })}
              className="sr-only peer"
              data-testid="marketing-emails-toggle"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium">Product Updates</p>
            <p className="text-sm text-gray-600">Get notified about new features</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.product_updates}
              onChange={(e) => setNotifications({ ...notifications, product_updates: e.target.checked })}
              className="sr-only peer"
              data-testid="product-updates-toggle"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium">Weekly Reports</p>
            <p className="text-sm text-gray-600">Receive weekly performance summaries</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.weekly_reports}
              onChange={(e) => setNotifications({ ...notifications, weekly_reports: e.target.checked })}
              className="sr-only peer"
              data-testid="weekly-reports-toggle"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">System Alerts</p>
            <p className="text-sm text-gray-600">Critical system notifications</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.system_alerts}
              onChange={(e) => setNotifications({ ...notifications, system_alerts: e.target.checked })}
              className="sr-only peer"
              data-testid="system-alerts-toggle"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <button
          onClick={handleSaveNotifications}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
          data-testid="save-notifications-button"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="bg-white rounded-lg shadow p-6" data-testid="integrations-settings">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="text-purple-500" size={24} />
        <h3 className="text-lg font-semibold">Integrations & API</h3>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">API Access</h4>
          <p className="text-sm text-gray-600 mb-3">Use the API to integrate eFunnels with your applications</p>
          <div className="flex gap-2">
            <input
              type="text"
              value="ef_live_xxxxxxxxxxxxxxxxxxxx"
              readOnly
              className="flex-1 px-4 py-2 bg-white border rounded-lg text-sm"
              data-testid="api-key-display"
            />
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
              Regenerate
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Available Integrations</h4>
          
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="text-red-500" />
              <div>
                <p className="font-medium">SendGrid</p>
                <p className="text-sm text-gray-600">Email delivery service</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Connected</span>
          </div>

          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="text-blue-500" />
              <div>
                <p className="font-medium">Stripe</p>
                <p className="text-sm text-gray-600">Payment processing</p>
              </div>
            </div>
            <button className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
              Connect
            </button>
          </div>

          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="text-orange-500" />
              <div>
                <p className="font-medium">Zapier</p>
                <p className="text-sm text-gray-600">Automation platform</p>
              </div>
            </div>
            <button className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
          data-testid="settings-message"
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="profile-tab"
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="security-tab"
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="notifications-tab"
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'integrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="integrations-tab"
          >
            Integrations
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'profile' && renderProfile()}
      {activeTab === 'security' && renderSecurity()}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'integrations' && renderIntegrations()}
    </div>
  );
};

export default Settings;
