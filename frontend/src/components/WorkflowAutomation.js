import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Zap, Plus, Play, Pause, Trash2, Edit, Save, X, Settings,
  Mail, Tag, Clock, GitBranch, CheckCircle, AlertCircle,
  BarChart2, Eye, Copy, Layers
} from 'lucide-react';
import api from '../api';

// Custom Node Components
const TriggerNode = ({ data }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-blue-500 rounded-full p-1">
          <Zap className="text-white" size={16} />
        </div>
        <div className="font-bold text-blue-900 text-sm">TRIGGER</div>
      </div>
      <div className="text-sm text-gray-700 font-medium">{data.label || 'Start'}</div>
    </div>
  );
};

const ActionNode = ({ data }) => {
  const getIcon = () => {
    switch(data.action_type) {
      case 'send_email': return <Mail size={16} />;
      case 'add_tag': return <Tag size={16} />;
      case 'remove_tag': return <Tag size={16} />;
      case 'wait': return <Clock size={16} />;
      case 'update_contact': return <Edit size={16} />;
      default: return <Settings size={16} />;
    }
  };

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 border-green-500 bg-white min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-green-500 text-white rounded-full p-1">
          {getIcon()}
        </div>
        <div className="font-bold text-green-900 text-sm">ACTION</div>
      </div>
      <div className="text-sm text-gray-700 font-medium">{data.label || 'Action'}</div>
    </div>
  );
};

const ConditionNode = ({ data }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-yellow-500 rounded-full p-1">
          <GitBranch className="text-white" size={16} />
        </div>
        <div className="font-bold text-yellow-900 text-sm">CONDITION</div>
      </div>
      <div className="text-sm text-gray-700 font-medium">{data.label || 'If/Then'}</div>
      <div className="flex gap-2 mt-2">
        <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">YES</div>
        <div className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">NO</div>
      </div>
    </div>
  );
};

const EndNode = ({ data }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-purple-500 rounded-full p-1">
          <CheckCircle className="text-white" size={16} />
        </div>
        <div className="font-bold text-purple-900 text-sm">END</div>
      </div>
      <div className="text-sm text-gray-700 font-medium">{data.label || 'Complete'}</div>
    </div>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  end: EndNode,
};

