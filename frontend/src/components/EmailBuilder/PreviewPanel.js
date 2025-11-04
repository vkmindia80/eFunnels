import React, { useState } from 'react';
import { Monitor, Smartphone, X, Code, Eye } from 'lucide-react';
import { blocksToHTML } from './utils';

const PreviewPanel = ({ blocks, onClose }) => {
  const [viewMode, setViewMode] = useState('desktop'); // desktop, mobile
  const [previewMode, setPreviewMode] = useState('visual'); // visual, html

  const htmlContent = blocksToHTML(blocks);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
            
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
                  viewMode === 'desktop'
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Monitor size={16} />
                Desktop
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
                  viewMode === 'mobile'
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Smartphone size={16} />
                Mobile
              </button>
            </div>

            {/* Preview Mode Toggle */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setPreviewMode('visual')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
                  previewMode === 'visual'
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Eye size={16} />
                Visual
              </button>
              <button
                onClick={() => setPreviewMode('html')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
                  previewMode === 'html'
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Code size={16} />
                HTML
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          {previewMode === 'visual' ? (
            <div className="flex justify-center">
              <div
                className="bg-white shadow-lg"
                style={{
                  width: viewMode === 'desktop' ? '800px' : '375px',
                  maxWidth: '100%',
                  transition: 'width 0.3s',
                }}
              >
                <iframe
                  srcDoc={htmlContent}
                  title="Email Preview"
                  className="w-full border-0"
                  style={{ minHeight: '600px' }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                  {htmlContent}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
