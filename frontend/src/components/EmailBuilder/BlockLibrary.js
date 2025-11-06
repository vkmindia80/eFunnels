import React, { useState } from 'react';
import { BLOCK_LIBRARY } from './blocks';
import { Plus } from 'lucide-react';

const BlockLibrary = ({ onAddBlock }) => {
  const [hoveredBlock, setHoveredBlock] = useState(null);

  return (
    <div className="w-72 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 overflow-y-auto shadow-sm" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <div className="p-1.5 bg-blue-500 rounded-lg">
            <Plus size={16} className="text-white" />
          </div>
          Block Library
        </h3>
        <p className="text-xs text-gray-600 mt-1.5 ml-8">Drag or click to add blocks to your email</p>
      </div>
      
      <div className="p-4 space-y-2">
        {BLOCK_LIBRARY.map((blockDef) => {
          const Icon = blockDef.icon;
          const isHovered = hoveredBlock === blockDef.type;
          
          return (
            <button
              key={blockDef.type}
              onClick={() => onAddBlock(blockDef.type)}
              onMouseEnter={() => setHoveredBlock(blockDef.type)}
              onMouseLeave={() => setHoveredBlock(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group transform ${
                isHovered
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md scale-105'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className={`p-2.5 rounded-lg transition-all ${
                isHovered
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 group-hover:from-blue-400 group-hover:to-blue-500 group-hover:text-white'
              }`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm transition-colors ${
                  isHovered ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  {blockDef.label}
                </div>
                <div className="text-xs text-gray-500 truncate">{blockDef.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Tips Section */}
      <div className="p-4 m-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
        <h4 className="font-semibold text-sm text-yellow-900 mb-2 flex items-center gap-2">
          💡 Quick Tips
        </h4>
        <ul className="text-xs text-yellow-800 space-y-1.5">
          <li>• Click blocks to add them instantly</li>
          <li>• Drag handles to reorder blocks</li>
          <li>• Select to edit in style panel</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockLibrary;
