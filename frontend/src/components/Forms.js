import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Eye, Copy, BarChart2, Download, ExternalLink,
  Save, X, Settings, FileText, MessageSquare, ClipboardList, ChevronDown,
  ChevronRight, Star, CheckSquare, Calendar, Mail, Phone, Hash,
  AlignLeft, List, Upload, Award
} from 'lucide-react';
import api from '../api';
import { fieldTypes, renderFieldPreview } from './FormBuilder/fieldTypes';

const Forms = () => {
  const [activeTab, setActiveTab] = useState('forms');
  const [forms, setForms] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [currentForm, setCurrentForm] = useState(null);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (activeTab === 'forms') {
      fetchForms();
    } else if (activeTab === 'surveys') {
      fetchSurveys();
    }
  }, [activeTab]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/forms');
      setForms(response.data.forms);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/surveys');
      setSurveys(response.data.surveys);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async (formData) => {
    try {
      const response = await api.post('/api/forms', formData);
      setForms([response.data, ...forms]);
      setShowCreateModal(false);
      setCurrentForm(response.data);
      setShowBuilderModal(true);
    } catch (error) {
      alert('Failed to create form');
    }
  };

  const handleCreateSurvey = async (surveyData) => {
    try {
      const response = await api.post('/api/surveys', surveyData);
      setSurveys([response.data, ...surveys]);
      setShowCreateModal(false);
    } catch (error) {
      alert('Failed to create survey');
    }
  };

  const handleUpdateForm = async (formId, updates) => {
    try {
      const response = await api.put(`/api/forms/${formId}`, updates);
      setForms(forms.map(f => f.id === formId ? response.data : f));
      if (currentForm?.id === formId) {
        setCurrentForm(response.data);
      }
    } catch (error) {
      alert('Failed to update form');
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm('Delete this form? All submissions will be lost.')) return;
    
    try {
      await api.delete(`/api/forms/${formId}`);
      setForms(forms.filter(f => f.id !== formId));
    } catch (error) {
      alert('Failed to delete form');
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm('Delete this survey? All responses will be lost.')) return;
    
    try {
      await api.delete(`/api/surveys/${surveyId}`);
      setSurveys(surveys.filter(s => s.id !== surveyId));
    } catch (error) {
      alert('Failed to delete survey');
    }
  };

  const fetchSubmissions = async (formId) => {
    try {
      const response = await api.get(`/api/forms/${formId}/submissions`);
      setSubmissions(response.data.submissions);
      setShowSubmissionsModal(true);
    } catch (error) {
      alert('Failed to fetch submissions');
    }
  };

  const handleExportSubmissions = async (formId, format) => {
    try {
      const response = await api.get(`/api/forms/${formId}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form_submissions.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export submissions');
    }
  };

  const openFormBuilder = async (formId) => {
    try {
      const response = await api.get(`/api/forms/${formId}`);
      setCurrentForm(response.data);
      setShowBuilderModal(true);
    } catch (error) {
      alert('Failed to load form');
    }
  };

  const renderFormsTab = () => (
    <div className=\"space-y-6\">
      {/* Stats Cards */}
      <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6\">
        <div className=\"bg-white rounded-xl shadow-md p-6\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm text-gray-600 font-medium\">Total Forms</p>
              <p className=\"text-3xl font-bold text-gray-900 mt-2\">{forms.length}</p>
            </div>
            <div className=\"bg-blue-100 rounded-xl p-4\">
              <FileText className=\"text-blue-600\" size={24} />
            </div>
          </div>
        </div>
        
        <div className=\"bg-white rounded-xl shadow-md p-6\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm text-gray-600 font-medium\">Total Submissions</p>
              <p className=\"text-3xl font-bold text-gray-900 mt-2\">
                {forms.reduce((sum, f) => sum + (f.total_submissions || 0), 0)}
              </p>
            </div>
            <div className=\"bg-green-100 rounded-xl p-4\">
              <CheckSquare className=\"text-green-600\" size={24} />
            </div>
          </div>
        </div>
        
        <div className=\"bg-white rounded-xl shadow-md p-6\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm text-gray-600 font-medium\">Total Views</p>
              <p className=\"text-3xl font-bold text-gray-900 mt-2\">
                {forms.reduce((sum, f) => sum + (f.total_views || 0), 0)}
              </p>
            </div>
            <div className=\"bg-purple-100 rounded-xl p-4\">
              <Eye className=\"text-purple-600\" size={24} />
            </div>
          </div>
        </div>
        
        <div className=\"bg-white rounded-xl shadow-md p-6\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm text-gray-600 font-medium\">Avg Conversion</p>
              <p className=\"text-3xl font-bold text-gray-900 mt-2\">
                {forms.length > 0
                  ? (forms.reduce((sum, f) => sum + (f.conversion_rate || 0), 0) / forms.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className=\"bg-yellow-100 rounded-xl p-4\">
              <BarChart2 className=\"text-yellow-600\" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className=\"bg-white rounded-xl shadow-md p-6\">
        <div className=\"flex items-center justify-between mb-6\">
          <h3 className=\"text-xl font-bold text-gray-900\">Your Forms</h3>
          <button
            onClick={() => { setShowCreateModal(true); }}
            className=\"bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2\"
          >
            <Plus size={20} />
            Create Form
          </button>
        </div>

        {loading ? (
          <div className=\"text-center py-12\">
            <div className=\"spinner mx-auto\"></div>
          </div>
        ) : forms.length === 0 ? (
          <div className=\"text-center py-12\">
            <FileText className=\"mx-auto text-gray-400 mb-4\" size={48} />
            <h3 className=\"text-xl font-bold text-gray-900 mb-2\">No forms yet</h3>
            <p className=\"text-gray-600 mb-6\">Create your first form to start collecting data</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className=\"bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition\"
            >
              Create Your First Form
            </button>
          </div>
        ) : (
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
            {forms.map(form => (
              <div key={form.id} className=\"border border-gray-200 rounded-xl p-5 hover:shadow-lg transition\">
                <div className=\"flex items-start justify-between mb-4\">
                  <div className=\"flex-1\">
                    <h4 className=\"font-bold text-gray-900 text-lg\">{form.name}</h4>
                    {form.description && (
                      <p className=\"text-sm text-gray-600 mt-1\">{form.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    form.status === 'active' ? 'bg-green-100 text-green-700' :
                    form.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {form.status}
                  </span>
                </div>

                <div className=\"grid grid-cols-3 gap-4 mb-4 py-4 border-t border-b border-gray-100\">
                  <div className=\"text-center\">
                    <p className=\"text-2xl font-bold text-gray-900\">{form.fields?.length || 0}</p>
                    <p className=\"text-xs text-gray-600\">Fields</p>
                  </div>
                  <div className=\"text-center\">
                    <p className=\"text-2xl font-bold text-gray-900\">{form.total_views || 0}</p>
                    <p className=\"text-xs text-gray-600\">Views</p>
                  </div>
                  <div className=\"text-center\">
                    <p className=\"text-2xl font-bold text-gray-900\">{form.total_submissions || 0}</p>
                    <p className=\"text-xs text-gray-600\">Submissions</p>
                  </div>
                </div>

                <div className=\"flex items-center gap-2\">
                  <button
                    onClick={() => openFormBuilder(form.id)}
                    className=\"flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2\"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => fetchSubmissions(form.id)}
                    className=\"flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2\"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className=\"bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition\"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSurveysTab = () => (
    <div className=\"space-y-6\">
      {/* Stats Cards */}
      <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6\">
        <div className=\"bg-white rounded-xl shadow-md p-6\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm text-gray-600 font-medium\">Total Surveys</p>
              <p className=\"text-3xl font-bold text-gray-900 mt-2\">{surveys.length}</p>
            </div>
            <div className=\"bg-purple-100 rounded-xl p-4\">
              <ClipboardList className=\"text-purple-600\" size={24} />
            </div>
          </div>
        </div>
        
        <div className=\"bg-white rounded-xl shadow-md p-6\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm text-gray-600 font-medium\">Total Responses</p>
              <p className=\"text-3xl font-bold text-gray-900 mt-2\">
                {surveys.reduce((sum, s) => sum + (s.total_responses || 0), 0)}
              </p>
            </div>
            <div className=\"bg-green-100 rounded-xl p-4\">
              <MessageSquare className=\"text-green-600\" size={24} />
            </div>
          </div>
        </div>
        
        <div className=\"bg-white rounded-xl shadow-md p-6\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm text-gray-600 font-medium\">Active Surveys</p>
              <p className=\"text-3xl font-bold text-gray-900 mt-2\">
                {surveys.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className=\"bg-blue-100 rounded-xl p-4\">
              <Award className=\"text-blue-600\" size={24} />
            </div>
          </div>
        </div>
        
        <div className=\"bg-white rounded-xl shadow-md p-6\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm text-gray-600 font-medium\">Avg Completion</p>
              <p className=\"text-3xl font-bold text-gray-900 mt-2\">
                {surveys.length > 0
                  ? (surveys.reduce((sum, s) => sum + (s.completion_rate || 0), 0) / surveys.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className=\"bg-yellow-100 rounded-xl p-4\">
              <Star className=\"text-yellow-600\" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Surveys List */}
      <div className=\"bg-white rounded-xl shadow-md p-6\">
        <div className=\"flex items-center justify-between mb-6\">
          <h3 className=\"text-xl font-bold text-gray-900\">Your Surveys</h3>
          <button
            onClick={() => { setShowCreateModal(true); }}
            className=\"bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2\"
          >
            <Plus size={20} />
            Create Survey
          </button>
        </div>

        {loading ? (
          <div className=\"text-center py-12\">
            <div className=\"spinner mx-auto\"></div>
          </div>
        ) : surveys.length === 0 ? (
          <div className=\"text-center py-12\">
            <ClipboardList className=\"mx-auto text-gray-400 mb-4\" size={48} />
            <h3 className=\"text-xl font-bold text-gray-900 mb-2\">No surveys yet</h3>
            <p className=\"text-gray-600 mb-6\">Create your first survey to gather feedback</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className=\"bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition\"
            >
              Create Your First Survey
            </button>
          </div>
        ) : (
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
            {surveys.map(survey => (
              <div key={survey.id} className=\"border border-gray-200 rounded-xl p-5 hover:shadow-lg transition\">
                <div className=\"flex items-start justify-between mb-4\">
                  <div className=\"flex-1\">
                    <h4 className=\"font-bold text-gray-900 text-lg\">{survey.name}</h4>
                    {survey.description && (
                      <p className=\"text-sm text-gray-600 mt-1\">{survey.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    survey.status === 'active' ? 'bg-green-100 text-green-700' :
                    survey.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {survey.status}
                  </span>
                </div>

                <div className=\"grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b border-gray-100\">
                  <div className=\"text-center\">
                    <p className=\"text-2xl font-bold text-gray-900\">{survey.questions?.length || 0}</p>
                    <p className=\"text-xs text-gray-600\">Questions</p>
                  </div>
                  <div className=\"text-center\">
                    <p className=\"text-2xl font-bold text-gray-900\">{survey.total_responses || 0}</p>
                    <p className=\"text-xs text-gray-600\">Responses</p>
                  </div>
                </div>

                <div className=\"flex items-center gap-2\">
                  <button
                    className=\"flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2\"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    className=\"flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2\"
                  >
                    <BarChart2 size={16} />
                    Results
                  </button>
                  <button
                    onClick={() => handleDeleteSurvey(survey.id)}
                    className=\"bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition\"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className=\"space-y-6\">
      {/* Page Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h2 className=\"text-3xl font-bold text-gray-900\">Forms & Surveys</h2>
          <p className=\"text-gray-600 mt-1\">Create and manage forms to collect data from your audience</p>
        </div>
      </div>

      {/* Tabs */}
      <div className=\"bg-white rounded-xl shadow-md\">
        <div className=\"border-b border-gray-200\">
          <nav className=\"flex\">
            <button
              onClick={() => setActiveTab('forms')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'forms'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className=\"flex items-center gap-2\">
                <FileText size={20} />
                Forms
              </div>
            </button>
            <button
              onClick={() => setActiveTab('surveys')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'surveys'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className=\"flex items-center gap-2\">
                <ClipboardList size={20} />
                Surveys
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'forms' && renderFormsTab()}
      {activeTab === 'surveys' && renderSurveysTab()}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateFormModal
          type={activeTab}
          onClose={() => setShowCreateModal(false)}
          onCreate={activeTab === 'forms' ? handleCreateForm : handleCreateSurvey}
        />
      )}

      {/* Form Builder Modal */}
      {showBuilderModal && currentForm && (
        <FormBuilderModal
          form={currentForm}
          onClose={() => { setShowBuilderModal(false); setCurrentForm(null); }}
          onUpdate={(updates) => handleUpdateForm(currentForm.id, updates)}
        />
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <SubmissionsModal
          submissions={submissions}
          onClose={() => { setShowSubmissionsModal(false); setSubmissions([]); }}
          onExport={handleExportSubmissions}
        />
      )}
    </div>
  );
};

// Create Form/Survey Modal
const CreateFormModal = ({ type, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [],
    questions: [],
    settings: {}
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\">
      <div className=\"bg-white rounded-2xl max-w-md w-full\">
        <div className=\"px-6 py-4 border-b border-gray-200 flex items-center justify-between\">
          <h2 className=\"text-2xl font-bold text-gray-900\">
            Create New {type === 'forms' ? 'Form' : 'Survey'}
          </h2>
          <button onClick={onClose} className=\"text-gray-400 hover:text-gray-600\">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className=\"p-6 space-y-4\">
          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-2\">
              Name *
            </label>
            <input
              type=\"text\"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
              placeholder={`Enter ${type === 'forms' ? 'form' : 'survey'} name`}
            />
          </div>

          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-2\">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
              placeholder=\"Brief description (optional)\"
            />
          </div>

          <div className=\"flex items-center gap-3 pt-4\">
            <button
              type=\"submit\"
              className=\"flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition\"
            >
              Create {type === 'forms' ? 'Form' : 'Survey'}
            </button>
            <button
              type=\"button\"
              onClick={onClose}
              className=\"flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition\"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Form Builder Modal
const FormBuilderModal = ({ form, onClose, onUpdate }) => {
  const [fields, setFields] = useState(form.fields || []);
  const [selectedField, setSelectedField] = useState(null);
  const [formSettings, setFormSettings] = useState(form.settings || {});

  const addField = (fieldType) => {
    const newField = {
      id: `field-${Date.now()}`,
      field_type: fieldType.id,
      label: fieldType.defaultConfig.label,
      placeholder: fieldType.defaultConfig.placeholder,
      required: fieldType.defaultConfig.required || false,
      options: fieldType.defaultConfig.options || [],
      validation: fieldType.defaultConfig.validation || {},
      order: fields.length
    };
    setFields([...fields, newField]);
  };

  const updateField = (fieldId, updates) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const deleteField = (fieldId) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleSave = async () => {
    await onUpdate({ fields, settings: formSettings });
    alert('Form saved successfully!');
  };

  return (
    <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\">
      <div className=\"bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col\">
        {/* Header */}
        <div className=\"px-6 py-4 border-b border-gray-200 flex items-center justify-between\">
          <div>
            <h2 className=\"text-2xl font-bold text-gray-900\">{form.name}</h2>
            <p className=\"text-sm text-gray-600\">Form Builder</p>
          </div>
          <div className=\"flex items-center gap-3\">
            <button
              onClick={handleSave}
              className=\"bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2\"
            >
              <Save size={20} />
              Save Form
            </button>
            <button
              onClick={() => onUpdate({ status: form.status === 'active' ? 'draft' : 'active' })}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                form.status === 'active'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {form.status === 'active' ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={onClose} className=\"text-gray-400 hover:text-gray-600\">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Builder Content */}
        <div className=\"flex-1 flex overflow-hidden\">
          {/* Field Library */}
          <div className=\"w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4\">
            <h3 className=\"font-bold text-gray-900 mb-4\">Field Types</h3>
            <div className=\"space-y-2\">
              {fieldTypes.map(fieldType => (
                <button
                  key={fieldType.id}
                  onClick={() => addField(fieldType)}
                  className=\"w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-left\"
                >
                  <span className=\"text-2xl\">{fieldType.icon}</span>
                  <span className=\"text-sm font-medium text-gray-900\">{fieldType.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Canvas */}
          <div className=\"flex-1 overflow-y-auto p-6 bg-gray-50\">
            <div className=\"max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8\">
              <h3 className=\"text-2xl font-bold text-gray-900 mb-6\">{form.name}</h3>
              
              {fields.length === 0 ? (
                <div className=\"text-center py-12 text-gray-500\">
                  <p>No fields yet. Add fields from the left panel.</p>
                </div>
              ) : (
                <div className=\"space-y-6\">
                  {fields.map(field => (
                    <div
                      key={field.id}
                      onClick={() => setSelectedField(field)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedField?.id === field.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className=\"flex items-start justify-between mb-3\">
                        <div className=\"flex-1\">
                          <label className=\"block text-sm font-medium text-gray-900\">
                            {field.label}
                            {field.required && <span className=\"text-red-500 ml-1\">*</span>}
                          </label>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteField(field.id);
                          }}
                          className=\"text-red-600 hover:text-red-700\"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {renderFieldPreview(field, '', () => {})}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Field Settings */}
          {selectedField && (
            <div className=\"w-80 bg-white border-l border-gray-200 overflow-y-auto p-4\">
              <h3 className=\"font-bold text-gray-900 mb-4\">Field Settings</h3>
              
              <div className=\"space-y-4\">
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">Label</label>
                  <input
                    type=\"text\"
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg\"
                  />
                </div>

                {['text', 'email', 'phone', 'number', 'textarea'].includes(selectedField.field_type) && (
                  <div>
                    <label className=\"block text-sm font-medium text-gray-700 mb-2\">Placeholder</label>
                    <input
                      type=\"text\"
                      value={selectedField.placeholder || ''}
                      onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                      className=\"w-full px-3 py-2 border border-gray-300 rounded-lg\"
                    />
                  </div>
                )}

                <div className=\"flex items-center gap-2\">
                  <input
                    type=\"checkbox\"
                    checked={selectedField.required}
                    onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                    className=\"w-4 h-4 text-blue-600 rounded\"
                  />
                  <label className=\"text-sm font-medium text-gray-700\">Required field</label>
                </div>

                {['select', 'radio', 'checkbox'].includes(selectedField.field_type) && (
                  <div>
                    <label className=\"block text-sm font-medium text-gray-700 mb-2\">Options</label>
                    <textarea
                      value={selectedField.options?.join('\\n') || ''}
                      onChange={(e) => updateField(selectedField.id, {
                        options: e.target.value.split('\\n').filter(o => o.trim())
                      })}
                      rows={5}
                      placeholder=\"One option per line\"
                      className=\"w-full px-3 py-2 border border-gray-300 rounded-lg\"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Submissions Modal
const SubmissionsModal = ({ submissions, onClose, onExport }) => {
  return (
    <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\">
      <div className=\"bg-white rounded-2xl w-full max-w-6xl h-[80vh] flex flex-col\">
        <div className=\"px-6 py-4 border-b border-gray-200 flex items-center justify-between\">
          <h2 className=\"text-2xl font-bold text-gray-900\">Form Submissions</h2>
          <div className=\"flex items-center gap-3\">
            <button
              onClick={() => onExport('csv')}
              className=\"bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2\"
            >
              <Download size={20} />
              Export CSV
            </button>
            <button onClick={onClose} className=\"text-gray-400 hover:text-gray-600\">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className=\"flex-1 overflow-auto p-6\">
          {submissions.length === 0 ? (
            <div className=\"text-center py-12 text-gray-500\">
              <p>No submissions yet</p>
            </div>
          ) : (
            <div className=\"space-y-4\">
              {submissions.map(submission => (
                <div key={submission.id} className=\"bg-gray-50 rounded-lg p-4 border border-gray-200\">
                  <div className=\"flex items-center justify-between mb-3\">
                    <span className=\"text-sm font-medium text-gray-600\">
                      {new Date(submission.created_at).toLocaleString()}
                    </span>
                    {submission.contact_id && (
                      <span className=\"text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded\">
                        Contact Created
                      </span>
                    )}
                  </div>
                  <div className=\"grid grid-cols-2 gap-3\">
                    {Object.entries(submission.submission_data).map(([key, value]) => (
                      <div key={key}>
                        <span className=\"text-xs text-gray-600 font-medium\">{key}:</span>
                        <p className=\"text-sm text-gray-900\">{Array.isArray(value) ? value.join(', ') : value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forms;
