import React from 'react';
import { BLOCK_LIBRARY } from './blocks';

const BlockLibrary = ({ onAddBlock }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Block Library</h3>
        <p className="text-xs text-gray-500 mt-1">Click to add blocks</p>
      </div>
      
      <div className="p-3 space-y-2">
        {BLOCK_LIBRARY.map((blockDef) => {
          const Icon = blockDef.icon;
          return (
            <button
              key={blockDef.type}
              onClick={() => onAddBlock(blockDef.type)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-left group"
            >
              <div className="p-2 bg-gray-100 rounded group-hover:bg-blue-500 group-hover:text-white transition">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{blockDef.label}</div>
                <div className="text-xs text-gray-500">{blockDef.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BlockLibrary;
