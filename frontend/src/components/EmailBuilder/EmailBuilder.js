import React, { useState } from 'react';
import { ArrowLeft, Save, Eye, Sparkles, Undo, Redo } from 'lucide-react';
import BlockLibrary from './BlockLibrary';
import Canvas from './Canvas';
import StylePanel from './StylePanel';
import PreviewPanel from './PreviewPanel';
import { createDefaultBlock } from './blocks';
import api from '../../api';

const EmailBuilder = ({ onBack, initialData = null, isTemplate = false, onSave }) => {
  const [blocks, setBlocks] = useState(initialData?.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [history, setHistory] = useState([initialData?.blocks || []]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailName, setEmailName] = useState(initialData?.name || '');
  const [emailSubject, setEmailSubject] = useState(initialData?.subject || '');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Add block to canvas
  const handleAddBlock = (blockType) => {
    const newBlock = createDefaultBlock(blockType);
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    addToHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  // Select block
  const handleSelectBlock = (blockId) => {
    setSelectedBlockId(blockId);
  };

  // Update block
  const handleUpdateBlock = (blockId, updatedBlock) => {
    const newBlocks = blocks.map((block) =>
      block.id === blockId ? updatedBlock : block
    );
    setBlocks(newBlocks);
    addToHistory(newBlocks);
  };

  // Delete block
  const handleDeleteBlock = (blockId) => {
    const newBlocks = blocks.filter((block) => block.id !== blockId);
    setBlocks(newBlocks);
    addToHistory(newBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  // Duplicate block
  const handleDuplicateBlock = (blockId) => {
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    const blockToDuplicate = blocks[blockIndex];
    const duplicatedBlock = {
      ...JSON.parse(JSON.stringify(blockToDuplicate)),
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const newBlocks = [
      ...blocks.slice(0, blockIndex + 1),
      duplicatedBlock,
      ...blocks.slice(blockIndex + 1),
    ];
    setBlocks(newBlocks);
    addToHistory(newBlocks);
  };

  // Reorder blocks
  const handleReorderBlocks = (startIndex, endIndex) => {
    const newBlocks = Array.from(blocks);
    const [removed] = newBlocks.splice(startIndex, 1);
    newBlocks.splice(endIndex, 0, removed);
    setBlocks(newBlocks);
    addToHistory(newBlocks);
  };

  // History management
  const addToHistory = (newBlocks) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  // AI Content Generation
  const handleAIGenerate = async () => {
    if (!emailSubject) {
      alert('Please enter an email subject first');
      return;
    }

    try {
      setAiGenerating(true);
      const response = await api.post('/api/email/ai/generate', {
        purpose: 'promotional',
        tone: 'professional',
        topic: emailSubject,
        length: 'medium',
      });

      // Parse AI content and create blocks
      const content = response.data.content;
      const aiBlocks = parseAIContentToBlocks(content);
      setBlocks(aiBlocks);
      addToHistory(aiBlocks);
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate AI content. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Parse AI content into blocks (simple parser)
  const parseAIContentToBlocks = (content) => {
    const lines = content.split('\n\n');
    const newBlocks = [];

    lines.forEach((line, index) => {
      if (line.trim()) {
        // Check if it's a heading (starts with # or is short and at the beginning)
        if (index === 0 && line.length < 100) {
          newBlocks.push({
            ...createDefaultBlock('heading'),
            content: line.replace(/^#+\s*/, ''),
          });
        } else {
          newBlocks.push({
            ...createDefaultBlock('paragraph'),
            content: line,
          });
        }
      }
    });

    // Add a CTA button at the end
    newBlocks.push(createDefaultBlock('button'));

    return newBlocks;
  };

  // Save template or campaign
  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async () => {
    if (!emailName || !emailSubject) {
      alert('Please enter both name and subject');
      return;
    }

    try {
      setIsSaving(true);
      const contentData = { blocks };

      if (isTemplate) {
        // Save as template
        if (initialData?.id) {
          await api.put(`/api/email/templates/${initialData.id}`, {
            name: emailName,
            subject: emailSubject,
            content: contentData,
          });
        } else {
          await api.post('/api/email/templates', {
            name: emailName,
            subject: emailSubject,
            content: contentData,
            category: 'custom',
          });
        }
      } else {
        // Pass back to parent (campaign wizard)
        if (onSave) {
          onSave({
            name: emailName,
            subject: emailSubject,
            content: contentData,
          });
        }
      }

      setShowSaveModal(false);
      if (isTemplate) {
        onBack();
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="flex flex-col h-screen">
      {/* Enhanced Toolbar */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-white/70 rounded-lg transition shadow-sm border border-gray-200 bg-white"
            title="Go back"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {isTemplate ? '✨ Email Template Builder' : '📧 Email Designer'}
            </h2>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium text-xs">
                {blocks.length} block{blocks.length !== 1 ? 's' : ''}
              </span>
              {blocks.length === 0 && <span className="text-gray-500">Start by adding blocks from the library</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <div className="flex gap-1 border-r border-gray-200 pr-3">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className={`p-2 rounded-lg transition ${
                historyIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Undo"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className={`p-2 rounded-lg transition ${
                historyIndex === history.length - 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Redo"
            >
              <Redo size={18} />
            </button>
          </div>

          {/* AI Generate */}
          <button
            onClick={handleAIGenerate}
            disabled={aiGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
          >
            <Sparkles size={18} className={aiGenerating ? 'animate-spin' : ''} />
            {aiGenerating ? 'Generating...' : 'AI Generate'}
          </button>

          {/* Preview */}
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Eye size={18} />
            Preview
          </button>

          {/* Save */}
          <button
            onClick={handleSaveClick}
            disabled={blocks.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Save
          </button>
        </div>
      </div>

      {/* Subject Line Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>📧</span>
            Email Subject Line
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter your email subject line here..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
            <button
              onClick={async () => {
                try {
                  setAiGenerating(true);
                  const response = await api.post('/api/ai/generate-headlines', {
                    topic: emailName || 'email campaign',
                    style: 'attention-grabbing'
                  });
                  if (response.data.headlines) {
                    // Take the first headline or parse the response
                    const headlines = typeof response.data.headlines === 'string' 
                      ? response.data.headlines.split('\n').filter(h => h.trim())
                      : response.data.headlines;
                    const firstHeadline = Array.isArray(headlines) ? headlines[0] : headlines;
                    setEmailSubject(firstHeadline?.replace(/^\d+\.\s*/, '').trim() || firstHeadline);
                  }
                } catch (error) {
                  console.error('Failed to generate subject:', error);
                  alert('Failed to generate subject line');
                } finally {
                  setAiGenerating(false);
                }
              }}
              disabled={aiGenerating}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 whitespace-nowrap"
              title="Generate subject line with AI"
            >
              <Sparkles size={18} className={aiGenerating ? 'animate-spin' : ''} />
              AI Subject
            </button>
          </div>
          {!emailSubject && (
            <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
              <span>⚠️</span>
              Subject line is required before saving
            </p>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Block Library */}
        <BlockLibrary onAddBlock={handleAddBlock} />

        {/* Canvas */}
        <Canvas
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={handleSelectBlock}
          onReorderBlocks={handleReorderBlocks}
          onDeleteBlock={handleDeleteBlock}
          onDuplicateBlock={handleDuplicateBlock}
        />

        {/* Style Panel */}
        <StylePanel
          block={selectedBlock}
          onUpdateBlock={handleUpdateBlock}
          onClose={() => setSelectedBlockId(null)}
        />
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewPanel blocks={blocks} onClose={() => setShowPreview(false)} />
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {isTemplate ? 'Save Template' : 'Save Email Design'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isTemplate ? 'Template' : 'Email'} Name
                </label>
                <input
                  type="text"
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {emailSubject || <span className="text-gray-400">No subject line entered</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Edit subject line in the main editor above
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfirm}
                disabled={isSaving || !emailName || !emailSubject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailBuilder;
