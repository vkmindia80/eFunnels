import React, { useState, useEffect } from 'react';
import { X, Plus, Check, XCircle, DollarSign, Users, TrendingUp, Eye, Link as LinkIcon, Download, Upload, Award, Settings } from 'lucide-react';
import api from '../api';

const AffiliateManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [programs, setPrograms] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [resources, setResources] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrograms();
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      loadAffiliates();
      loadCommissions();
      loadPayouts();
      loadResources();
      loadLeaderboard();
    }
  }, [selectedProgram]);

  const loadPrograms = async () => {
    try {
      const response = await api.get('/api/affiliate-programs');
      setPrograms(response.data.programs);
      if (response.data.programs.length > 0 && !selectedProgram) {
        setSelectedProgram(response.data.programs[0].id);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadAffiliates = async () => {
    try {
      const response = await api.get(`/api/affiliates?program_id=${selectedProgram}`);
      setAffiliates(response.data.affiliates);
    } catch (error) {
      console.error('Error loading affiliates:', error);
    }
  };

  const loadCommissions = async () => {
    try {
      const response = await api.get(`/api/affiliate-commissions?program_id=${selectedProgram}`);
      setCommissions(response.data.commissions);
    } catch (error) {
      console.error('Error loading commissions:', error);
    }
  };

  const loadPayouts = async () => {
    try {
      const response = await api.get(`/api/affiliate-payouts?program_id=${selectedProgram}`);
      setPayouts(response.data.payouts);
    } catch (error) {
      console.error('Error loading payouts:', error);
    }
  };

  const loadResources = async () => {
    try {
      const response = await api.get(`/api/affiliate-resources?program_id=${selectedProgram}`);
      setResources(response.data.resources);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/api/affiliate-analytics/summary');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await api.get(`/api/affiliate-analytics/leaderboard?program_id=${selectedProgram}`);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const createProgram = async (programData) => {
    try {
      setLoading(true);
      await api.post('/api/affiliate-programs', programData);
      await loadPrograms();
      await loadAnalytics();
      setShowProgramModal(false);
    } catch (error) {
      console.error('Error creating program:', error);
      alert('Error creating program');
    } finally {
      setLoading(false);
    }
  };

  const approveAffiliate = async (affiliateId) => {
    try {
      await api.post(`/api/affiliates/${affiliateId}/approve`);
      await loadAffiliates();
      await loadAnalytics();
      alert('Affiliate approved successfully!');
    } catch (error) {
      console.error('Error approving affiliate:', error);
      alert('Error approving affiliate');
    }
  };

  const rejectAffiliate = async (affiliateId) => {
    try {
      await api.post(`/api/affiliates/${affiliateId}/reject`);
      await loadAffiliates();
      await loadAnalytics();
      alert('Affiliate rejected');
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      alert('Error rejecting affiliate');
    }
  };

  const approveCommission = async (commissionId) => {
    try {
      await api.post(`/api/affiliate-commissions/${commissionId}/approve`);
      await loadCommissions();
      await loadAnalytics();
      alert('Commission approved!');
    } catch (error) {
      console.error('Error approving commission:', error);
      alert('Error approving commission');
    }
  };

  const createResource = async (resourceData) => {
    try {
      setLoading(true);
      await api.post('/api/affiliate-resources', { ...resourceData, program_id: selectedProgram });
      await loadResources();
      setShowResourceModal(false);
    } catch (error) {
      console.error('Error creating resource:', error);
      alert('Error creating resource');
    } finally {
      setLoading(false);
    }
  };

  const createPayout = async (payoutData) => {
    try {
      setLoading(true);
      await api.post('/api/affiliate-payouts', payoutData);
      await loadPayouts();
      await loadCommissions();
      await loadAffiliates();
      await loadAnalytics();
      setShowPayoutModal(false);
      alert('Payout created successfully!');
    } catch (error) {
      console.error('Error creating payout:', error);
      alert('Error creating payout');
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutStatus = async (payoutId, status, transactionId = null) => {
    try {
      await api.put(`/api/affiliate-payouts/${payoutId}`, {
        status,
        transaction_id: transactionId
      });
      await loadPayouts();
      await loadAffiliates();
      await loadAnalytics();
      alert(`Payout ${status}!`);
    } catch (error) {
      console.error('Error updating payout:', error);
      alert('Error updating payout');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
      paid: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="affiliates-title">Affiliate Management</h1>
          <p className="text-gray-600 mt-1">Manage your affiliate program and track performance</p>
        </div>
        <button
          onClick={() => setShowProgramModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2"
          data-testid="create-program-btn"
        >
          <Plus className="w-5 h-5" />
          New Program
        </button>
      </div>

      {/* Program Selector */}
      {programs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Program</label>
          <select
            value={selectedProgram || ''}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            data-testid="program-selector"
          >
            {programs.map(program => (
              <option key={program.id} value={program.id}>
                {program.name} - {program.commission_type} ({program.commission_value}
                {program.commission_type === 'percentage' ? '%' : '$'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Affiliates</p>
                <p className="text-3xl font-bold mt-2">{analytics.total_affiliates}</p>
              </div>
              <Users className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Clicks</p>
                <p className="text-3xl font-bold mt-2">{analytics.total_clicks}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">${analytics.total_revenue}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Conversion Rate</p>
                <p className="text-3xl font-bold mt-2">{analytics.conversion_rate}%</p>
              </div>
              <Award className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'affiliates', 'commissions', 'payouts', 'resources', 'leaderboard'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-testid={`${tab}-tab`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Active Affiliates</span>
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{analytics.active_affiliates}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Pending Approval</span>
                    <Users className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold">{analytics.pending_affiliates}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Conversions</span>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{analytics.total_conversions}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Commission Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Commissions</span>
                      <span className="font-semibold">${analytics.total_commissions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-yellow-600">${analytics.pending_commissions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Paid</span>
                      <span className="font-semibold text-green-600">${analytics.paid_commissions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Commission</span>
                      <span className="font-semibold">${analytics.average_commission}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Program Settings</h3>
                  {selectedProgram && programs.find(p => p.id === selectedProgram) && (
                    <div className="space-y-3">
                      {(() => {
                        const program = programs.find(p => p.id === selectedProgram);
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Commission Type</span>
                              <span className="font-semibold capitalize">{program.commission_type}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Commission Value</span>
                              <span className="font-semibold">
                                {program.commission_value}{program.commission_type === 'percentage' ? '%' : '$'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Cookie Duration</span>
                              <span className="font-semibold">{program.cookie_duration_days} days</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Approval Required</span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                program.approval_required ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {program.approval_required ? 'Manual' : 'Auto'}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Affiliates Tab */}
          {activeTab === 'affiliates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Affiliates ({affiliates.length})</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    All
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Pending
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Approved
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {affiliates.map(affiliate => (
                      <tr key={affiliate.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium">{affiliate.first_name} {affiliate.last_name}</div>
                            {affiliate.company && <div className="text-sm text-gray-500">{affiliate.company}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">{affiliate.email}</td>
                        <td className="px-4 py-4">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm">{affiliate.affiliate_code}</code>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(affiliate.status)}`}>
                            {affiliate.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">{affiliate.total_clicks}</td>
                        <td className="px-4 py-4 text-sm">{affiliate.total_conversions}</td>
                        <td className="px-4 py-4 text-sm font-medium">${affiliate.total_revenue.toFixed(2)}</td>
                        <td className="px-4 py-4">
                          {affiliate.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => approveAffiliate(affiliate.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Approve"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => rejectAffiliate(affiliate.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                          {affiliate.status === 'approved' && (
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                              <Eye className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {affiliates.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No affiliates yet</p>
                </div>
              )}
            </div>
          )}

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Commissions ({commissions.length})</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissions.map(commission => {
                      const affiliate = affiliates.find(a => a.id === commission.affiliate_id);
                      return (
                        <tr key={commission.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm">
                            {new Date(commission.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {affiliate ? `${affiliate.first_name} ${affiliate.last_name}` : 'Unknown'}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium">${commission.commission_amount.toFixed(2)}</td>
                          <td className="px-4 py-4 text-sm capitalize">{commission.commission_type}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(commission.status)}`}>
                              {commission.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {commission.status === 'pending' && (
                              <button
                                onClick={() => approveCommission(commission.id)}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs"
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {commissions.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No commissions yet</p>
                </div>
              )}
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Payouts ({payouts.length})</h3>
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  data-testid="create-payout-btn"
                >
                  <Plus className="w-5 h-5" />
                  Create Payout
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payouts.map(payout => {
                      const affiliate = affiliates.find(a => a.id === payout.affiliate_id);
                      return (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm">
                            {new Date(payout.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {affiliate ? `${affiliate.first_name} ${affiliate.last_name}` : 'Unknown'}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium">${payout.amount.toFixed(2)}</td>
                          <td className="px-4 py-4 text-sm capitalize">{payout.payment_method}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(payout.status)}`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {payout.status === 'pending' && (
                              <button
                                onClick={() => updatePayoutStatus(payout.id, 'processing')}
                                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                              >
                                Process
                              </button>
                            )}
                            {payout.status === 'processing' && (
                              <button
                                onClick={() => {
                                  const txId = prompt('Enter transaction ID:');
                                  if (txId) updatePayoutStatus(payout.id, 'completed', txId);
                                }}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs"
                              >
                                Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {payouts.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payouts yet</p>
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Marketing Resources ({resources.length})</h3>
                <button
                  onClick={() => setShowResourceModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  data-testid="add-resource-btn"
                >
                  <Upload className="w-5 h-5" />
                  Add Resource
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resources.map(resource => (
                  <div key={resource.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {resource.resource_type === 'banner' && <LinkIcon className="w-5 h-5 text-purple-600" />}
                        {resource.resource_type === 'logo' && <Award className="w-5 h-5 text-purple-600" />}
                        {resource.resource_type === 'email_template' && <Settings className="w-5 h-5 text-purple-600" />}
                        <span className="text-xs font-semibold text-gray-500 uppercase">{resource.resource_type}</span>
                      </div>
                      <Download className="w-5 h-5 text-gray-400 cursor-pointer hover:text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-2">{resource.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    {resource.dimensions && (
                      <p className="text-xs text-gray-500">{resource.dimensions}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">{resource.downloads} downloads</p>
                  </div>
                ))}
              </div>

              {resources.length === 0 && (
                <div className="text-center py-12">
                  <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No resources yet</p>
                  <button
                    onClick={() => setShowResourceModal(true)}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add First Resource
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Top Affiliates</h3>

              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div key={entry.affiliate_id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-300 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {entry.rank}
                      </div>
                      <div>
                        <p className="font-semibold">{entry.name}</p>
                        <p className="text-sm text-gray-500">{entry.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-6 text-center">
                      <div>
                        <p className="text-sm text-gray-500">Clicks</p>
                        <p className="font-semibold">{entry.total_clicks}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Conversions</p>
                        <p className="font-semibold">{entry.total_conversions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Revenue</p>
                        <p className="font-semibold text-green-600">${entry.total_revenue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Commission</p>
                        <p className="font-semibold text-purple-600">${entry.total_commissions}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {leaderboard.length === 0 && (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No leaderboard data yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showProgramModal && <ProgramModal onClose={() => setShowProgramModal(false)} onCreate={createProgram} loading={loading} />}
      {showResourceModal && <ResourceModal onClose={() => setShowResourceModal(false)} onCreate={createResource} loading={loading} />}
      {showPayoutModal && (
        <PayoutModal
          onClose={() => setShowPayoutModal(false)}
          onCreate={createPayout}
          affiliates={affiliates.filter(a => a.status === 'approved')}
          commissions={commissions.filter(c => c.status === 'approved' && !c.payout_id)}
          loading={loading}
        />
      )}
    </div>
  );
};

// Program Modal Component
const ProgramModal = ({ onClose, onCreate, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commission_type: 'percentage',
    commission_value: 10,
    cookie_duration_days: 30,
    approval_required: true,
    payout_threshold: 50,
    payment_methods: ['paypal', 'stripe', 'manual'],
    commission_tiers: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Create Affiliate Program</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
              placeholder="e.g., Course Affiliate Program"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              rows="3"
              placeholder="Program details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type *</label>
              <select
                value={formData.commission_type}
                onChange={(e) => setFormData({...formData, commission_type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="tiered">Tiered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Value * {formData.commission_type === 'percentage' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                value={formData.commission_value}
                onChange={(e) => setFormData({...formData, commission_value: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cookie Duration (days) *</label>
              <input
                type="number"
                value={formData.cookie_duration_days}
                onChange={(e) => setFormData({...formData, cookie_duration_days: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payout Threshold ($) *</label>
              <input
                type="number"
                value={formData.payout_threshold}
                onChange={(e) => setFormData({...formData, payout_threshold: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.approval_required}
                onChange={(e) => setFormData({...formData, approval_required: e.target.checked})}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Require Manual Approval</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              If disabled, affiliates will be auto-approved
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Resource Modal Component
const ResourceModal = ({ onClose, onCreate, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'banner',
    file_url: '',
    dimensions: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Add Marketing Resource</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
              placeholder="e.g., 728x90 Banner"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              rows="2"
              placeholder="Resource description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type *</label>
            <select
              value={formData.resource_type}
              onChange={(e) => setFormData({...formData, resource_type: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="banner">Banner</option>
              <option value="logo">Logo</option>
              <option value="email_template">Email Template</option>
              <option value="guide">Guide</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File URL *</label>
            <input
              type="url"
              value={formData.file_url}
              onChange={(e) => setFormData({...formData, file_url: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
            <input
              type="text"
              value={formData.dimensions}
              onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., 1200x628"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payout Modal Component
const PayoutModal = ({ onClose, onCreate, affiliates, commissions, loading }) => {
  const [selectedAffiliate, setSelectedAffiliate] = useState('');
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [notes, setNotes] = useState('');

  const affiliateCommissions = selectedAffiliate
    ? commissions.filter(c => c.affiliate_id === selectedAffiliate)
    : [];

  const totalAmount = selectedCommissions.reduce((sum, commissionId) => {
    const commission = commissions.find(c => c.id === commissionId);
    return sum + (commission ? commission.commission_amount : 0);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCommissions.length === 0) {
      alert('Please select at least one commission');
      return;
    }
    onCreate({
      affiliate_id: selectedAffiliate,
      commission_ids: selectedCommissions,
      payment_method: paymentMethod,
      amount: totalAmount,
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Create Payout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Affiliate *</label>
            <select
              value={selectedAffiliate}
              onChange={(e) => {
                setSelectedAffiliate(e.target.value);
                setSelectedCommissions([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Choose affiliate...</option>
              {affiliates.map(affiliate => (
                <option key={affiliate.id} value={affiliate.id}>
                  {affiliate.first_name} {affiliate.last_name} (${affiliate.pending_commissions.toFixed(2)} pending)
                </option>
              ))}
            </select>
          </div>

          {selectedAffiliate && affiliateCommissions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Commissions *</label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {affiliateCommissions.map(commission => (
                  <label key={commission.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedCommissions.includes(commission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCommissions([...selectedCommissions, commission.id]);
                        } else {
                          setSelectedCommissions(selectedCommissions.filter(id => id !== commission.id));
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm">
                      ${commission.commission_amount.toFixed(2)} - {new Date(commission.created_at).toLocaleDateString()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedAffiliate && affiliateCommissions.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No approved commissions available for this affiliate
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
              <option value="manual">Manual/Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              rows="2"
              placeholder="Optional notes..."
            />
          </div>

          {selectedCommissions.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Payout Amount:</span>
                <span className="text-2xl font-bold text-purple-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedCommissions.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AffiliateManagement;