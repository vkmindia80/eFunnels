import React, { useState, useEffect } from 'react';
import api from '../api';
import { PlusIcon, BookOpenIcon, AcademicCapIcon, UserGroupIcon, PlayIcon, CheckCircleIcon, ClockIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

const Courses = ({ user }) => {
  const [activeTab, setActiveTab] = useState('my-courses'); // my-courses, students, memberships
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingMembership, setEditingMembership] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseBuilder, setShowCourseBuilder] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my-courses') {
        const [coursesRes, analyticsRes] = await Promise.all([
          api.get('/courses'),
          api.get('/courses/analytics/summary')
        ]);
        setCourses(coursesRes.data.courses || []);
        setAnalytics(analyticsRes.data || {});
      } else if (activeTab === 'students') {
        const enrollmentsRes = await api.get('/enrollments');
        setEnrollments(enrollmentsRes.data || []);
      } else if (activeTab === 'memberships') {
        const membershipsRes = await api.get('/memberships');
        setMemberships(membershipsRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (courseData) => {
    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, courseData);
      } else {
        await api.post('/courses', courseData);
      }
      fetchData();
      setShowCourseModal(false);
      setEditingCourse(null);
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course');
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/courses/${courseId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const publishCourse = async (courseId) => {
    try {
      await api.put(`/courses/${courseId}`, { status: 'published' });
      fetchData();
    } catch (error) {
      console.error('Error publishing course:', error);
      alert('Failed to publish course');
    }
  };

  const createMembership = async (membershipData) => {
    try {
      if (editingMembership) {
        await api.put(`/memberships/${editingMembership.id}`, membershipData);
      } else {
        await api.post('/memberships', membershipData);
      }
      fetchData();
      setShowMembershipModal(false);
      setEditingMembership(null);
    } catch (error) {
      console.error('Error saving membership:', error);
      alert('Failed to save membership');
    }
  };

  const deleteMembership = async (membershipId) => {
    if (!window.confirm('Are you sure? All active subscriptions will be cancelled.')) return;
    
    try {
      await api.delete(`/memberships/${membershipId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting membership:', error);
      alert('Failed to delete membership');
    }
  };

  const openCourseBuilder = (course) => {
    setSelectedCourse(course);
    setShowCourseBuilder(true);
  };

  if (showCourseBuilder && selectedCourse) {
    return <CourseBuilder course={selectedCourse} onBack={() => { setShowCourseBuilder(false); setSelectedCourse(null); fetchData(); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses & Memberships</h1>
        <p className="text-gray-600">Create and manage your educational content</p>
      </div>

      {/* Analytics Cards */}
      {activeTab === 'my-courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6" data-testid="total-courses-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.total_courses || 0}</p>
              </div>
              <BookOpenIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6" data-testid="total-students-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.total_students || 0}</p>
              </div>
              <UserGroupIcon className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6" data-testid="completion-rate-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.completion_rate || 0}%</p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6" data-testid="total-revenue-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${analytics.total_revenue || 0}</p>
              </div>
              <AcademicCapIcon className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('my-courses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-courses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="my-courses-tab"
            >
              <BookOpenIcon className="w-5 h-5 inline mr-2" />
              My Courses
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="students-tab"
            >
              <UserGroupIcon className="w-5 h-5 inline mr-2" />
              My Learning
            </button>
            <button
              onClick={() => setActiveTab('memberships')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'memberships'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="memberships-tab"
            >
              <AcademicCapIcon className="w-5 h-5 inline mr-2" />
              Memberships
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* My Courses Tab */}
            {activeTab === 'my-courses' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Courses</h2>
                  <button
                    onClick={() => { setEditingCourse(null); setShowCourseModal(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                    data-testid="create-course-button"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Course
                  </button>
                </div>

                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                    <p className="text-gray-600 mb-6">Create your first course to get started</p>
                    <button
                      onClick={() => setShowCourseModal(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      Create Your First Course
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div key={course.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpenIcon className="w-20 h-20 text-white" />
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              course.status === 'published' ? 'bg-green-100 text-green-800' :
                              course.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {course.status}
                            </span>
                            <span className="text-xs text-gray-500">{course.level}</span>
                          </div>
                          <h3 className="font-semibold text-lg mb-2 text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <UserGroupIcon className="w-4 h-4 mr-1" />
                              {course.total_students} students
                            </div>
                            <div className="flex items-center">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              {course.completion_rate}%
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => openCourseBuilder(course)}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                              data-testid={`edit-course-${course.id}`}
                            >
                              <PencilIcon className="w-4 h-4 inline mr-1" />
                              Edit
                            </button>
                            {course.status === 'draft' && (
                              <button
                                onClick={() => publishCourse(course.id)}
                                className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
                              >
                                Publish
                              </button>
                            )}
                            <button
                              onClick={() => deleteCourse(course.id)}
                              className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Learning Tab */}
            {activeTab === 'students' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">My Learning</h2>
                {enrollments.length === 0 ? (
                  <div className="text-center py-12">
                    <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments yet</h3>
                    <p className="text-gray-600">Enroll in courses to start learning</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                          {enrollment.course?.thumbnail ? (
                            <img src={enrollment.course.thumbnail} alt={enrollment.course.title} className="w-full h-full object-cover" />
                          ) : (
                            <PlayIcon className="w-20 h-20 text-white" />
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900">{enrollment.course?.title}</h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{enrollment.course?.description}</p>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium text-gray-900">{enrollment.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${enrollment.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {enrollment.completed_date && (
                            <div className="bg-green-50 border border-green-200 rounded p-2 mb-4">
                              <p className="text-sm text-green-800 font-medium">✅ Completed</p>
                            </div>
                          )}

                          <button
                            onClick={() => window.location.href = `/course-player/${enrollment.course_id}`}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            <PlayIcon className="w-5 h-5 inline mr-2" />
                            {enrollment.progress_percentage > 0 ? 'Continue Learning' : 'Start Course'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Memberships Tab */}
            {activeTab === 'memberships' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Membership Tiers</h2>
                  <button
                    onClick={() => { setEditingMembership(null); setShowMembershipModal(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                    data-testid="create-membership-button"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Membership
                  </button>
                </div>

                {memberships.length === 0 ? (
                  <div className="text-center py-12">
                    <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No memberships yet</h3>
                    <p className="text-gray-600 mb-6">Create membership tiers to monetize your content</p>
                    <button
                      onClick={() => setShowMembershipModal(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      Create Your First Membership
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {memberships.map((membership) => (
                      <div key={membership.id} className="border-2 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <h3 className="font-bold text-xl mb-2 text-gray-900">{membership.name}</h3>
                        <p className="text-gray-600 mb-4">{membership.description}</p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-blue-600">${membership.price}</span>
                          <span className="text-gray-600">/{membership.billing_period}</span>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                          <ul className="space-y-1">
                            {membership.features?.map((feature, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start">
                                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            <UserGroupIcon className="w-4 h-4 inline mr-1" />
                            {membership.total_subscribers} subscribers
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => { setEditingMembership(membership); setShowMembershipModal(true); }}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMembership(membership.id)}
                            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <CourseModal
          course={editingCourse}
          onClose={() => { setShowCourseModal(false); setEditingCourse(null); }}
          onSave={createCourse}
        />
      )}

      {/* Membership Modal */}
      {showMembershipModal && (
        <MembershipModal
          membership={editingMembership}
          courses={courses}
          onClose={() => { setShowMembershipModal(false); setEditingMembership(null); }}
          onSave={createMembership}
        />
      )}
    </div>
  );
};

// Course Modal Component
const CourseModal = ({ course, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || 'general',
    level: course?.level || 'beginner',
    language: course?.language || 'en',
    pricing_type: course?.pricing_type || 'free',
    price: course?.price || 0,
    currency: course?.currency || 'USD'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{course ? 'Edit Course' : 'Create New Course'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                data-testid="course-title-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                required
                data-testid="course-description-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="tech">Technology</option>
                  <option value="business">Business</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                  <option value="personal">Personal Development</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Type</label>
                <select
                  value={formData.pricing_type}
                  onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="membership">Membership</option>
                </select>
              </div>

              {formData.pricing_type === 'paid' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </>
              )}
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
                data-testid="save-course-button"
              >
                {course ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Membership Modal Component
const MembershipModal = ({ membership, courses, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: membership?.name || '',
    description: membership?.description || '',
    price: membership?.price || 0,
    currency: membership?.currency || 'USD',
    billing_period: membership?.billing_period || 'monthly',
    features: membership?.features || [''],
    course_ids: membership?.course_ids || []
  });

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, features: formData.features.filter(f => f.trim()) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{membership ? 'Edit Membership' : 'Create New Membership'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                data-testid="membership-name-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period</label>
                <select
                  value={formData.billing_period}
                  onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Feature description"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Feature
              </button>
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
                data-testid="save-membership-button"
              >
                {membership ? 'Update Membership' : 'Create Membership'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Course Builder Component (placeholder for now)
const CourseBuilder = ({ course, onBack }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
  }, []);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(`/courses/${course.id}`);
      setModules(response.data.modules || []);
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const addModule = async () => {
    const title = prompt('Enter module title:');
    if (!title) return;

    try {
      await api.post(`/courses/${course.id}/modules`, {
        title,
        description: '',
        order: modules.length
      });
      fetchCourseDetails();
    } catch (error) {
      console.error('Error adding module:', error);
      alert('Failed to add module');
    }
  };

  const addLesson = async (moduleId) => {
    const title = prompt('Enter lesson title:');
    if (!title) return;

    try {
      await api.post(`/courses/${course.id}/modules/${moduleId}/lessons`, {
        title,
        description: '',
        content_type: 'text',
        content: { text: '' },
        order: 0
      });
      fetchCourseDetails();
    } catch (error) {
      console.error('Error adding lesson:', error);
      alert('Failed to add lesson');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 flex items-center mb-4"
        >
          ← Back to Courses
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
        <p className="text-gray-600">Build your course content</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Course Curriculum</h2>
          <button
            onClick={addModule}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Module
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
            <p className="text-gray-600 mb-6">Add your first module to start building the course</p>
            <button
              onClick={addModule}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Add First Module
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div key={module.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Module {index + 1}: {module.title}</h3>
                    <p className="text-sm text-gray-600">{module.lessons?.length || 0} lessons</p>
                  </div>
                  <button
                    onClick={() => addLesson(module.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Lesson
                  </button>
                </div>

                {module.lessons && module.lessons.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <PlayIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm">Lesson {lessonIndex + 1}: {lesson.title}</span>
                          <span className="ml-2 text-xs text-gray-500">({lesson.content_type})</span>
                        </div>
                        {lesson.duration && (
                          <span className="text-xs text-gray-500">
                            <ClockIcon className="w-4 h-4 inline mr-1" />
                            {lesson.duration} min
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
