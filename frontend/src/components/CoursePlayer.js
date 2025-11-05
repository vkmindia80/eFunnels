import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckCircleIcon, 
  BookOpenIcon,
  PlayIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const CoursePlayer = ({ courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        api.get(`/api/courses/${courseId}`),
        api.get(`/api/courses/${courseId}/progress`)
      ]);

      setCourse(courseRes.data);
      setModules(courseRes.data.modules || []);
      setProgress(progressRes.data || {});

      // Set completed lessons
      const completed = new Set(progressRes.data?.completed_lessons || []);
      setCompletedLessons(completed);

      // Load first lesson
      if (courseRes.data.modules && courseRes.data.modules.length > 0) {
        const firstModule = courseRes.data.modules[0];
        if (firstModule.lessons && firstModule.lessons.length > 0) {
          loadLesson(firstModule.lessons[0], 0, 0);
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLesson = async (lesson, moduleIndex, lessonIndex) => {
    try {
      const response = await api.get(
        `/api/courses/${courseId}/modules/${modules[moduleIndex].id}/lessons/${lesson.id}`
      );
      setCurrentLesson(response.data);
      setCurrentModuleIndex(moduleIndex);
      setCurrentLessonIndex(lessonIndex);
    } catch (error) {
      console.error('Error loading lesson:', error);
      setCurrentLesson(lesson);
      setCurrentModuleIndex(moduleIndex);
      setCurrentLessonIndex(lessonIndex);
    }
  };

  const markComplete = async () => {
    if (!currentLesson) return;

    try {
      await api.post(`/api/courses/${courseId}/lessons/${currentLesson.id}/complete`, {
        lesson_id: currentLesson.id,
        time_spent: 0,
        quiz_score: null,
        quiz_passed: null
      });
      setCompletedLessons(prev => new Set([...prev, currentLesson.id]));
      
      // Auto-advance to next lesson
      goToNextLesson();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const goToNextLesson = () => {
    const currentModule = modules[currentModuleIndex];
    
    // Check if there's a next lesson in current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      loadLesson(nextLesson, currentModuleIndex, currentLessonIndex + 1);
    } 
    // Check if there's a next module
    else if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule.lessons && nextModule.lessons.length > 0) {
        loadLesson(nextModule.lessons[0], currentModuleIndex + 1, 0);
      }
    }
  };

  const goToPreviousLesson = () => {
    // Check if there's a previous lesson in current module
    if (currentLessonIndex > 0) {
      const prevLesson = modules[currentModuleIndex].lessons[currentLessonIndex - 1];
      loadLesson(prevLesson, currentModuleIndex, currentLessonIndex - 1);
    }
    // Check if there's a previous module
    else if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1];
      if (prevModule.lessons && prevModule.lessons.length > 0) {
        const lastLessonIndex = prevModule.lessons.length - 1;
        loadLesson(prevModule.lessons[lastLessonIndex], currentModuleIndex - 1, lastLessonIndex);
      }
    }
  };

  const renderLessonContent = () => {
    if (!currentLesson) return null;

    switch (currentLesson.content_type) {
      case 'video':
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {currentLesson.content?.url ? (
              <iframe
                src={currentLesson.content.url}
                className="w-full h-full"
                allowFullScreen
                title={currentLesson.title}
              />
            ) : currentLesson.content?.file_url ? (
              <video 
                controls 
                className="w-full h-full"
                src={currentLesson.content.file_url}
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <PlayIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No video content available</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: currentLesson.content?.text || '' }}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {currentLesson.content?.url ? (
              <iframe
                src={currentLesson.content.url}
                className="w-full h-[600px] rounded"
                title={currentLesson.title}
              />
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No PDF available</p>
              </div>
            )}
          </div>
        );

      case 'quiz':
        return <QuizPlayer quiz={currentLesson.content} lessonId={currentLesson.id} />;

      default:
        return (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">Unsupported content type</p>
          </div>
        );
    }
  };

  const calculateProgress = () => {
    const totalLessons = modules.reduce((acc, module) => acc + (module.lessons?.length || 0), 0);
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.size / totalLessons) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  const hasNextLesson = 
    (currentLessonIndex < modules[currentModuleIndex]?.lessons?.length - 1) ||
    (currentModuleIndex < modules.length - 1);

  const hasPreviousLesson = 
    currentLessonIndex > 0 || currentModuleIndex > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white" data-testid="course-player">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white"
              data-testid="back-to-courses-button"
            >
              ← Back to Courses
            </button>
            <div>
              <h1 className="text-lg font-semibold">{course?.title}</h1>
              {currentLesson && (
                <p className="text-sm text-gray-400">
                  Module {currentModuleIndex + 1}, Lesson {currentLessonIndex + 1}: {currentLesson.title}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Progress: {calculateProgress()}%
            </div>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              data-testid="toggle-sidebar-button"
            >
              {showSidebar ? 'Hide' : 'Show'} Curriculum
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Content */}
        <div className={`flex-1 overflow-y-auto p-6 transition-all ${showSidebar ? 'mr-96' : ''}`}>
          {currentLesson && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
                {currentLesson.description && (
                  <p className="text-gray-400">{currentLesson.description}</p>
                )}
              </div>

              {renderLessonContent()}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={goToPreviousLesson}
                  disabled={!hasPreviousLesson}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                    hasPreviousLesson
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                  data-testid="previous-lesson-button"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-2" />
                  Previous Lesson
                </button>

                {!completedLessons.has(currentLesson.id) && (
                  <button
                    onClick={markComplete}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium flex items-center"
                    data-testid="mark-complete-button"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Mark as Complete
                  </button>
                )}

                <button
                  onClick={goToNextLesson}
                  disabled={!hasNextLesson}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                    hasNextLesson
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                  data-testid="next-lesson-button"
                >
                  Next Lesson
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar - Curriculum */}
        {showSidebar && (
          <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto" data-testid="course-sidebar">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Course Curriculum</h3>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Your Progress</span>
                  <span className="font-medium">{calculateProgress()}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
              </div>

              {/* Modules and Lessons */}
              <div className="space-y-4">
                {modules.map((module, moduleIdx) => (
                  <div key={module.id} className="bg-gray-900 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-700">
                      <h4 className="font-medium">Module {moduleIdx + 1}: {module.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {module.lessons?.length || 0} lessons
                      </p>
                    </div>
                    <div className="divide-y divide-gray-700">
                      {module.lessons?.map((lesson, lessonIdx) => {
                        const isActive = 
                          currentModuleIndex === moduleIdx && 
                          currentLessonIndex === lessonIdx;
                        const isCompleted = completedLessons.has(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => loadLesson(lesson, moduleIdx, lessonIdx)}
                            className={`w-full text-left p-3 hover:bg-gray-800 transition-colors ${
                              isActive ? 'bg-gray-700' : ''
                            }`}
                            data-testid={`lesson-item-${lesson.id}`}
                          >
                            <div className="flex items-center">
                              {isCompleted ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-600 rounded-full mr-3 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${isActive ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>
                                  {lessonIdx + 1}. {lesson.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {lesson.content_type}
                                  {lesson.duration && ` • ${lesson.duration} min`}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Quiz Player Component
const QuizPlayer = ({ quiz, lessonId }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleSubmit = () => {
    let correct = 0;
    quiz.questions?.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    setScore(correct);
    setShowResults(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-gray-900">
      <h3 className="text-2xl font-bold mb-6">Quiz</h3>
      
      {!showResults ? (
        <>
          <div className="space-y-8">
            {quiz.questions?.map((question, qIndex) => (
              <div key={qIndex} className="border-b pb-6">
                <p className="font-medium mb-4">
                  {qIndex + 1}. {question.question}
                </p>
                <div className="space-y-2">
                  {question.answers?.map((answer, aIndex) => (
                    <label
                      key={aIndex}
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={aIndex}
                        checked={selectedAnswers[qIndex] === aIndex}
                        onChange={() => setSelectedAnswers({ ...selectedAnswers, [qIndex]: aIndex })}
                        className="mr-3"
                      />
                      <span>{answer}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < (quiz.questions?.length || 0)}
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Submit Quiz
          </button>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl font-bold text-blue-600 mb-4">
            {Math.round((score / (quiz.questions?.length || 1)) * 100)}%
          </div>
          <p className="text-xl mb-2">
            You got {score} out of {quiz.questions?.length} correct!
          </p>
          <p className="text-gray-600 mb-6">
            {score === quiz.questions?.length
              ? '🎉 Perfect score! Great job!'
              : score >= (quiz.questions?.length || 0) * 0.7
              ? '👏 Well done! You passed!'
              : '📚 Keep studying and try again!'}
          </p>
          <button
            onClick={() => {
              setSelectedAnswers({});
              setShowResults(false);
              setScore(0);
            }}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
