import React, { useState, useEffect } from 'react';
import api from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  PlusIcon, 
  BookOpenIcon, 
  PlayIcon, 
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const EnhancedCourseBuilder = ({ course, onBack }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [expandedModules, setExpandedModules] = useState(new Set());

  useEffect(() => {
    fetchCourseDetails();
  }, []);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(`/api/courses/${course.id}`);
      setModules(response.data.modules || []);
      // Expand all modules by default
      const allModuleIds = new Set(response.data.modules?.map(m => m.id) || []);
      setExpandedModules(allModuleIds);
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'module') {
      // Reorder modules
      const newModules = Array.from(modules);
      const [removed] = newModules.splice(source.index, 1);
      newModules.splice(destination.index, 0, removed);
      
      // Update order property
      const updatedModules = newModules.map((mod, idx) => ({
        ...mod,
        order: idx
      }));
      
      setModules(updatedModules);
      
      // Update on backend
      try {
        await Promise.all(updatedModules.map(mod =>
          api.put(`/api/courses/${course.id}/modules/${mod.id}`, { order: mod.order })
        ));
      } catch (error) {
        console.error('Error updating module order:', error);
        fetchCourseDetails(); // Revert on error
      }
    } else if (type === 'lesson') {
      // Reorder lessons within a module
      const moduleId = source.droppableId;
      const moduleIndex = modules.findIndex(m => m.id === moduleId);
      const module = modules[moduleIndex];
      
      const newLessons = Array.from(module.lessons || []);
      const [removed] = newLessons.splice(source.index, 1);
      newLessons.splice(destination.index, 0, removed);
      
      // Update order property
      const updatedLessons = newLessons.map((lesson, idx) => ({
        ...lesson,
        order: idx
      }));
      
      const newModules = [...modules];
      newModules[moduleIndex] = { ...module, lessons: updatedLessons };
      setModules(newModules);
      
      // Update on backend
      try {
        await Promise.all(updatedLessons.map(lesson =>
          api.put(`/api/courses/${course.id}/modules/${moduleId}/lessons/${lesson.id}`, { order: lesson.order })
        ));
      } catch (error) {
        console.error('Error updating lesson order:', error);
        fetchCourseDetails(); // Revert on error
      }
    }
  };

  const saveModule = async (moduleData) => {
    try {
      if (editingModule) {
        await api.put(`/api/courses/${course.id}/modules/${editingModule.id}`, moduleData);
      } else {
        await api.post(`/api/courses/${course.id}/modules`, {
          ...moduleData,
          order: modules.length
        });
      }
      fetchCourseDetails();
      setShowModuleModal(false);
      setEditingModule(null);
    } catch (error) {
      console.error('Error saving module:', error);
      alert('Failed to save module');
    }
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    
    try {
      await api.delete(`/api/courses/${course.id}/modules/${moduleId}`);
      fetchCourseDetails();
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Failed to delete module');
    }
  };

  const saveLesson = async (lessonData) => {
    try {
      if (editingLesson) {
        await api.put(
          `/api/courses/${course.id}/modules/${selectedModuleId}/lessons/${editingLesson.id}`,
          lessonData
        );
      } else {
        const module = modules.find(m => m.id === selectedModuleId);
        await api.post(`/api/courses/${course.id}/modules/${selectedModuleId}/lessons`, {
          ...lessonData,
          order: module.lessons?.length || 0
        });
      }
      fetchCourseDetails();
      setShowLessonModal(false);
      setEditingLesson(null);
      setSelectedModuleId(null);
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Failed to save lesson');
    }
  };

  const deleteLesson = async (moduleId, lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    
    try {
      await api.delete(`/courses/${course.id}/modules/${moduleId}/lessons/${lessonId}`);
      fetchCourseDetails();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson');
    }
  };

  const openAddLesson = (moduleId) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setShowLessonModal(true);
  };

  const openEditLesson = (moduleId, lesson) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(lesson);
    setShowLessonModal(true);
  };

  const getLessonIcon = (contentType) => {
    switch (contentType) {
      case 'video': return PlayIcon;
      case 'text': return DocumentTextIcon;
      case 'pdf': return DocumentTextIcon;
      case 'quiz': return QuestionMarkCircleIcon;
      default: return BookOpenIcon;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="enhanced-course-builder">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 flex items-center mb-4"
          data-testid="back-to-courses-button"
        >
          ← Back to Courses
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
        <p className="text-gray-600">Build your course content with drag & drop</p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {modules.length} modules • {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} lessons
        </div>
        <button
          onClick={() => { setEditingModule(null); setShowModuleModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          data-testid="add-module-button"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Module
        </button>
      </div>

      {/* Course Builder */}
      <div className="bg-white rounded-lg shadow">
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
            <p className="text-gray-600 mb-6">Add your first module to start building the course</p>
            <button
              onClick={() => setShowModuleModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Add First Module
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="modules" type="module">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="p-6 space-y-4"
                >
                  {modules.map((module, moduleIndex) => (
                    <Draggable key={module.id} draggableId={module.id} index={moduleIndex}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border rounded-lg ${
                            snapshot.isDragging ? 'shadow-2xl bg-blue-50' : 'bg-white'
                          }`}
                        >
                          {/* Module Header */}
                          <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <div {...provided.dragHandleProps} className="mr-3 cursor-move">
                                <Bars3Icon className="w-5 h-5 text-gray-400" />
                              </div>
                              <button
                                onClick={() => toggleModule(module.id)}
                                className="mr-3"
                              >
                                {expandedModules.has(module.id) ? (
                                  <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                                )}
                              </button>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  Module {moduleIndex + 1}: {module.title}
                                </h3>
                                {module.description && (
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {module.lessons?.length || 0} lessons
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openAddLesson(module.id)}
                                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                data-testid={`add-lesson-${module.id}`}
                              >
                                + Add Lesson
                              </button>
                              <button
                                onClick={() => { setEditingModule(module); setShowModuleModal(true); }}
                                className="p-2 text-gray-600 hover:text-blue-600"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => deleteModule(module.id)}
                                className="p-2 text-gray-600 hover:text-red-600"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Lessons */}
                          {expandedModules.has(module.id) && (
                            <Droppable droppableId={module.id} type="lesson">
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className="p-4 space-y-2"
                                >
                                  {module.lessons && module.lessons.length > 0 ? (
                                    module.lessons.map((lesson, lessonIndex) => {
                                      const LessonIcon = getLessonIcon(lesson.content_type);
                                      return (
                                        <Draggable
                                          key={lesson.id}
                                          draggableId={lesson.id}
                                          index={lessonIndex}
                                        >
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                                snapshot.isDragging
                                                  ? 'bg-blue-50 shadow-lg'
                                                  : 'bg-gray-50 hover:bg-gray-100'
                                              }`}
                                            >
                                              <div className="flex items-center flex-1">
                                                <div {...provided.dragHandleProps} className="mr-3 cursor-move">
                                                  <Bars3Icon className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <LessonIcon className="w-5 h-5 text-gray-500 mr-3" />
                                                <div>
                                                  <p className="font-medium text-gray-900">
                                                    Lesson {lessonIndex + 1}: {lesson.title}
                                                  </p>
                                                  <p className="text-xs text-gray-500">
                                                    {lesson.content_type}
                                                    {lesson.duration && ` • ${lesson.duration} min`}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <button
                                                  onClick={() => openEditLesson(module.id, lesson)}
                                                  className="p-1.5 text-gray-600 hover:text-blue-600"
                                                  data-testid={`edit-lesson-${lesson.id}`}
                                                >
                                                  <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => deleteLesson(module.id, lesson.id)}
                                                  className="p-1.5 text-gray-600 hover:text-red-600"
                                                >
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })
                                  ) : (
                                    <div className="text-center py-6 text-gray-500 text-sm">
                                      No lessons yet. Click "Add Lesson" to get started.
                                    </div>
                                  )}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
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

      {/* Module Modal */}
      {showModuleModal && (
        <ModuleModal
          module={editingModule}
          onClose={() => { setShowModuleModal(false); setEditingModule(null); }}
          onSave={saveModule}
        />
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => { setShowLessonModal(false); setEditingLesson(null); setSelectedModuleId(null); }}
          onSave={saveLesson}
        />
      )}
    </div>
  );
};

