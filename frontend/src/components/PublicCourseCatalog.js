import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const PublicCourseCatalog = ({ onBack, user }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPublicCourses();
  }, []);

  const fetchPublicCourses = async () => {
    try {
      const response = await api.get('/courses/public/list');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching public courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewCourseDetails = async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/public/preview`);
      setSelectedCourse(response.data);
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const enrollInCourse = async (courseId) => {
    try {
      // Get student info from current user
      const studentName = user?.full_name || 'Student';
      const studentEmail = user?.email || 'student@example.com';
      
      await api.post(`/courses/${courseId}/enroll`, {
        student_name: studentName,
        student_email: studentEmail,
        payment_method: 'mock'
      });
      alert('Successfully enrolled in course!');
      setShowEnrollModal(false);
      setSelectedCourse(null);
      if (onBack) onBack();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert(error.response?.data?.detail || 'Failed to enroll in course');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filter === 'all' || course.level === filter || course.pricing_type === filter;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const calculateTotalLessons = (modules) => {
    return modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
  };

  const calculateTotalDuration = (modules) => {
    let total = 0;
    modules?.forEach(module => {
      module.lessons?.forEach(lesson => {
        total += lesson.duration || 0;
      });
    });
    return total;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="public-course-catalog">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-4 text-white/80 hover:text-white"
              data-testid="back-button"
            >
              ← Back
            </button>
          )}
          <h1 className="text-4xl font-bold mb-4">Discover Amazing Courses</h1>
          <p className="text-xl text-white/90">Learn new skills and advance your career</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="search-input"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="filter-select"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Pricing</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => viewCourseDetails(course.id)}
                data-testid={`course-card-${course.id}`}
              >
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpenIcon className="w-20 h-20 text-white" />
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                      course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {course.level}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      course.pricing_type === 'free' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {course.pricing_type === 'free' ? 'FREE' : `$${course.price}`}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
                    <div className="flex items-center">
                      <UserGroupIcon className="w-4 h-4 mr-1" />
                      {course.total_students || 0}
                    </div>
                    <div className="flex items-center">
                      <BookOpenIcon className="w-4 h-4 mr-1" />
                      {course.total_lessons || 0} lessons
                    </div>
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 mr-1 text-yellow-500" />
                      {course.rating || 4.5}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {/* Course Header */}
              <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {selectedCourse.thumbnail ? (
                  <img src={selectedCourse.thumbnail} alt={selectedCourse.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpenIcon className="w-32 h-32 text-white" />
                )}
              </div>
              
              <button
                onClick={() => setSelectedCourse(null)}
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30"
                data-testid="close-course-details-button"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCourse.level === 'beginner' ? 'bg-green-100 text-green-800' :
                      selectedCourse.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedCourse.level}
                    </span>
                    <span className="text-sm text-gray-600">{selectedCourse.category}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedCourse.title}</h2>
                  <p className="text-gray-600 mb-4">{selectedCourse.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <UserGroupIcon className="w-5 h-5 mr-2" />
                      {selectedCourse.total_students || 0} students
                    </div>
                    <div className="flex items-center">
                      <BookOpenIcon className="w-5 h-5 mr-2" />
                      {calculateTotalLessons(selectedCourse.modules)} lessons
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="w-5 h-5 mr-2" />
                      {Math.floor(calculateTotalDuration(selectedCourse.modules) / 60)}h {calculateTotalDuration(selectedCourse.modules) % 60}m
                    </div>
                  </div>
                </div>

                <div className="ml-8 text-right">
                  {selectedCourse.pricing_type === 'free' ? (
                    <div className="text-3xl font-bold text-green-600 mb-4">FREE</div>
                  ) : (
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">${selectedCourse.price}</div>
                      <div className="text-sm text-gray-600">{selectedCourse.currency}</div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    data-testid="enroll-now-button"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>

              {/* Course Curriculum */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Course Curriculum</h3>
                <div className="space-y-4">
                  {selectedCourse.modules?.map((module, index) => (
                    <div key={module.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-4">
                        <h4 className="font-semibold text-gray-900">
                          Module {index + 1}: {module.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {module.lessons?.length || 0} lessons
                        </p>
                      </div>
                      <div className="divide-y">
                        {module.lessons?.slice(0, 3).map((lesson, lessonIdx) => (
                          <div key={lesson.id} className="p-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <CheckCircleIcon className="w-5 h-5 text-gray-400 mr-3" />
                              <span className="text-sm text-gray-700">{lesson.title}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="mr-3 capitalize">{lesson.content_type}</span>
                              {lesson.duration && (
                                <span>{lesson.duration} min</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {module.lessons?.length > 3 && (
                          <div className="p-3 text-center text-sm text-gray-500">
                            + {module.lessons.length - 3} more lessons
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Confirmation Modal */}
      {showEnrollModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Enrollment</h3>
            <p className="text-gray-600 mb-6">
              You are about to enroll in <strong>{selectedCourse.title}</strong>.
              {selectedCourse.pricing_type === 'free' ? (
                ' This course is free!'
              ) : (
                ` The course costs $${selectedCourse.price} ${selectedCourse.currency}.`
              )}
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a mock payment system. No actual charges will be made.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                data-testid="cancel-enrollment-button"
              >
                Cancel
              </button>
              <button
                onClick={() => enrollInCourse(selectedCourse.id)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="confirm-enrollment-button"
              >
                Confirm Enrollment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCourseCatalog;
