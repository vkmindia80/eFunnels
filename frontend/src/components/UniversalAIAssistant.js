import React, { useState } from 'react';
import { Sparkles, X, Wand2, RefreshCw, Lightbulb, Loader } from 'lucide-react';
import api from '../api';

const UniversalAIAssistant = ({ module, context = {}, onApplyContent, inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Generate tab state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateType, setGenerateType] = useState('full');

  // Improve tab state
  const [improveContent, setImproveContent] = useState('');
  const [improveType, setImproveType] = useState('grammar');

  // Suggestions tab state
  const [suggestions, setSuggestions] = useState([]);

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.post('/api/ai/generate-content', {
        module,
        content_type: generateType,
        prompt: generatePrompt,
        context
      });
      setResult(response.data.content);
    } catch (err) {
      setError(err.response?.data?.detail || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!improveContent.trim()) {
      setError('Please enter content to improve');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.post('/api/ai/improve-content', {
        content: improveContent,
        improvement_type: improveType,
        target_keywords: context.keywords || []
      });
      setResult(response.data.improved_content);
    } catch (err) {
      setError(err.response?.data?.detail || 'Improvement failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/api/ai/smart-suggestions', {
        module,
        context
      });
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result && onApplyContent) {
      onApplyContent(result);
      setIsOpen(false);
      setResult(null);
    }
  };

  if (!isOpen && !inline) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition z-40"
        title="AI Assistant"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  // Render modal content directly to avoid remounting issues
  const modalContent = (
    <div className={inline ? '' : 'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col'}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-600">
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">AI Assistant</h3>
            <p className="text-white text-opacity-80 text-sm">
              {module.charAt(0).toUpperCase() + module.slice(1)} Module
            </p>
          </div>
        </div>
        {!inline && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('generate');
              setResult(null);
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'generate'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Wand2 size={18} />
            Generate
          </button>
          <button
            onClick={() => {
              setActiveTab('improve');
              setResult(null);
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'improve'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <RefreshCw size={18} />
            Improve
          </button>
          <button
            onClick={() => {
              setActiveTab('suggest');
              setResult(null);
              setError('');
              if (suggestions.length === 0) {
                handleGetSuggestions();
              }
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'suggest'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Lightbulb size={18} />
            Suggest
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={generateType}
                onChange={(e) => setGenerateType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="full">Full Content</option>
                <option value="headline">Headline/Subject</option>
                <option value="body">Body Text</option>
                <option value="description">Description</option>
                <option value="outline">Outline</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to create?
              </label>
              <textarea
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder={`Example: Write a welcome email for new customers in the fitness industry...`}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        )}

        {/* Improve Tab */}
        {activeTab === 'improve' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Improvement Type
              </label>
              <select
                value={improveType}
                onChange={(e) => setImproveType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="grammar">Fix Grammar & Spelling</option>
                <option value="clarity">Improve Clarity</option>
                <option value="engagement">Increase Engagement</option>
                <option value="seo">Optimize for SEO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content to Improve
              </label>
              <textarea
                value={improveContent}
                onChange={(e) => setImproveContent(e.target.value)}
                placeholder="Paste your content here..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={handleImprove}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Improving...
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  Improve Content
                </>
              )}
            </button>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggest' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Get AI-powered suggestions based on your current context and module.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin text-purple-500" size={32} />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-500 transition">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Lightbulb size={18} className="text-purple-600" />
                      </div>
                      <p className="text-gray-700 flex-1">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={handleGetSuggestions}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Lightbulb size={20} />
                Get Smart Suggestions
              </button>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Result */}
        {result && activeTab !== 'suggest' && (
          <div className="mt-6 space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles size={20} className="text-green-600" />
                AI Generated Result
              </h4>
              <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto">
                {typeof result === 'string' ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{result}</p>
                ) : (
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {onApplyContent && (
              <button
                onClick={handleApply}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
              >
                Apply This Content
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (inline) {
    return modalContent;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {modalContent}
    </div>
  );
};

export default UniversalAIAssistant;