// Module Modal Component
const ModuleModal = ({ module, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: module?.title || '',
    description: module?.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{module ? 'Edit Module' : 'Add New Module'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g., Introduction to the Course"
                data-testid="module-title-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Brief description of what this module covers"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="save-module-button"
              >
                {module ? 'Update Module' : 'Add Module'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Lesson Modal Component  
const LessonModal = ({ lesson, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    content_type: lesson?.content_type || 'text',
    duration: lesson?.duration || 0,
    content: lesson?.content || {}
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderContentEditor = () => {
    switch (formData.content_type) {
      case 'video':
        return <VideoEditor formData={formData} setFormData={setFormData} />;
      case 'text':
        return <TextEditor formData={formData} setFormData={setFormData} />;
      case 'pdf':
        return <PDFEditor formData={formData} setFormData={setFormData} />;
      case 'quiz':
        return <QuizEditor formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{lesson ? 'Edit Lesson' : 'Add New Lesson'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., Introduction to Variables"
                  data-testid="lesson-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="e.g., 15"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Brief description of the lesson"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'video', icon: PlayIcon, label: 'Video' },
                  { value: 'text', icon: DocumentTextIcon, label: 'Text' },
                  { value: 'pdf', icon: DocumentTextIcon, label: 'PDF' },
                  { value: 'quiz', icon: QuestionMarkCircleIcon, label: 'Quiz' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, content_type: value, content: {} })}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-colors ${
                      formData.content_type === value
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`content-type-${value}`}
                  >
                    <Icon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Editor */}
            <div className="border-t pt-6">
              {renderContentEditor()}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="save-lesson-button"
              >
                {lesson ? 'Update Lesson' : 'Add Lesson'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Video Editor Component
const VideoEditor = ({ formData, setFormData }) => {
  const [videoSource, setVideoSource] = useState(formData.content?.file_url ? 'file' : 'url');

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Video Configuration</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Video Source</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="url"
              checked={videoSource === 'url'}
              onChange={(e) => setVideoSource(e.target.value)}
              className="mr-2"
            />
            <span>YouTube/Vimeo URL</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="file"
              checked={videoSource === 'file'}
              onChange={(e) => setVideoSource(e.target.value)}
              className="mr-2"
            />
            <span>File Upload</span>
          </label>
        </div>
      </div>

      {videoSource === 'url' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
          <input
            type="url"
            value={formData.content?.url || ''}
            onChange={(e) => setFormData({
              ...formData,
              content: { ...formData.content, url: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.youtube.com/embed/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Use embed URL format for YouTube/Vimeo
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video File URL</label>
          <input
            type="url"
            value={formData.content?.file_url || ''}
            onChange={(e) => setFormData({
              ...formData,
              content: { ...formData.content, file_url: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/video.mp4"
          />
          <p className="text-xs text-gray-500 mt-1">
            Direct link to video file (.mp4, .webm, etc.)
          </p>
        </div>
      )}
    </div>
  );
};

// Text Editor Component
const TextEditor = ({ formData, setFormData }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Text Content</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Content</label>
        <textarea
          value={formData.content?.text || ''}
          onChange={(e) => setFormData({
            ...formData,
            content: { ...formData.content, text: e.target.value }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
          rows="12"
          placeholder="Enter lesson content here. You can use HTML tags for formatting."
          data-testid="text-content-input"
        />
        <p className="text-xs text-gray-500 mt-1">
          Supports HTML formatting: &lt;h1&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;code&gt;, etc.
        </p>
      </div>
    </div>
  );
};

// PDF Editor Component
const PDFEditor = ({ formData, setFormData }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">PDF Document</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">PDF URL</label>
        <input
          type="url"
          value={formData.content?.url || ''}
          onChange={(e) => setFormData({
            ...formData,
            content: { ...formData.content, url: e.target.value }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/document.pdf"
        />
        <p className="text-xs text-gray-500 mt-1">
          Direct link to PDF file
        </p>
      </div>
    </div>
  );
};

// Quiz Editor Component
const QuizEditor = ({ formData, setFormData }) => {
  const [questions, setQuestions] = useState(formData.content?.questions || []);

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      answers: ['', '', '', ''],
      correct_answer: 0
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
    setFormData({
      ...formData,
      content: { ...formData.content, questions: newQuestions }
    });
  };

  const updateAnswer = (qIndex, aIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].answers[aIndex] = value;
    setQuestions(newQuestions);
    setFormData({
      ...formData,
      content: { ...formData.content, questions: newQuestions }
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    setFormData({
      ...formData,
      content: { ...formData.content, questions: newQuestions }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Quiz Questions</h3>
        <button
          type="button"
          onClick={addQuestion}
          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
          data-testid="add-quiz-question-button"
        >
          + Add Question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <QuestionMarkCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No questions yet. Click "Add Question" to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <div key={qIndex} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">Question {qIndex + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your question"
                  data-testid={`quiz-question-${qIndex}`}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Answers (select correct one)</label>
                  {question.answers.map((answer, aIndex) => (
                    <div key={aIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={question.correct_answer === aIndex}
                        onChange={() => updateQuestion(qIndex, 'correct_answer', aIndex)}
                        className="flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`Answer ${aIndex + 1}`}
                        data-testid={`quiz-answer-${qIndex}-${aIndex}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedCourseBuilder;
