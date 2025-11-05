import React, { useState, useEffect } from 'react';
import { Upload, Image, Video, File, Search, Trash2, X } from 'lucide-react';
import api from '../../api';

const AssetManager = ({ onClose, onSelect }) => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const assetTypes = [
    { id: 'all', label: 'All Assets', icon: File },
    { id: 'image', label: 'Images', icon: Image },
    { id: 'video', label: 'Videos', icon: Video }
  ];

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, activeType, searchQuery]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/website/assets');
      setAssets(response.data.assets || []);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (activeType !== 'all') {
      filtered = filtered.filter(a => a.type === activeType);
    }

    if (searchQuery) {
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAssets(filtered);
  };

  const handleUpload = async () => {
    // Simulated upload - in real app would use file input
    const newAsset = {
      name: `New Asset ${Date.now()}`,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
      size: 102400,
      tags: []
    };

    try {
      const response = await api.post('/api/website/assets/upload', newAsset);
      setAssets([response.data.asset, ...assets]);
    } catch (error) {
      alert('Failed to upload asset');
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Delete this asset?')) return;

    try {
      await api.delete(`/api/website/assets/${assetId}`);
      setAssets(assets.filter(a => a.id !== assetId));
    } catch (error) {
      alert('Failed to delete asset');
    }
  };

  const handleSelect = (asset) => {
    onSelect(asset);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="asset-manager">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Asset Manager</h2>
            <p className="text-sm text-green-100">Manage your images, videos, and files</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 p-4 space-y-4">
          {/* Search & Upload */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={handleUpload}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              <Upload size={20} />
              Upload
            </button>
          </div>

          {/* Type Filters */}
          <div className="flex gap-2">
            {assetTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  activeType === type.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <type.icon size={16} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading assets...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No assets yet</h3>
              <p className="text-gray-600 mb-6">Upload your first asset to get started</p>
              <button
                onClick={handleUpload}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Upload Asset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition group cursor-pointer"
                  onClick={() => handleSelect(asset)}
                  data-testid={`asset-${asset.id}`}
                >
                  {/* Preview */}
                  <div className="relative h-40 bg-gray-100">
                    {asset.type === 'image' && asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <File className="text-gray-400" size={48} />
                      </div>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset.id);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{asset.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <p className="text-sm text-gray-600">
            {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssetManager;