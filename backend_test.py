#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class eFunnelsAPITester:
    def __init__(self, base_url="https://core-test-suite.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.course_id = None
        self.module_id = None
        self.lesson_id = None
        self.enrollment_id = None
        self.membership_id = None

    def log_result(self, test_name, success, details="", error_msg=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {error_msg}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "error": error_msg
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_result(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_result(name, True, f"Status: {response.status_code}, No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('detail', f"Status: {response.status_code}")
                except:
                    error_msg = f"Status: {response.status_code}"
                
                self.log_result(name, False, "", error_msg)
                return False, {}

        except Exception as e:
            self.log_result(name, False, "", f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health endpoint"""
        success, data = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_authentication(self):
        """Test authentication with demo credentials"""
        print("\n🔐 Testing Authentication...")
        
        # Test login with demo credentials
        login_data = {
            "email": "demo@efunnels.com",
            "password": "demo123"
        }
        
        success, response = self.run_test(
            "Login with demo credentials",
            "POST",
            "auth/login",
            200,
            login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response.get('user', {}).get('id')
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        
        return False

    def test_course_management(self):
        """Test course CRUD operations"""
        print("\n📚 Testing Course Management...")
        
        # Create a course
        course_data = {
            "title": "Test Course - Python Programming",
            "description": "A comprehensive course on Python programming for beginners",
            "category": "tech",
            "level": "beginner",
            "language": "en",
            "pricing_type": "free",
            "price": 0,
            "currency": "USD"
        }
        
        success, response = self.run_test(
            "Create Course",
            "POST",
            "courses",
            200,
            course_data
        )
        
        if success and 'id' in response:
            self.course_id = response['id']
            print(f"   Course created with ID: {self.course_id}")
        else:
            return False
        
        # Get all courses
        success, response = self.run_test(
            "Get All Courses",
            "GET",
            "courses",
            200
        )
        
        # Get specific course
        success, response = self.run_test(
            f"Get Course {self.course_id}",
            "GET",
            f"courses/{self.course_id}",
            200
        )
        
        # Update course
        update_data = {
            "title": "Updated Test Course - Advanced Python",
            "description": "Updated description for advanced Python course"
        }
        
        success, response = self.run_test(
            "Update Course",
            "PUT",
            f"courses/{self.course_id}",
            200,
            update_data
        )
        
        # Publish course
        publish_data = {"status": "published"}
        success, response = self.run_test(
            "Publish Course",
            "PUT",
            f"courses/{self.course_id}",
            200,
            publish_data
        )
        
        return True

    def test_course_modules(self):
        """Test course module operations"""
        print("\n📖 Testing Course Modules...")
        
        if not self.course_id:
            print("   Skipping module tests - no course ID")
            return False
        
        # Create a module
        module_data = {
            "title": "Introduction to Python",
            "description": "Basic concepts and syntax of Python programming",
            "order": 0
        }
        
        success, response = self.run_test(
            "Create Module",
            "POST",
            f"courses/{self.course_id}/modules",
            200,
            module_data
        )
        
        if success and 'id' in response:
            self.module_id = response['id']
            print(f"   Module created with ID: {self.module_id}")
        else:
            return False
        
        # Get modules for course
        success, response = self.run_test(
            "Get Course Modules",
            "GET",
            f"courses/{self.course_id}/modules",
            200
        )
        
        # Update module
        update_data = {
            "title": "Updated Introduction to Python",
            "description": "Updated module description"
        }
        
        success, response = self.run_test(
            "Update Module",
            "PUT",
            f"courses/{self.course_id}/modules/{self.module_id}",
            200,
            update_data
        )
        
        return True

    def test_course_lessons(self):
        """Test course lesson operations"""
        print("\n📝 Testing Course Lessons...")
        
        if not self.course_id or not self.module_id:
            print("   Skipping lesson tests - no course/module ID")
            return False
        
        # Create different types of lessons
        lesson_types = [
            {
                "title": "Python Basics - Text Lesson",
                "description": "Introduction to Python syntax",
                "content_type": "text",
                "duration": 15,
                "content": {
                    "text": "<h1>Python Basics</h1><p>Python is a powerful programming language...</p>"
                },
                "order": 0
            },
            {
                "title": "Python Video Tutorial",
                "description": "Video introduction to Python",
                "content_type": "video",
                "duration": 30,
                "content": {
                    "url": "https://www.youtube.com/embed/kqtD5dpn9C8"
                },
                "order": 1
            },
            {
                "title": "Python Quiz",
                "description": "Test your Python knowledge",
                "content_type": "quiz",
                "duration": 10,
                "content": {
                    "questions": [
                        {
                            "question": "What is Python?",
                            "answers": [
                                "A programming language",
                                "A snake",
                                "A web browser",
                                "An operating system"
                            ],
                            "correct_answer": 0
                        }
                    ]
                },
                "order": 2
            }
        ]
        
        lesson_ids = []
        for lesson_data in lesson_types:
            success, response = self.run_test(
                f"Create {lesson_data['content_type']} Lesson",
                "POST",
                f"courses/{self.course_id}/modules/{self.module_id}/lessons",
                200,
                lesson_data
            )
            
            if success and 'id' in response:
                lesson_ids.append(response['id'])
                if not self.lesson_id:  # Store first lesson ID
                    self.lesson_id = response['id']
        
        if not lesson_ids:
            return False
        
        # Get lessons for module
        success, response = self.run_test(
            "Get Module Lessons",
            "GET",
            f"courses/{self.course_id}/modules/{self.module_id}/lessons",
            200
        )
        
        # Get specific lesson
        success, response = self.run_test(
            "Get Specific Lesson",
            "GET",
            f"courses/{self.course_id}/modules/{self.module_id}/lessons/{self.lesson_id}",
            200
        )
        
        # Update lesson
        update_data = {
            "title": "Updated Python Basics",
            "description": "Updated lesson description"
        }
        
        success, response = self.run_test(
            "Update Lesson",
            "PUT",
            f"courses/{self.course_id}/modules/{self.module_id}/lessons/{self.lesson_id}",
            200,
            update_data
        )
        
        return True

    def test_course_enrollment(self):
        """Test course enrollment functionality"""
        print("\n🎓 Testing Course Enrollment...")
        
        if not self.course_id:
            print("   Skipping enrollment tests - no course ID")
            return False
        
        # Enroll in course
        enrollment_data = {
            "payment_method": "mock",
            "payment_amount": 0
        }
        
        success, response = self.run_test(
            "Enroll in Course",
            "POST",
            f"courses/{self.course_id}/enroll",
            200,
            enrollment_data
        )
        
        if success and 'id' in response:
            self.enrollment_id = response['id']
            print(f"   Enrollment created with ID: {self.enrollment_id}")
        
        # Get enrollments
        success, response = self.run_test(
            "Get User Enrollments",
            "GET",
            "enrollments",
            200
        )
        
        # Get course progress
        success, response = self.run_test(
            "Get Course Progress",
            "GET",
            f"courses/{self.course_id}/progress",
            200
        )
        
        # Mark lesson as complete
        if self.lesson_id:
            success, response = self.run_test(
                "Mark Lesson Complete",
                "POST",
                f"courses/{self.course_id}/lessons/{self.lesson_id}/complete",
                200
            )
        
        return True

    def test_public_course_catalog(self):
        """Test public course catalog"""
        print("\n🌐 Testing Public Course Catalog...")
        
        # Get public courses (no auth required)
        success, response = self.run_test(
            "Get Public Courses",
            "GET",
            "courses/public/list",
            200
        )
        
        if self.course_id:
            # Get course preview
            success, response = self.run_test(
                "Get Course Preview",
                "GET",
                f"courses/{self.course_id}/public/preview",
                200
            )
        
        return True

    def test_certificate_generation(self):
        """Test certificate generation"""
        print("\n🏆 Testing Certificate Generation...")
        
        if not self.course_id:
            print("   Skipping certificate tests - no course ID")
            return False
        
        # Generate certificate
        success, response = self.run_test(
            "Generate Certificate",
            "POST",
            f"courses/{self.course_id}/certificate",
            200
        )
        
        return True

    def test_membership_management(self):
        """Test membership tier management"""
        print("\n💎 Testing Membership Management...")
        
        # Create membership tier
        membership_data = {
            "name": "Premium Membership",
            "description": "Access to all premium courses and features",
            "price": 29.99,
            "currency": "USD",
            "billing_period": "monthly",
            "features": [
                "Access to all courses",
                "Priority support",
                "Downloadable resources",
                "Certificate of completion"
            ],
            "course_ids": []
        }
        
        success, response = self.run_test(
            "Create Membership Tier",
            "POST",
            "memberships",
            200,
            membership_data
        )
        
        if success and 'id' in response:
            self.membership_id = response['id']
            print(f"   Membership created with ID: {self.membership_id}")
        
        # Get memberships
        success, response = self.run_test(
            "Get Memberships",
            "GET",
            "memberships",
            200
        )
        
        # Update membership
        if self.membership_id:
            update_data = {
                "name": "Updated Premium Membership",
                "price": 39.99
            }
            
            success, response = self.run_test(
                "Update Membership",
                "PUT",
                f"memberships/{self.membership_id}",
                200,
                update_data
            )
        
        return True

    def test_analytics(self):
        """Test analytics endpoints"""
        print("\n📊 Testing Analytics...")
        
        # Get course analytics summary
        success, response = self.run_test(
            "Get Course Analytics Summary",
            "GET",
            "courses/analytics/summary",
            200
        )
        
        if self.course_id:
            # Get specific course analytics
            success, response = self.run_test(
                "Get Course Analytics",
                "GET",
                f"courses/{self.course_id}/analytics",
                200
            )
        
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete course (this should cascade delete modules and lessons)
        if self.course_id:
            success, response = self.run_test(
                "Delete Test Course",
                "DELETE",
                f"courses/{self.course_id}",
                200
            )
        
        # Delete membership
        if self.membership_id:
            success, response = self.run_test(
                "Delete Test Membership",
                "DELETE",
                f"memberships/{self.membership_id}",
                200
            )

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting eFunnels Course & Membership Platform API Tests")
        print("=" * 60)
        
        start_time = time.time()
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Authentication
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Course management tests
        self.test_course_management()
        self.test_course_modules()
        self.test_course_lessons()
        self.test_course_enrollment()
        self.test_public_course_catalog()
        self.test_certificate_generation()
        self.test_membership_management()
        self.test_analytics()
        
        # Cleanup
        self.cleanup_test_data()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
            return False

def main():
    tester = eFunnelsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())