import React, { useState, useEffect } from 'react';
import {
  BarChart2, TrendingUp, TrendingDown, DollarSign, Users, Mail,
  ShoppingCart, BookOpen, Video, Layout, Award, Zap, FileText,
  Download, Calendar, ArrowUp, ArrowDown, Activity, Eye, MousePointer
} from 'lucide-react';
import api from '../api';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [analyticsData, setAnalyticsData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch overview analytics
      const overviewResponse = await api.get('/api/analytics/dashboard/overview', {
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      });
      setAnalyticsData(overviewResponse.data);

      // Fetch detailed revenue
      const revenueResponse = await api.get('/api/analytics/revenue/detailed', {
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          group_by: dateRange === '7' ? 'day' : dateRange === '30' ? 'day' : 'week'
        }
      });
      setRevenueData(revenueResponse.data);

      // Fetch conversion funnel
      const conversionResponse = await api.get('/api/analytics/conversion/funnel', {
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      });
      setConversionData(conversionResponse.data);

      // Fetch engagement metrics
      const engagementResponse = await api.get('/api/analytics/engagement/metrics', {
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      });
      setEngagementData(engagementResponse.data);

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const response = await api.get('/api/analytics/export', {
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          format: format
        },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
      alert('Failed to export analytics report');
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="analytics-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow p-6" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${analyticsData.total_revenue.toLocaleString()}`}
          change={analyticsData.revenue_growth}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Total Contacts"
          value={analyticsData.total_contacts.toLocaleString()}
          change={analyticsData.contacts_growth}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Contacts"
          value={analyticsData.active_contacts.toLocaleString()}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="New Contacts"
          value={analyticsData.new_contacts.toLocaleString()}
          icon={Users}
          color="bg-indigo-500"
        />
      </div>

      {/* Feature Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Marketing */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="email-marketing-stats">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="text-blue-500" size={24} />
            <h3 className="text-lg font-semibold">Email Marketing</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Campaigns Sent</span>
              <span className="font-semibold">{analyticsData.email_marketing.sent_campaigns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Emails Sent</span>
              <span className="font-semibold">{analyticsData.email_marketing.total_emails_sent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Open Rate</span>
              <span className="font-semibold text-green-600">{analyticsData.email_marketing.open_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Click Rate</span>
              <span className="font-semibold text-blue-600">{analyticsData.email_marketing.click_rate}%</span>
            </div>
          </div>
        </div>

        {/* Sales Funnels */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="funnels-stats">
          <div className="flex items-center gap-3 mb-4">
            <Layout className="text-purple-500" size={24} />
            <h3 className="text-lg font-semibold">Sales Funnels</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Funnels</span>
              <span className="font-semibold">{analyticsData.funnels.active_funnels}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Visits</span>
              <span className="font-semibold">{analyticsData.funnels.total_visits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversions</span>
              <span className="font-semibold">{analyticsData.funnels.conversions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-semibold text-green-600">{analyticsData.funnels.conversion_rate}%</span>
            </div>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="courses-stats">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-orange-500" size={24} />
            <h3 className="text-lg font-semibold">Courses & Learning</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Published Courses</span>
              <span className="font-semibold">{analyticsData.courses.published_courses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Enrollments</span>
              <span className="font-semibold">{analyticsData.courses.total_enrollments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Students</span>
              <span className="font-semibold">{analyticsData.courses.active_students}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Certificates Issued</span>
              <span className="font-semibold text-green-600">{analyticsData.courses.certificates_issued}</span>
            </div>
          </div>
        </div>

        {/* Webinars */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="webinars-stats">
          <div className="flex items-center gap-3 mb-4">
            <Video className="text-red-500" size={24} />
            <h3 className="text-lg font-semibold">Webinars</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Webinars</span>
              <span className="font-semibold">{analyticsData.webinars.total_webinars}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registrations</span>
              <span className="font-semibold">{analyticsData.webinars.registrations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Attendees</span>
              <span className="font-semibold">{analyticsData.webinars.attendees}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Attendance Rate</span>
              <span className="font-semibold text-green-600">{analyticsData.webinars.attendance_rate}%</span>
            </div>
          </div>
        </div>

        {/* E-commerce */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="ecommerce-stats">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="text-green-500" size={24} />
            <h3 className="text-lg font-semibold">E-commerce</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Orders</span>
              <span className="font-semibold">{analyticsData.ecommerce.total_orders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed Orders</span>
              <span className="font-semibold">{analyticsData.ecommerce.completed_orders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Order Value</span>
              <span className="font-semibold text-green-600">${analyticsData.ecommerce.average_order_value}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Subscriptions</span>
              <span className="font-semibold">{analyticsData.ecommerce.active_subscriptions}</span>
            </div>
          </div>
        </div>

        {/* Affiliates */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="affiliates-stats">
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-yellow-500" size={24} />
            <h3 className="text-lg font-semibold">Affiliate Program</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Affiliates</span>
              <span className="font-semibold">{analyticsData.affiliates.active_affiliates}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Clicks</span>
              <span className="font-semibold">{analyticsData.affiliates.clicks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversions</span>
              <span className="font-semibold">{analyticsData.affiliates.conversions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Commissions</span>
              <span className="font-semibold text-green-600">${analyticsData.affiliates.total_commissions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {revenueData && revenueData.revenue_data.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6" data-testid="revenue-chart">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="space-y-2">
            {revenueData.revenue_data.slice(-10).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24">{item.period}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-6 rounded-full flex items-center justify-end px-2"
                    style={{ width: `${Math.min((item.revenue / revenueData.total_revenue * 100) * 10, 100)}%` }}
                  >
                    <span className="text-xs text-white font-semibold">${item.revenue}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-16">{item.orders} orders</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderConversion = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6" data-testid="conversion-funnel">
        <h3 className="text-lg font-semibold mb-6">Conversion Funnel</h3>
        <div className="space-y-4">
          {conversionData && conversionData.stages.map((stage, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{stage.stage}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">{stage.count.toLocaleString()}</span>
                  <span className={`font-semibold ${stage.percentage >= 50 ? 'text-green-600' : stage.percentage >= 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {stage.percentage}%
                  </span>
                </div>
              </div>
              <div className="bg-gray-200 rounded-full h-8">
                <div
                  className={`h-8 rounded-full flex items-center px-4 text-white font-medium ${
                    stage.percentage >= 50 ? 'bg-green-500' : stage.percentage >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stage.percentage}%` }}
                >
                  {stage.percentage > 10 && stage.stage}
                </div>
              </div>
            </div>
          ))}
        </div>
        {conversionData && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Overall Conversion Rate</span>
              <span className="text-2xl font-bold text-blue-600">{conversionData.overall_conversion_rate}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEngagement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Engagement */}
        {engagementData && (
          <>
            <div className="bg-white rounded-lg shadow p-6" data-testid="email-engagement">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="text-blue-500" size={24} />
                <h3 className="text-lg font-semibold">Email Engagement</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sent</span>
                  <span className="font-semibold">{engagementData.email_engagement.total_sent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Opened</span>
                  <span className="font-semibold">{engagementData.email_engagement.total_opened}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clicked</span>
                  <span className="font-semibold">{engagementData.email_engagement.total_clicked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Open Rate</span>
                  <span className="font-semibold text-green-600">{engagementData.email_engagement.open_rate}%</span>
                </div>
              </div>
            </div>

            {/* Content Engagement */}
            <div className="bg-white rounded-lg shadow p-6" data-testid="content-engagement">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-purple-500" size={24} />
                <h3 className="text-lg font-semibold">Content Engagement</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Blog Views</span>
                  <span className="font-semibold">{engagementData.content_engagement.blog_views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Blog Comments</span>
                  <span className="font-semibold">{engagementData.content_engagement.blog_comments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comments per View</span>
                  <span className="font-semibold">{engagementData.content_engagement.comments_per_view.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Course Engagement */}
            <div className="bg-white rounded-lg shadow p-6" data-testid="course-engagement">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="text-orange-500" size={24} />
                <h3 className="text-lg font-semibold">Course Engagement</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Learners</span>
                  <span className="font-semibold">{engagementData.course_engagement.active_learners}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Progress</span>
                  <span className="font-semibold text-blue-600">{engagementData.course_engagement.average_progress}%</span>
                </div>
              </div>
            </div>

            {/* Form Engagement */}
            <div className="bg-white rounded-lg shadow p-6" data-testid="form-engagement">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="text-green-500" size={24} />
                <h3 className="text-lg font-semibold">Form Engagement</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">{engagementData.form_engagement.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submissions</span>
                  <span className="font-semibold">{engagementData.form_engagement.submissions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-green-600">{engagementData.form_engagement.conversion_rate}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights across your platform</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="date-range-select"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            data-testid="export-csv-button"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            data-testid="export-json-button"
          >
            <Download size={18} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="overview-tab"
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('conversion')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'conversion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="conversion-tab"
          >
            Conversion Funnel
          </button>
          <button
            onClick={() => setActiveTab('engagement')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'engagement'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="engagement-tab"
          >
            Engagement
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'conversion' && renderConversion()}
      {activeTab === 'engagement' && renderEngagement()}
    </div>
  );
};

export default Analytics;
