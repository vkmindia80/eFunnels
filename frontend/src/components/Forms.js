import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, Copy, Download,
  Save, X, ArrowLeft, Settings, BarChart2, FileText,
  MessageSquare, CheckSquare, Calendar, Phone, Mail,
  Hash, AlignLeft, List, Star, Upload, Check, ChevronDown,
  ChevronUp, GripVertical, Link as LinkIcon, Sparkles, Wand2
} from 'lucide-react';
import api from '../api';
import { fieldTypes, renderFieldPreview } from './FormBuilder/fieldTypes';
import TemplateBrowser from './TemplateBrowser';
import UniversalAIAssistant from './UniversalAIAssistant';

const Forms = () => {
  const [activeTab, setActiveTab] = useState('forms'); // 'forms' or 'surveys'
  const [activeView, setActiveView] = useState('list'); // 'list', 'builder', 'submissions', 'analytics'
  
  // Forms state
  const [forms, setForms] = useState([]);
  const [currentForm, setCurrentForm] = useState(null);
  const [formFields, setFormFields] = useState([]);
  
  // Surveys state
  const [surveys, setSurveys] = useState([]);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  
  // Common state
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI & Template state
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [stats, setStats] = useState({
    totalForms: 0,
    totalSurveys: 0,
    totalSubmissions: 0,
    avgConversionRate: 0
  });

  useEffect(() => {
    if (activeView === 'list') {
      if (activeTab === 'forms') {
        loadForms();
      } else {
        loadSurveys();
      }
    }
  }, [activeView, activeTab, statusFilter]);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/forms', {
        params: { status: statusFilter === 'all' ? null : statusFilter }
      });
      setForms(response.data.forms || []);
      
      // Calculate stats
      const totalSubmissions = response.data.forms.reduce((sum, f) => sum + (f.total_submissions || 0), 0);
      const avgRate = response.data.forms.length > 0
        ? response.data.forms.reduce((sum, f) => sum + (f.conversion_rate || 0), 0) / response.data.forms.length
        : 0;
      
      setStats(prev => ({
        ...prev,
        totalForms: response.data.total || 0,
        totalSubmissions,
        avgConversionRate: avgRate
      }));
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/surveys', {
        params: { status: statusFilter === 'all' ? null : statusFilter }
      });
      setSurveys(response.data.surveys || []);
      
      setStats(prev => ({
        ...prev,
        totalSurveys: response.data.total || 0
      }));
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewForm = async () => {
    try {
      const newForm = {
        name: 'New Form',
        description: 'Form description',
        fields: [],
        settings: {
          submit_button_text: 'Submit',
          success_message: 'Thank you for your submission!',
          redirect_url: '',
          collect_email: true,
          require_email: true
        }
      };
      
      const response = await api.post('/api/forms', newForm);
      setCurrentForm(response.data);
      setFormFields(response.data.fields || []);
      setActiveView('builder');
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Failed to create form');
    }
  };

  const createNewSurvey = async () => {
    try {
      const newSurvey = {
        name: 'New Survey',
        description: 'Survey description',
        questions: [],
        settings: {
          allow_multiple_responses: false,
          show_progress_bar: true,
          randomize_questions: false
        }
      };
      
      const response = await api.post('/api/surveys', newSurvey);
      setCurrentSurvey(response.data);
      setSurveyQuestions(response.data.questions || []);
      setActiveView('builder');
    } catch (error) {
      console.error('Error creating survey:', error);
      alert('Failed to create survey');
    }
  };

  const saveForm = async () => {
    if (!currentForm) return;
    
    try {
      await api.put(`/api/forms/${currentForm.id}`, {
        name: currentForm.name,
        description: currentForm.description,
        fields: formFields,
        settings: currentForm.settings
      });
      alert('Form saved successfully!');
      loadForms();
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form');
    }
  };

  const saveSurvey = async () => {
    if (!currentSurvey) return;
    
    try {
      await api.put(`/api/surveys/${currentSurvey.id}`, {
        name: currentSurvey.name,
        description: currentSurvey.description,
        questions: surveyQuestions,
        settings: currentSurvey.settings
      });
      alert('Survey saved successfully!');
      loadSurveys();
    } catch (error) {
      console.error('Error saving survey:', error);
      alert('Failed to save survey');
    }
  };

  const deleteForm = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;
    
    try {
      await api.delete(`/api/forms/${formId}`);
      loadForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form');
    }
  };

  const deleteSurvey = async (surveyId) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) return;
    
    try {
      await api.delete(`/api/surveys/${surveyId}`);
      loadSurveys();
    } catch (error) {
      console.error('Error deleting survey:', error);
      alert('Failed to delete survey');
    }
  };

  const publishForm = async (formId) => {
    try {
      await api.put(`/api/forms/${formId}`, { status: 'active' });
      loadForms();
    } catch (error) {
      console.error('Error publishing form:', error);
    }
  };

  const publishSurvey = async (surveyId) => {
    try {
      await api.put(`/api/surveys/${surveyId}`, { status: 'active' });
      loadSurveys();
    } catch (error) {
      console.error('Error publishing survey:', error);
    }
  };

  const loadSubmissions = async (formId) => {
    try {
      const response = await api.get(`/api/forms/${formId}/submissions`);
      setSubmissions(response.data.submissions || []);
      setActiveView('submissions');
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const loadSurveyResponses = async (surveyId) => {
    try {
      const response = await api.get(`/api/surveys/${surveyId}/responses`);
      setSubmissions(response.data.responses || []);
      setActiveView('submissions');
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  };

  const loadAnalytics = async (id, type) => {
    try {
      const endpoint = type === 'form' ? `/api/forms/${id}/analytics` : `/api/surveys/${id}/analytics`;
      const response = await api.get(endpoint);
      setAnalytics(response.data);
      setActiveView('analytics');
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const addFormField = (fieldType) => {
    const field = fieldTypes.find(f => f.id === fieldType);
    if (!field) return;

    const newField = {
      id: `field_${Date.now()}`,
      field_type: field.type,
      label: field.defaultConfig.label,
      placeholder: field.defaultConfig.placeholder || '',
      required: field.defaultConfig.required || false,
      options: field.defaultConfig.options || [],
      validation: field.defaultConfig.validation || {},
      order: formFields.length
    };

    setFormFields([...formFields, newField]);
  };

  const removeFormField = (fieldId) => {
    setFormFields(formFields.filter(f => f.id !== fieldId));
  };

  const updateFormField = (fieldId, updates) => {
    setFormFields(formFields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const addSurveyQuestion = (questionType) => {
    const newQuestion = {
      id: `question_${Date.now()}`,
      question_type: questionType,
      question_text: 'Enter your question',
      required: true,
      options: questionType === 'multiple_choice' || questionType === 'checkbox' ? ['Option 1', 'Option 2', 'Option 3'] : [],
      order: surveyQuestions.length
    };

    setSurveyQuestions([...surveyQuestions, newQuestion]);
  };

  const removeSurveyQuestion = (questionId) => {
    setSurveyQuestions(surveyQuestions.filter(q => q.id !== questionId));
  };

  const updateSurveyQuestion = (questionId, updates) => {
    setSurveyQuestions(surveyQuestions.map(q => q.id === questionId ? { ...q, ...updates } : q));
  };

  const exportSubmissions = async (formId, format = 'csv') => {
    try {
      const response = await api.get(`/api/forms/${formId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form_submissions.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting submissions:', error);
    }
  };

  // Render List View
  const renderListView = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Forms</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalForms}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Surveys</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSurveys}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <MessageSquare className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckSquare className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Conversion</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgConversionRate.toFixed(1)}%</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <BarChart2 className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('forms')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'forms'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                data-testid="forms-tab"
              >
                <FileText className="inline mr-2" size={18} />
                Forms
              </button>
              <button
                onClick={() => setActiveTab('surveys')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'surveys'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                data-testid="surveys-tab"
              >
                <MessageSquare className="inline mr-2" size={18} />
                Surveys
              </button>
            </div>

            <button
              onClick={activeTab === 'forms' ? createNewForm : createNewSurvey}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              data-testid="create-new-button"
            >
              <Plus size={20} />
              Create {activeTab === 'forms' ? 'Form' : 'Survey'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 px-4 pb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="search-input"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="status-filter"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Items List */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : activeTab === 'forms' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(form => (
                <FormCard
                  key={form.id}
                  form={form}
                  onEdit={() => {
                    setCurrentForm(form);
                    setFormFields(form.fields || []);
                    setActiveView('builder');
                  }}
                  onDelete={() => deleteForm(form.id)}
                  onPublish={() => publishForm(form.id)}
                  onViewSubmissions={() => {
                    setCurrentForm(form);
                    loadSubmissions(form.id);
                  }}
                  onViewAnalytics={() => {
                    setCurrentForm(form);
                    loadAnalytics(form.id, 'form');
                  }}
                />
              ))}
              {forms.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <FileText className="mx-auto text-gray-400" size={48} />
                  <p className="mt-4 text-gray-600">No forms yet. Create your first form!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(survey => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onEdit={() => {
                    setCurrentSurvey(survey);
                    setSurveyQuestions(survey.questions || []);
                    setActiveView('builder');
                  }}
                  onDelete={() => deleteSurvey(survey.id)}
                  onPublish={() => publishSurvey(survey.id)}
                  onViewResponses={() => {
                    setCurrentSurvey(survey);
                    loadSurveyResponses(survey.id);
                  }}
                  onViewAnalytics={() => {
                    setCurrentSurvey(survey);
                    loadAnalytics(survey.id, 'survey');
                  }}
                />
              ))}
              {surveys.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <MessageSquare className="mx-auto text-gray-400" size={48} />
                  <p className="mt-4 text-gray-600">No surveys yet. Create your first survey!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Form Builder
  const renderFormBuilder = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveView('list');
              setCurrentForm(null);
              setFormFields([]);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            data-testid="back-to-list-button"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <input
              type="text"
              value={currentForm?.name || ''}
              onChange={(e) => setCurrentForm({ ...currentForm, name: e.target.value })}
              className="text-xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
              data-testid="form-name-input"
            />
            <p className="text-sm text-gray-600 mt-1">{formFields.length} fields</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            data-testid="save-form-button"
          >
            <Save size={20} />
            Save Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Field Library */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Field Types</h3>
          <div className="space-y-2">
            {fieldTypes.filter(f => f.category === 'basic').map(field => (
              <button
                key={field.id}
                onClick={() => addFormField(field.id)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                data-testid={`add-field-${field.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{field.icon}</span>
                  <span className="font-medium">{field.name}</span>
                </div>
              </button>
            ))}

            <div className="pt-4 border-t mt-4">
              <p className="text-xs text-gray-600 mb-2 font-semibold">ADVANCED</p>
              {fieldTypes.filter(f => f.category === 'choice' || f.category === 'advanced').map(field => (
                <button
                  key={field.id}
                  onClick={() => addFormField(field.id)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition mb-2"
                  data-testid={`add-field-${field.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{field.icon}</span>
                    <span className="font-medium">{field.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Canvas */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Form Preview</h3>
          <div className="space-y-4">
            {formFields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <FileText className="mx-auto text-gray-400" size={48} />
                <p className="mt-4 text-gray-600">Add fields from the left panel to start building your form</p>
              </div>
            ) : (
              formFields.map((field, index) => (
                <div
                  key={field.id}
                  onClick={() => setSelectedField(field)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedField?.id === field.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  data-testid={`form-field-${index}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderFieldPreview(field, '', () => {})}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFormField(field.id);
                      }}
                      className="text-red-600 hover:text-red-800 ml-2"
                      data-testid={`remove-field-${index}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Field Settings */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Field Settings</h3>
          {selectedField ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  value={selectedField.label}
                  onChange={(e) => updateFormField(selectedField.id, { label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="field-label-input"
                />
              </div>

              {selectedField.placeholder !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={selectedField.placeholder}
                    onChange={(e) => updateFormField(selectedField.id, { placeholder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="field-placeholder-input"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(e) => updateFormField(selectedField.id, { required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                    data-testid="field-required-checkbox"
                  />
                  <span className="text-sm font-medium text-gray-700">Required Field</span>
                </label>
              </div>

              {selectedField.options !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                  <textarea
                    value={Array.isArray(selectedField.options) ? selectedField.options.join('\n') : ''}
                    onChange={(e) => updateFormField(selectedField.id, { 
                      options: e.target.value.split('\n').filter(o => o.trim()) 
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="One option per line"
                    data-testid="field-options-textarea"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Select a field to edit its settings</p>
          )}
        </div>
      </div>
    </div>
  );

  // Render Survey Builder
  const renderSurveyBuilder = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveView('list');
              setCurrentSurvey(null);
              setSurveyQuestions([]);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            data-testid="back-to-list-button"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <input
              type="text"
              value={currentSurvey?.name || ''}
              onChange={(e) => setCurrentSurvey({ ...currentSurvey, name: e.target.value })}
              className="text-xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
              data-testid="survey-name-input"
            />
            <p className="text-sm text-gray-600 mt-1">{surveyQuestions.length} questions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveSurvey}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            data-testid="save-survey-button"
          >
            <Save size={20} />
            Save Survey
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Question Types */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Question Types</h3>
          <div className="space-y-2">
            <button
              onClick={() => addSurveyQuestion('text')}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
              data-testid="add-question-text"
            >
              <div className="flex items-center gap-2">
                <AlignLeft size={20} />
                <span className="font-medium">Short Answer</span>
              </div>
            </button>

            <button
              onClick={() => addSurveyQuestion('textarea')}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
              data-testid="add-question-textarea"
            >
              <div className="flex items-center gap-2">
                <FileText size={20} />
                <span className="font-medium">Long Answer</span>
              </div>
            </button>

            <button
              onClick={() => addSurveyQuestion('multiple_choice')}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
              data-testid="add-question-multiple-choice"
            >
              <div className="flex items-center gap-2">
                <List size={20} />
                <span className="font-medium">Multiple Choice</span>
              </div>
            </button>

            <button
              onClick={() => addSurveyQuestion('checkbox')}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
              data-testid="add-question-checkbox"
            >
              <div className="flex items-center gap-2">
                <CheckSquare size={20} />
                <span className="font-medium">Checkboxes</span>
              </div>
            </button>

            <button
              onClick={() => addSurveyQuestion('rating')}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
              data-testid="add-question-rating"
            >
              <div className="flex items-center gap-2">
                <Star size={20} />
                <span className="font-medium">Rating</span>
              </div>
            </button>
          </div>
        </div>

        {/* Survey Canvas */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Survey Preview</h3>
          <div className="space-y-4">
            {surveyQuestions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <MessageSquare className="mx-auto text-gray-400" size={48} />
                <p className="mt-4 text-gray-600">Add questions from the left panel to start building your survey</p>
              </div>
            ) : (
              surveyQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-4 border-2 border-gray-200 rounded-lg"
                  data-testid={`survey-question-${index}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="bg-purple-100 text-purple-600 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={question.question_text}
                        onChange={(e) => updateSurveyQuestion(question.id, { question_text: e.target.value })}
                        className="w-full text-lg font-medium border-b-2 border-transparent hover:border-gray-300 focus:border-purple-500 outline-none mb-3"
                        placeholder="Enter your question"
                        data-testid={`question-text-${index}`}
                      />

                      {(question.question_type === 'multiple_choice' || question.question_type === 'checkbox') && (
                        <div className="space-y-2">
                          <textarea
                            value={Array.isArray(question.options) ? question.options.join('\n') : ''}
                            onChange={(e) => updateSurveyQuestion(question.id, { 
                              options: e.target.value.split('\n').filter(o => o.trim()) 
                            })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="One option per line"
                            data-testid={`question-options-${index}`}
                          />
                        </div>
                      )}

                      {question.question_type === 'rating' && (
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map(num => (
                            <button key={num} className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:bg-purple-50">
                              {num}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeSurveyQuestion(question.id)}
                      className="text-red-600 hover:text-red-800"
                      data-testid={`remove-question-${index}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Submissions View
  const renderSubmissionsView = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('list')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            data-testid="back-to-list-button"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {activeTab === 'forms' ? 'Form Submissions' : 'Survey Responses'}
            </h2>
            <p className="text-sm text-gray-600">{currentForm?.name || currentSurvey?.name}</p>
          </div>
        </div>

        {activeTab === 'forms' && currentForm && (
          <div className="flex gap-2">
            <button
              onClick={() => exportSubmissions(currentForm.id, 'csv')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              data-testid="export-csv-button"
            >
              <Download size={20} />
              Export CSV
            </button>
            <button
              onClick={() => exportSubmissions(currentForm.id, 'excel')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              data-testid="export-excel-button"
            >
              <Download size={20} />
              Export Excel
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="submissions-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission, index) => (
                <tr key={submission.id} data-testid={`submission-row-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      {Object.entries(submission.submission_data || submission.responses || {}).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span>{' '}
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.contact_id || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {submissions.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare className="mx-auto text-gray-400" size={48} />
              <p className="mt-4 text-gray-600">No submissions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Analytics View
  const renderAnalyticsView = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('list')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            data-testid="back-to-list-button"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
            <p className="text-sm text-gray-600">{analytics?.form_name || analytics?.survey_name}</p>
          </div>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {activeTab === 'forms' ? 'Total Views' : 'Total Responses'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.total_views || analytics.total_responses || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Eye className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {activeTab === 'forms' ? 'Total Submissions' : 'Completed'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.total_submissions || analytics.completed_responses || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckSquare className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {activeTab === 'forms' ? 'Conversion Rate' : 'Completion Rate'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.conversion_rate || analytics.completion_rate || 0}%
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <BarChart2 className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {activeView === 'list' && renderListView()}
        {activeView === 'builder' && (activeTab === 'forms' ? renderFormBuilder() : renderSurveyBuilder())}
        {activeView === 'submissions' && renderSubmissionsView()}
        {activeView === 'analytics' && renderAnalyticsView()}
      </div>
    </div>
  );
};

// Form Card Component
const FormCard = ({ form, onEdit, onDelete, onPublish, onViewSubmissions, onViewAnalytics }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition" data-testid="form-card">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{form.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{form.description}</p>
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        form.status === 'active' ? 'bg-green-100 text-green-800' :
        form.status === 'draft' ? 'bg-gray-100 text-gray-800' :
        'bg-yellow-100 text-yellow-800'
      }`} data-testid="form-status">
        {form.status}
      </span>
    </div>

    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
      <div className="text-center p-2 bg-gray-50 rounded">
        <p className="text-gray-600">Fields</p>
        <p className="font-semibold">{form.fields?.length || 0}</p>
      </div>
      <div className="text-center p-2 bg-gray-50 rounded">
        <p className="text-gray-600">Views</p>
        <p className="font-semibold">{form.total_views || 0}</p>
      </div>
      <div className="text-center p-2 bg-gray-50 rounded">
        <p className="text-gray-600">Submits</p>
        <p className="font-semibold">{form.total_submissions || 0}</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
        data-testid="edit-form-button"
      >
        <Edit size={16} />
        Edit
      </button>
      <button
        onClick={onViewSubmissions}
        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
        data-testid="view-submissions-button"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={onViewAnalytics}
        className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
        data-testid="view-analytics-button"
      >
        <BarChart2 size={16} />
      </button>
      <button
        onClick={onDelete}
        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
        data-testid="delete-form-button"
      >
        <Trash2 size={16} />
      </button>
    </div>

    {form.status === 'draft' && (
      <button
        onClick={onPublish}
        className="w-full mt-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
        data-testid="publish-form-button"
      >
        Publish Form
      </button>
    )}
  </div>
);

// Survey Card Component
const SurveyCard = ({ survey, onEdit, onDelete, onPublish, onViewResponses, onViewAnalytics }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition" data-testid="survey-card">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{survey.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        survey.status === 'active' ? 'bg-green-100 text-green-800' :
        survey.status === 'draft' ? 'bg-gray-100 text-gray-800' :
        'bg-yellow-100 text-yellow-800'
      }`} data-testid="survey-status">
        {survey.status}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
      <div className="text-center p-2 bg-gray-50 rounded">
        <p className="text-gray-600">Questions</p>
        <p className="font-semibold">{survey.questions?.length || 0}</p>
      </div>
      <div className="text-center p-2 bg-gray-50 rounded">
        <p className="text-gray-600">Responses</p>
        <p className="font-semibold">{survey.total_responses || 0}</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
        data-testid="edit-survey-button"
      >
        <Edit size={16} />
        Edit
      </button>
      <button
        onClick={onViewResponses}
        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
        data-testid="view-responses-button"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={onViewAnalytics}
        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
        data-testid="view-survey-analytics-button"
      >
        <BarChart2 size={16} />
      </button>
      <button
        onClick={onDelete}
        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
        data-testid="delete-survey-button"
      >
        <Trash2 size={16} />
      </button>
    </div>

    {survey.status === 'draft' && (
      <button
        onClick={onPublish}
        className="w-full mt-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
        data-testid="publish-survey-button"
      >
        Publish Survey
      </button>
    )}
  </div>
);

export default Forms;
