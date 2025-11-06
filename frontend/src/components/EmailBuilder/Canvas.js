import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, Trash2, Copy } from 'lucide-react';
import { BlockRenderer } from './blocks';

const Canvas = ({ blocks, selectedBlockId, onSelectBlock, onReorderBlocks, onDeleteBlock, onDuplicateBlock }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onReorderBlocks(result.source.index, result.destination.index);
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 overflow-y-auto p-6" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 backdrop-blur-sm">
          {blocks.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-4 inline-block p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl">
                <svg className="mx-auto h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start Building Your Email</h3>
              <p className="text-gray-600 mb-4">Click blocks from the library to add them to your canvas</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Tip:</span>
                <span>Start with a heading, then add your content blocks</span>
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="email-canvas">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {blocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group relative ${
                              snapshot.isDragging ? 'opacity-50' : ''
                            }`}
                          >
                            {/* Block Actions */}
                            <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition flex flex-col gap-1">
                              <button
                                {...provided.dragHandleProps}
                                className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-move"
                                title="Drag to reorder"
                              >
                                <GripVertical size={16} className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => onDuplicateBlock(block.id)}
                                className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50"
                                title="Duplicate"
                              >
                                <Copy size={16} className="text-gray-600" />
                              </button>
                              <button
                                onClick={() => onDeleteBlock(block.id)}
                                className="p-1.5 bg-white border border-gray-200 rounded hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </button>
                            </div>

                            {/* Block Content */}
                            <div className="pl-8">
                              <BlockRenderer
                                block={block}
                                isSelected={selectedBlockId === block.id}
                                onClick={() => onSelectBlock(block.id)}
                              />
                            </div>
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
    </div>
  );
};

export default Canvas;
