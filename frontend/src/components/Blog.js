import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Search, Filter, Edit, Trash2, Eye, Save,
  X, Tag, FolderOpen, MessageSquare, Calendar, Clock,
  TrendingUp, CheckCircle, Circle, Upload, Link as LinkIcon,
  Bold, Italic, List, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Code, Heading1, Heading2, Heading3
} from 'lucide-react';
import api from '../api';

const Blog = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    views: 0
  });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchTags();
    calculateStats();
  }, [searchTerm, statusFilter, categoryFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      
      const response = await api.get(`/api/blog/posts?${params}`);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/blog/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/api/blog/tags');
      setTags(response.data.tags || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const calculateStats = () => {
    const total = posts.length;
    const published = posts.filter(p => p.status === 'published').length;
    const draft = posts.filter(p => p.status === 'draft').length;
    const views = posts.reduce((sum, p) => sum + (p.total_views || 0), 0);
    setStats({ total, published, draft, views });
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/api/blog/posts/${postId}`);
      fetchPosts();
    } catch (error) {
      alert('Failed to delete post');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/api/blog/categories/${categoryId}`);
      fetchCategories();
    } catch (error) {
      alert('Failed to delete category');
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Delete this tag?')) return;
    try {
      await api.delete(`/api/blog/tags/${tagId}`);
      fetchTags();
    } catch (error) {
      alert('Failed to delete tag');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      data-testid="search-posts-input"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setCurrentPost(null);
                    setShowPostModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                  data-testid="create-post-btn"
                >
                  <Plus size={20} />
                  New Post
                </button>
              </div>
            </div>

            {/* Posts Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="spinner mx-auto"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No blog posts yet</h3>
                <p className="text-gray-600 mb-6">Create your first blog post to get started</p>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                  <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition" data-testid={`post-card-${post.id}`}>
                    {post.featured_image && (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          post.status === 'published' ? 'bg-green-100 text-green-700' :
                          post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {post.status === 'published' ? <CheckCircle size={14} className="inline mr-1" /> : <Circle size={14} className="inline mr-1" />}
                          {post.status}
                        </span>
                        {post.category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {post.category}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {post.total_views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            {post.total_comments || 0}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {post.average_reading_time || 5} min
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentPost(post);
                            setShowPostModal(true);
                          }}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                          data-testid={`edit-post-${post.id}`}
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Categories</h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                data-testid="create-category-btn"
              >
                <Plus size={20} />
                New Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(category => (
                <div key={category.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FolderOpen className="text-white" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-500">{category.post_count || 0} posts</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600">{category.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'tags':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Tags</h3>
              <button
                onClick={() => setShowTagModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                data-testid="create-tag-btn"
              >
                <Plus size={20} />
                New Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="bg-white rounded-lg shadow-md px-4 py-2 flex items-center gap-3 hover:shadow-lg transition"
                >
                  <Tag size={18} className="text-blue-600" />
                  <span className="font-medium text-gray-900">{tag.name}</span>
                  <span className="text-sm text-gray-500">({tag.post_count || 0})</span>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-4">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Published</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.published}</p>
            </div>
            <div className="bg-green-100 rounded-xl p-4">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Drafts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.draft}</p>
            </div>
            <div className="bg-yellow-100 rounded-xl p-4">
              <Circle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Views</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.views}</p>
            </div>
            <div className="bg-purple-100 rounded-xl p-4">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6" data-testid="blog-tabs">
            {[
              { id: 'posts', label: 'Posts', icon: FileText },
              { id: 'categories', label: 'Categories', icon: FolderOpen },
              { id: 'tags', label: 'Tags', icon: Tag },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
      {showPostModal && (
        <PostModal
          post={currentPost}
          categories={categories}
          tags={tags}
          onClose={() => {
            setShowPostModal(false);
            setCurrentPost(null);
          }}
          onSave={() => {
            fetchPosts();
            setShowPostModal(false);
            setCurrentPost(null);
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onSave={() => {
            fetchCategories();
            setShowCategoryModal(false);
          }}
        />
      )}

      {showTagModal && (
        <TagModal
          onClose={() => setShowTagModal(false)}
          onSave={() => {
            fetchTags();
            setShowTagModal(false);
          }}
        />
      )}
    </div>
  );
};

// Post Modal with WYSIWYG Editor
const PostModal = ({ post, categories, tags, onClose, onSave }) => {
  const [formData, setFormData] = useState(post || {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category: '',
    tags: [],
    status: 'draft',
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });
  const [imageUploadType, setImageUploadType] = useState('url');
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (post) {
        await api.put(`/api/blog/posts/${post.id}`, formData);
      } else {
        await api.post('/api/blog/posts', formData);
      }
      onSave();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save post');
    }
  };

  const handleImageUpload = async (file) => {
    // For now, we'll use a placeholder URL
    // In production, this would upload to a storage service
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, featured_image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="post-modal">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {post ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter post title"
              data-testid="post-title-input"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Brief summary of the post"
            />
          </div>

          {/* WYSIWYG Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            
            {/* Editor Toolbar */}
            <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => applyFormat('bold')}
                className="p-2 hover:bg-gray-200 rounded"
                title="Bold"
              >
                <Bold size={18} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('italic')}
                className="p-2 hover:bg-gray-200 rounded"
                title="Italic"
              >
                <Italic size={18} />
              </button>
              <div className="w-px bg-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={() => applyFormat('formatBlock', '<h1>')}
                className="p-2 hover:bg-gray-200 rounded"
                title="Heading 1"
              >
                <Heading1 size={18} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('formatBlock', '<h2>')}
                className="p-2 hover:bg-gray-200 rounded"
                title="Heading 2"
              >
                <Heading2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('formatBlock', '<h3>')}
                className="p-2 hover:bg-gray-200 rounded"
                title="Heading 3"
              >
                <Heading3 size={18} />
              </button>
              <div className="w-px bg-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={() => applyFormat('justifyLeft')}
                className="p-2 hover:bg-gray-200 rounded"
                title="Align Left"
              >
                <AlignLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('justifyCenter')}
                className="p-2 hover:bg-gray-200 rounded"
                title="Align Center"
              >
                <AlignCenter size={18} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('justifyRight')}
                className="p-2 hover:bg-gray-200 rounded"
                title="Align Right"
              >
                <AlignRight size={18} />
              </button>
              <div className="w-px bg-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={() => applyFormat('insertUnorderedList')}
                className="p-2 hover:bg-gray-200 rounded"
                title="Bullet List"
              >
                <List size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter image URL:');
                  if (url) applyFormat('insertImage', url);
                }}
                className="p-2 hover:bg-gray-200 rounded"
                title="Insert Image"
              >
                <ImageIcon size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter link URL:');
                  if (url) applyFormat('createLink', url);
                }}
                className="p-2 hover:bg-gray-200 rounded"
                title="Insert Link"
              >
                <LinkIcon size={18} />
              </button>
            </div>
            
            {/* Content Area */}
            <div
              ref={contentRef}
              contentEditable
              onInput={(e) => setFormData({ ...formData, content: e.currentTarget.innerHTML })}
              dangerouslySetInnerHTML={{ __html: formData.content }}
              className="w-full min-h-[300px] px-4 py-3 border border-t-0 border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              data-testid="post-content-editor"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setImageUploadType('url')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  imageUploadType === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setImageUploadType('upload')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  imageUploadType === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Upload Image
              </button>
            </div>

            {imageUploadType === 'url' ? (
              <input
                type="url"
                value={formData.featured_image}
                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                </label>
              </div>
            )}

            {formData.featured_image && (
              <img
                src={formData.featured_image}
                alt="Preview"
                className="mt-3 w-full h-48 object-cover rounded-lg"
              />
            )}
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optimized title for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Description
                </label>
                <textarea
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description for search results"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Keywords
                </label>
                <input
                  type="text"
                  value={formData.seo_keywords}
                  onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
              data-testid="save-post-btn"
            >
              <Save size={20} />
              {post ? 'Update Post' : 'Create Post'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Modal
const CategoryModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/blog/categories', formData);
      onSave();
    } catch (error) {
      alert('Failed to create category');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">New Category</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="category-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Create Category
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Tag Modal
const TagModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/blog/tags', formData);
      onSave();
    } catch (error) {
      alert('Failed to create tag');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">New Tag</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tag Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Technology, Business"
              data-testid="tag-name-input"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Create Tag
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Blog;