const WorkflowAutomation = () => {
  const [activeTab, setActiveTab] = useState('list'); // list, builder, analytics
  const [workflows, setWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showNodeSettings, setShowNodeSettings] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    total_executions: 0,
    success_rate: 0
  });

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useEffect(() => {
    fetchWorkflows();
    fetchTemplates();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await api.get('/api/workflows');
      setWorkflows(response.data.workflows);
      
      // Calculate stats
      const activeCount = response.data.workflows.filter(w => w.is_active).length;
      const totalExecutions = response.data.workflows.reduce((sum, w) => sum + w.total_executions, 0);
      const successfulExecutions = response.data.workflows.reduce((sum, w) => sum + w.successful_executions, 0);
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100) : 0;
      
      setStats({
        total: response.data.workflows.length,
        active: activeCount,
        total_executions: totalExecutions,
        success_rate: successRate.toFixed(1)
      });
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/workflow-templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2 }
    }, eds)),
    [setEdges]
  );

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
    setShowNodeSettings(true);
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName) {
      alert('Please enter a workflow name');
      return;
    }

    setLoading(true);
    try {
      // Create initial trigger node
      const triggerNode = {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: {
          label: 'Start',
          trigger_type: 'contact_created',
          trigger_config: {}
        }
      };

      const newWorkflow = {
        name: workflowName,
        description: workflowDescription,
        is_active: false,
        trigger_type: 'contact_created',
        nodes: [triggerNode],
        edges: []
      };

      const response = await api.post('/api/workflows', newWorkflow);
      setSelectedWorkflow(response.data);
      setNodes([triggerNode]);
      setEdges([]);
      setActiveTab('builder');
      setShowCreateModal(false);
      setWorkflowName('');
      setWorkflowDescription('');
      fetchWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (template) => {
    const name = prompt('Enter a name for this workflow:', template.name);
    if (!name) return;

    setLoading(true);
    try {
      const response = await api.post(`/api/workflows/from-template/${template.id}`, null, {
        params: { workflow_name: name }
      });
      
      setSelectedWorkflow(response.data);
      setNodes(response.data.nodes);
      setEdges(response.data.edges);
      setActiveTab('builder');
      setShowTemplateModal(false);
      fetchWorkflows();
    } catch (error) {
      console.error('Error creating from template:', error);
      alert('Failed to create workflow from template');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;

    setLoading(true);
    try {
      await api.put(`/api/workflows/${selectedWorkflow.id}`, {
        nodes,
        edges
      });
      alert('Workflow saved successfully!');
      fetchWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (workflowId, currentStatus) => {
    try {
      const endpoint = currentStatus ? 'deactivate' : 'activate';
      await api.post(`/api/workflows/${workflowId}/${endpoint}`);
      fetchWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
      alert('Failed to toggle workflow status');
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await api.delete(`/api/workflows/${workflowId}`);
      fetchWorkflows();
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null);
        setActiveTab('list');
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  const handleEditWorkflow = async (workflow) => {
    setSelectedWorkflow(workflow);
    setNodes(workflow.nodes || []);
    setEdges(workflow.edges || []);
    setActiveTab('builder');
  };

  const addNode = (type) => {
    const nodeId = `${type}-${Date.now()}`;
    const newNode = {
      id: nodeId,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        ...(type === 'action' && { action_type: 'send_email', action_config: {} }),
        ...(type === 'trigger' && { trigger_type: 'contact_created', trigger_config: {} }),
        ...(type === 'condition' && { condition_field: '', condition_operator: 'equals', condition_value: '' })
      }
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  };

  const renderWorkflowList = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6" data-testid="total-workflows-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Workflows</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-4">
              <Zap className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6" data-testid="active-workflows-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
            </div>
            <div className="bg-green-100 rounded-xl p-4">
              <Play className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6" data-testid="total-executions-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Executions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_executions}</p>
            </div>
            <div className="bg-purple-100 rounded-xl p-4">
              <BarChart2 className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6" data-testid="success-rate-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.success_rate}%</p>
            </div>
            <div className="bg-yellow-100 rounded-xl p-4">
              <CheckCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
          data-testid="create-workflow-btn"
        >
          <Plus size={20} />
          Create Workflow
        </button>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
          data-testid="browse-templates-btn"
        >
          <Layers size={20} />
          Browse Templates
        </button>
      </div>

      {/* Workflows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            data-testid={`workflow-card-${workflow.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{workflow.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                workflow.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {workflow.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Executions</p>
                <p className="text-lg font-semibold text-gray-900">{workflow.total_executions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Success Rate</p>
                <p className="text-lg font-semibold text-gray-900">
                  {workflow.total_executions > 0
                    ? ((workflow.successful_executions / workflow.total_executions) * 100).toFixed(0)
                    : 0}%
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEditWorkflow(workflow)}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                data-testid={`edit-workflow-${workflow.id}`}
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(workflow.id, workflow.is_active)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  workflow.is_active
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                data-testid={`toggle-workflow-${workflow.id}`}
              >
                {workflow.is_active ? <Pause size={16} /> : <Play size={16} />}
                {workflow.is_active ? 'Pause' : 'Activate'}
              </button>
              <button
                onClick={() => handleDeleteWorkflow(workflow.id)}
                className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition"
                data-testid={`delete-workflow-${workflow.id}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {workflows.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <Zap className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Workflows Yet</h3>
            <p className="text-gray-600 mb-6">Create your first workflow to automate your marketing</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Create Your First Workflow
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderWorkflowBuilder = () => (
    <div className="space-y-4">
      {/* Builder Header */}
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedWorkflow(null);
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            <X size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedWorkflow?.name || 'New Workflow'}</h2>
            <p className="text-sm text-gray-600">{selectedWorkflow?.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveWorkflow}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center gap-2"
            data-testid="save-workflow-btn"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Node Library */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Add Nodes</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => addNode('trigger')}
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold hover:bg-blue-200 transition flex items-center gap-2"
            data-testid="add-trigger-node"
          >
            <Zap size={16} />
            Trigger
          </button>
          <button
            onClick={() => addNode('action')}
            className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold hover:bg-green-200 transition flex items-center gap-2"
            data-testid="add-action-node"
          >
            <Settings size={16} />
            Action
          </button>
          <button
            onClick={() => addNode('condition')}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-semibold hover:bg-yellow-200 transition flex items-center gap-2"
            data-testid="add-condition-node"
          >
            <GitBranch size={16} />
            Condition
          </button>
          <button
            onClick={() => addNode('end')}
            className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-semibold hover:bg-purple-200 transition flex items-center gap-2"
            data-testid="add-end-node"
          >
            <CheckCircle size={16} />
            End
          </button>
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );

  // Create Workflow Modal
  const renderCreateModal = () => (
    showCreateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Workflow</h2>
            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g., Welcome Series"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="workflow-name-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="workflow-description-input"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition"
                data-testid="create-workflow-submit"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Templates Modal
  const renderTemplateModal = () => (
    showTemplateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Workflow Templates</h2>
            <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 transition cursor-pointer"
                onClick={() => handleCreateFromTemplate(template)}
                data-testid={`template-${template.id}`}
              >
                <div className="mb-4">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{template.category}</span>
                  <span className="text-xs text-gray-500">{template.usage_count} uses</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  );

  // Node Settings Panel
  const renderNodeSettings = () => (
    showNodeSettings && selectedNode && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Node Settings</h2>
            <button onClick={() => setShowNodeSettings(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
              <input
                type="text"
                value={selectedNode.data.label || ''}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  updateNodeData(selectedNode.id, { label: newLabel });
                  setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: newLabel } });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="node-label-input"
              />
            </div>

            {selectedNode.type === 'action' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                <select
                  value={selectedNode.data.action_type || 'send_email'}
                  onChange={(e) => {
                    const newActionType = e.target.value;
                    updateNodeData(selectedNode.id, { action_type: newActionType });
                    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, action_type: newActionType } });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  data-testid="action-type-select"
                >
                  <option value="send_email">Send Email</option>
                  <option value="add_tag">Add Tag</option>
                  <option value="remove_tag">Remove Tag</option>
                  <option value="wait">Wait</option>
                  <option value="update_contact">Update Contact</option>
                </select>
              </div>
            )}

            {selectedNode.type === 'trigger' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                <select
                  value={selectedNode.data.trigger_type || 'contact_created'}
                  onChange={(e) => {
                    const newTriggerType = e.target.value;
                    updateNodeData(selectedNode.id, { trigger_type: newTriggerType });
                    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, trigger_type: newTriggerType } });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  data-testid="trigger-type-select"
                >
                  <option value="contact_created">Contact Created</option>
                  <option value="email_opened">Email Opened</option>
                  <option value="email_clicked">Email Link Clicked</option>
                  <option value="form_submitted">Form Submitted</option>
                  <option value="tag_added">Tag Added</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNodeSettings(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                data-testid="save-node-settings"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="text-gray-600 mt-1">Automate your marketing with powerful workflows</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
              activeTab === 'list'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            data-testid="workflows-tab"
          >
            Workflows
          </button>
          {selectedWorkflow && (
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                activeTab === 'builder'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              data-testid="builder-tab"
            >
              Builder
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && renderWorkflowList()}
      {activeTab === 'builder' && renderWorkflowBuilder()}

      {/* Modals */}
      {renderCreateModal()}
      {renderTemplateModal()}
      {renderNodeSettings()}
    </div>
  );
};

export default WorkflowAutomation;
