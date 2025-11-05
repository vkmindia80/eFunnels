import React, { useState, useRef, useEffect } from 'react';
import {
  Save, X, Monitor, Smartphone, Tablet, Eye, Code, Undo, Redo,
  Plus, Trash2, Copy, Edit, Move, Palette, Type, Layout, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Link,
  GripVertical, ChevronDown, Settings, Sparkles, Layers
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import BlockLibrary from './BlockLibrary';
import InlineEditor from './InlineEditor';
import StylePanel from './StylePanel';
import { createDefaultBlock } from './blockDefinitions';

const WixPageBuilder = ({ page, onSave, onClose }) => {
  const [blocks, setBlocks] = useState(page?.content?.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [showBlockLibrary, setShowBlockLibrary] = useState(true);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // Block ID being edited inline
  const [history, setHistory] = useState([blocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [pageStatus, setPageStatus] = useState(page?.status || 'draft');
  
  const canvasRef = useRef(null);

  // Save to history for undo/redo
  const saveToHistory = (newBlocks) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const addBlock = (blockType) => {
    const newBlock = createDefaultBlock(blockType);
    if (newBlock) {
      const newBlocks = [...blocks, newBlock];
      setBlocks(newBlocks);
      saveToHistory(newBlocks);
      setSelectedBlockId(newBlock.id);
    }
  };

  const duplicateBlock = (blockId) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex !== -1) {
      const blockToDuplicate = blocks[blockIndex];
      const newBlock = {
        ...JSON.parse(JSON.stringify(blockToDuplicate)),
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex + 1, 0, newBlock);
      setBlocks(newBlocks);
      saveToHistory(newBlocks);
    }
  };

  const deleteBlock = (blockId) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const updateBlock = (blockId, updates) => {
    const newBlocks = blocks.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    );
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

  const updateBlockContent = (blockId, contentUpdates) => {
    const newBlocks = blocks.map(b => 
      b.id === blockId ? { ...b, content: { ...b.content, ...contentUpdates } } : b
    );
    setBlocks(newBlocks);
  };

  const updateBlockStyle = (blockId, styleUpdates) => {
    const newBlocks = blocks.map(b => 
      b.id === blockId ? { ...b, style: { ...b.style, ...styleUpdates } } : b
    );
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

  const onDragEnd = (result) => {
    setDraggedOverIndex(null);
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items);
    saveToHistory(items);
  };

  const handleSave = async () => {
    await onSave({ ...page, content: { blocks }, status: pageStatus });
  };

  const handlePublish = async () => {
    setPageStatus('published');
    await onSave({ ...page, content: { blocks }, status: 'published' });
    alert('Page published successfully!');
  };

  const handleUnpublish = async () => {
    setPageStatus('draft');
    await onSave({ ...page, content: { blocks }, status: 'draft' });
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const getCanvasWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers size={24} className="text-blue-600" />
            {page?.title || 'Page Builder'}
          </h2>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo size={20} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo size={20} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          {/* Preview Mode Selector */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              title="Desktop View"
            >
              <Monitor size={20} />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              title="Tablet View"
            >
              <Tablet size={20} />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              title="Mobile View"
            >
              <Smartphone size={20} />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          {/* Block Library Toggle */}
          <button
            onClick={() => setShowBlockLibrary(!showBlockLibrary)}
            className={`px-3 py-2 rounded-lg font-medium flex items-center gap-2 ${
              showBlockLibrary ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Plus size={20} />
            Add Blocks
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Preview Button */}
          <button
            onClick={togglePreview}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center gap-2"
            title={isPreviewMode ? "Exit Preview" : "Preview Page"}
          >
            <Eye size={20} />
            {isPreviewMode ? 'Exit Preview' : 'Preview'}
          </button>

          {/* Publish/Unpublish Button */}
          {pageStatus === 'published' ? (
            <button
              onClick={handleUnpublish}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center gap-2"
            >
              <X size={20} />
              Unpublish
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              <Eye size={20} />
              Publish
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
          >
            <Save size={20} />
            Save Draft
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Block Library Sidebar */}
        {showBlockLibrary && (
          <BlockLibrary
            onAddBlock={addBlock}
            onClose={() => setShowBlockLibrary(false)}
          />
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50" ref={canvasRef}>
          <div 
            className="mx-auto bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
            style={{ width: getCanvasWidth(), minHeight: '100%' }}
          >
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <Layers className="text-gray-300 mb-4" size={64} />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Building Your Page</h3>
                <p className="text-gray-600 text-center mb-6">Add blocks from the sidebar to create your page</p>
                <button
                  onClick={() => setShowBlockLibrary(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Your First Block
                </button>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="blocks">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={snapshot.isDraggingOver ? 'bg-blue-50' : ''}
                    >
                      {blocks.map((block, index) => (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`relative group ${
                                selectedBlockId === block.id ? 'ring-2 ring-blue-500' : ''
                              } ${hoveredBlockId === block.id ? 'ring-1 ring-blue-300' : ''} ${
                                snapshot.isDragging ? 'shadow-2xl opacity-90' : ''
                              }`}
                              onMouseEnter={() => setHoveredBlockId(block.id)}
                              onMouseLeave={() => setHoveredBlockId(null)}
                              onClick={() => setSelectedBlockId(block.id)}
                            >
                              {/* Drag Handle Bar - Always rendered for react-beautiful-dnd */}
                              <div
                                {...provided.dragHandleProps}
                                className={`absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-move bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all z-10 ${
                                  hoveredBlockId === block.id || selectedBlockId === block.id || snapshot.isDragging
                                    ? 'opacity-100'
                                    : 'opacity-0 pointer-events-none'
                                }`}
                                title="Drag to reorder"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical size={20} className="text-white" />
                              </div>

                              {/* Block Toolbar - Shows on Hover or Selection */}
                              <div className={`absolute top-2 right-2 z-10 flex gap-1 bg-white shadow-lg rounded-lg border border-gray-200 p-1 transition-opacity ${
                                hoveredBlockId === block.id || selectedBlockId === block.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                              }`}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsEditing(block.id);
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                    title="Edit Content"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBlockId(block.id);
                                      setShowStylePanel(true);
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                    title="Style Settings"
                                  >
                                    <Palette size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      duplicateBlock(block.id);
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                    title="Duplicate"
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteBlock(block.id);
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>

                              {/* Block Content with Inline Editing */}
                              {isEditing === block.id ? (
                                <InlineEditor
                                  block={block}
                                  onSave={(updates) => {
                                    updateBlockContent(block.id, updates);
                                    setIsEditing(null);
                                  }}
                                  onCancel={() => setIsEditing(null)}
                                />
                              ) : (
                                <BlockRenderer block={block} />
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>

        {/* Style Panel Sidebar */}
        {showStylePanel && selectedBlock && (
          <StylePanel
            block={selectedBlock}
            onStyleChange={(styleUpdates) => updateBlockStyle(selectedBlockId, styleUpdates)}
            onClose={() => setShowStylePanel(false)}
          />
        )}
      </div>
    </div>
  );
};

// Block Renderer Component
const BlockRenderer = ({ block }) => {
  const { type, content, style } = block;

  const containerStyle = {
    backgroundColor: style?.backgroundColor || 'transparent',
    color: style?.textColor || '#000',
    padding: style?.padding || '40px 20px',
    textAlign: style?.alignment || 'left',
    ...style?.customStyles
  };

  switch (type) {
    case 'hero':
      return (
        <div style={containerStyle} className="min-h-[400px] flex flex-col justify-center">
          <h1 style={{ 
            fontSize: style?.headingSize || '48px', 
            fontWeight: 'bold',
            marginBottom: '16px',
            fontFamily: style?.headingFont || 'inherit'
          }}>
            {content.headline || 'Your Headline Here'}
          </h1>
          <p style={{ 
            fontSize: style?.subheadingSize || '20px',
            marginBottom: '24px',
            opacity: 0.9
          }}>
            {content.subheadline || 'Your subheadline goes here'}
          </p>
          {content.cta_text && (
            <div>
              <button 
                className="px-8 py-3 rounded-lg font-semibold inline-block"
                style={{
                  backgroundColor: style?.buttonColor || '#3B82F6',
                  color: '#FFFFFF'
                }}
              >
                {content.cta_text}
              </button>
            </div>
          )}
        </div>
      );

    case 'text':
    case 'rich_text':
      return (
        <div style={containerStyle}>
          <div 
            className="prose max-w-none"
            style={{ fontFamily: style?.bodyFont || 'inherit', fontSize: style?.fontSize || '16px' }}
            dangerouslySetInnerHTML={{ __html: content.text || 'Click edit to add your text' }} 
          />
        </div>
      );

    case 'image':
      return (
        <div style={containerStyle}>
          {content.image_url ? (
            <img 
              src={content.image_url} 
              alt={content.alt_text || ''} 
              className="w-full rounded-lg"
              style={{ maxHeight: style?.imageHeight || 'auto' }}
            />
          ) : (
            <div className="bg-gray-200 h-64 flex items-center justify-center rounded-lg">
              <ImageIcon className="text-gray-400" size={64} />
            </div>
          )}
        </div>
      );

    case 'button':
      return (
        <div style={containerStyle}>
          <button 
            className="px-6 py-3 rounded-lg font-semibold"
            style={{
              backgroundColor: style?.buttonColor || '#3B82F6',
              color: style?.buttonTextColor || '#FFFFFF',
              fontSize: style?.fontSize || '16px'
            }}
          >
            {content.text || 'Button Text'}
          </button>
        </div>
      );

    case 'features':
      return (
        <div style={containerStyle}>
          <h2 className="text-3xl font-bold mb-8" style={{ textAlign: style?.alignment }}>
            {content.headline || 'Our Features'}
          </h2>
          <div className={`grid gap-6 ${style?.columns === 2 ? 'grid-cols-2' : style?.columns === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {(content.features || [{ title: 'Feature 1' }, { title: 'Feature 2' }, { title: 'Feature 3' }]).map((feature, i) => (
              <div key={i} className="p-6 bg-white border border-gray-200 rounded-lg">
                {feature.icon && <div className="text-4xl mb-4">{feature.icon}</div>}
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div style={containerStyle} className="p-6 bg-gray-50 border border-gray-200">
          <p className="text-gray-500">{type} block - Click edit to customize</p>
        </div>
      );
  }
};

export default WixPageBuilder;
