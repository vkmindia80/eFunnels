#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time
import io
import os

class ComprehensiveeFunnelsAPITester:
    def __init__(self, base_url="https://milestone-tracker-29.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage for all phases
        self.contact_id = None
        self.tag_id = None
        self.segment_id = None
        self.email_template_id = None
        self.email_campaign_id = None
        self.funnel_id = None
        self.funnel_page_id = None
        self.form_id = None
        self.survey_id = None
        self.workflow_id = None
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

    # PHASE 1: Authentication Tests
    def test_phase1_authentication(self):
        """Test Phase 1: Authentication & Foundation"""
        print("\n🔐 PHASE 1: Testing Authentication & Foundation...")
        
        # Health check
        success, data = self.run_test("Health Check", "GET", "health", 200)
        if not success:
            return False
        
        # Demo credentials endpoint
        success, data = self.run_test("Get Demo Credentials", "GET", "demo/credentials", 200)
        
        # Login with demo credentials
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
        else:
            return False
        
        # Get current user profile
        success, data = self.run_test("Get Current User Profile", "GET", "auth/me", 200)
        
        # Update user profile
        profile_data = {
            "full_name": "Demo User Updated",
            "phone": "+1234567890",
            "company": "Test Company"
        }
        success, data = self.run_test("Update User Profile", "PUT", "auth/profile", 200, profile_data)
        
        return True

    # PHASE 2: Contact & CRM Tests
    def test_phase2_contacts_crm(self):
        """Test Phase 2: Contact & CRM System"""
        print("\n👥 PHASE 2: Testing Contact & CRM System...")
        
        # Create a contact
        contact_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@test.com",
            "phone": "+1234567890",
            "company": "Test Company",
            "job_title": "Software Engineer",
            "source": "API Test",
            "tags": ["test", "api"]
        }
        
        success, response = self.run_test(
            "Create Contact",
            "POST",
            "contacts",
            200,
            contact_data
        )
        
        if success and 'id' in response:
            self.contact_id = response['id']
        else:
            return False
        
        # Get all contacts
        success, data = self.run_test("Get All Contacts", "GET", "contacts", 200)
        
        # Get specific contact
        success, data = self.run_test(f"Get Contact {self.contact_id}", "GET", f"contacts/{self.contact_id}", 200)
        
        # Update contact
        update_data = {
            "status": "qualified",
            "score": 85,
            "notes": "Updated via API test"
        }
        success, data = self.run_test("Update Contact", "PUT", f"contacts/{self.contact_id}", 200, update_data)
        
        # Add contact activity
        activity_data = {
            "activity_type": "note",
            "title": "Test Activity",
            "description": "Added via API test"
        }
        success, data = self.run_test("Add Contact Activity", "POST", f"contacts/{self.contact_id}/activities", 200, activity_data)
        
        # Create tag
        tag_data = {"name": "API Test Tag", "color": "#FF5733"}
        success, response = self.run_test("Create Tag", "POST", "tags", 200, tag_data)
        if success and 'id' in response:
            self.tag_id = response['id']
        
        # Get tags
        success, data = self.run_test("Get All Tags", "GET", "tags", 200)
        
        # Create segment
        segment_data = {
            "name": "Test Segment",
            "description": "Created via API test",
            "criteria": {"status": "qualified"}
        }
        success, response = self.run_test("Create Segment", "POST", "segments", 200, segment_data)
        if success and 'id' in response:
            self.segment_id = response['id']
        
        # Get segments
        success, data = self.run_test("Get All Segments", "GET", "segments", 200)
        
        # Get contact statistics
        success, data = self.run_test("Get Contact Statistics", "GET", "contacts/stats/summary", 200)
        
        return True

    # PHASE 3: Email Marketing Tests
    def test_phase3_email_marketing(self):
        """Test Phase 3: Email Marketing"""
        print("\n📧 PHASE 3: Testing Email Marketing...")
        
        # Create email template
        template_data = {
            "name": "Test Template",
            "subject": "Test Email Subject",
            "content": {
                "blocks": [
                    {
                        "type": "heading",
                        "content": {"text": "Welcome to our newsletter!"},
                        "style": {"fontSize": "24px", "color": "#333"}
                    },
                    {
                        "type": "paragraph",
                        "content": {"text": "This is a test email template."},
                        "style": {"fontSize": "16px", "color": "#666"}
                    }
                ]
            },
            "category": "newsletter"
        }
        
        success, response = self.run_test("Create Email Template", "POST", "email/templates", 200, template_data)
        if success and 'id' in response:
            self.email_template_id = response['id']
        
        # Get email templates
        success, data = self.run_test("Get Email Templates", "GET", "email/templates", 200)
        
        # Update email template
        if self.email_template_id:
            update_data = {"name": "Updated Test Template"}
            success, data = self.run_test("Update Email Template", "PUT", f"email/templates/{self.email_template_id}", 200, update_data)
        
        # Create email campaign
        campaign_data = {
            "name": "Test Campaign",
            "subject": "Test Campaign Subject",
            "content": {
                "blocks": [
                    {
                        "type": "heading",
                        "content": {"text": "Special Offer!"},
                        "style": {"fontSize": "28px", "color": "#2563eb"}
                    }
                ]
            },
            "from_name": "eFunnels Team",
            "from_email": "hello@efunnels.com",
            "recipient_type": "all",
            "recipient_list": []
        }
        
        success, response = self.run_test("Create Email Campaign", "POST", "email/campaigns", 200, campaign_data)
        if success and 'id' in response:
            self.email_campaign_id = response['id']
        
        # Get email campaigns
        success, data = self.run_test("Get Email Campaigns", "GET", "email/campaigns", 200)
        
        # Get specific campaign
        if self.email_campaign_id:
            success, data = self.run_test("Get Email Campaign", "GET", f"email/campaigns/{self.email_campaign_id}", 200)
        
        # Get email settings
        success, data = self.run_test("Get Email Settings", "GET", "email/settings", 200)
        
        # Get email analytics
        success, data = self.run_test("Get Email Analytics", "GET", "email/analytics/summary", 200)
        
        # AI email generation (may fail if no AI key)
        ai_request = {
            "prompt": "Create a welcome email for new subscribers",
            "tone": "friendly",
            "purpose": "welcome",
            "length": "medium",
            "include_cta": True
        }
        success, data = self.run_test("AI Email Generation", "POST", "email/ai/generate", 200, ai_request)
        
        return True

    # PHASE 4: Sales Funnels Tests
    def test_phase4_sales_funnels(self):
        """Test Phase 4: Sales Funnels"""
        print("\n🎯 PHASE 4: Testing Sales Funnels...")
        
        # Get funnel templates
        success, data = self.run_test("Get Funnel Templates", "GET", "funnel-templates", 200)
        
        # Create funnel
        funnel_data = {
            "name": "Test Sales Funnel",
            "description": "Created via API test",
            "funnel_type": "sales"
        }
        
        success, response = self.run_test("Create Funnel", "POST", "funnels", 200, funnel_data)
        if success and 'id' in response:
            self.funnel_id = response['id']
        else:
            return False
        
        # Get all funnels
        success, data = self.run_test("Get All Funnels", "GET", "funnels", 200)
        
        # Get specific funnel
        success, data = self.run_test("Get Funnel", "GET", f"funnels/{self.funnel_id}", 200)
        
        # Update funnel
        update_data = {"name": "Updated Test Funnel", "status": "active"}
        success, data = self.run_test("Update Funnel", "PUT", f"funnels/{self.funnel_id}", 200, update_data)
        
        # Create funnel page
        page_data = {
            "name": "Landing Page",
            "path": "/landing",
            "content": {
                "blocks": [
                    {
                        "type": "hero",
                        "content": {
                            "headline": "Welcome to Our Product",
                            "subheadline": "The best solution for your needs",
                            "cta_text": "Get Started"
                        }
                    }
                ]
            },
            "order": 0
        }
        
        success, response = self.run_test("Create Funnel Page", "POST", f"funnels/{self.funnel_id}/pages", 200, page_data)
        if success and 'id' in response:
            self.funnel_page_id = response['id']
        
        # Get funnel pages
        success, data = self.run_test("Get Funnel Pages", "GET", f"funnels/{self.funnel_id}/pages", 200)
        
        # Get funnel analytics
        success, data = self.run_test("Get Funnel Analytics", "GET", f"funnels/{self.funnel_id}/analytics", 200)
        
        return True

    # PHASE 5: Forms & Surveys Tests
    def test_phase5_forms_surveys(self):
        """Test Phase 5: Forms & Surveys"""
        print("\n📝 PHASE 5: Testing Forms & Surveys...")
        
        # Create form
        form_data = {
            "name": "Test Contact Form",
            "description": "Created via API test",
            "fields": [
                {
                    "label": "Full Name",
                    "field_type": "text",
                    "required": True,
                    "placeholder": "Enter your name"
                },
                {
                    "label": "Email Address",
                    "field_type": "email",
                    "required": True,
                    "placeholder": "Enter your email"
                }
            ],
            "settings": {
                "submit_button_text": "Submit",
                "success_message": "Thank you for your submission!"
            }
        }
        
        success, response = self.run_test("Create Form", "POST", "forms", 200, form_data)
        if success and 'id' in response:
            self.form_id = response['id']
        
        # Get all forms
        success, data = self.run_test("Get All Forms", "GET", "forms", 200)
        
        # Get specific form
        if self.form_id:
            success, data = self.run_test("Get Form", "GET", f"forms/{self.form_id}", 200)
        
        # Update form
        if self.form_id:
            update_data = {"name": "Updated Test Form", "status": "active"}
            success, data = self.run_test("Update Form", "PUT", f"forms/{self.form_id}", 200, update_data)
        
        # Get form submissions
        if self.form_id:
            success, data = self.run_test("Get Form Submissions", "GET", f"forms/{self.form_id}/submissions", 200)
        
        # Create survey
        survey_data = {
            "name": "Test Survey",
            "description": "Created via API test",
            "questions": [
                {
                    "question_text": "How satisfied are you with our service?",
                    "question_type": "rating",
                    "required": True,
                    "order": 0
                },
                {
                    "question_text": "What features would you like to see?",
                    "question_type": "text",
                    "required": False,
                    "order": 1
                }
            ],
            "settings": {
                "allow_multiple_responses": False,
                "show_progress_bar": True
            }
        }
        
        success, response = self.run_test("Create Survey", "POST", "surveys", 200, survey_data)
        if success and 'id' in response:
            self.survey_id = response['id']
        
        # Get all surveys
        success, data = self.run_test("Get All Surveys", "GET", "surveys", 200)
        
        return True

    # PHASE 6: Workflow Automation Tests
    def test_phase6_workflow_automation(self):
        """Test Phase 6: Workflow Automation"""
        print("\n⚡ PHASE 6: Testing Workflow Automation...")
        
        # Get workflow templates
        success, data = self.run_test("Get Workflow Templates", "GET", "workflow-templates", 200)
        
        # Create workflow
        workflow_data = {
            "name": "Test Welcome Workflow",
            "description": "Created via API test",
            "is_active": False,
            "trigger_type": "contact_created",
            "nodes": [
                {
                    "id": "trigger-1",
                    "type": "trigger",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "Contact Created",
                        "trigger_type": "contact_created",
                        "trigger_config": {}
                    }
                },
                {
                    "id": "action-1",
                    "type": "action",
                    "position": {"x": 300, "y": 100},
                    "data": {
                        "label": "Send Welcome Email",
                        "action_type": "send_email",
                        "action_config": {
                            "template_id": self.email_template_id,
                            "subject": "Welcome!"
                        }
                    }
                }
            ],
            "edges": [
                {
                    "id": "edge-1",
                    "source": "trigger-1",
                    "target": "action-1"
                }
            ]
        }
        
        success, response = self.run_test("Create Workflow", "POST", "workflows", 200, workflow_data)
        if success and 'id' in response:
            self.workflow_id = response['id']
        
        # Get all workflows
        success, data = self.run_test("Get All Workflows", "GET", "workflows", 200)
        
        # Get specific workflow
        if self.workflow_id:
            success, data = self.run_test("Get Workflow", "GET", f"workflows/{self.workflow_id}", 200)
        
        # Activate workflow
        if self.workflow_id:
            success, data = self.run_test("Activate Workflow", "POST", f"workflows/{self.workflow_id}/activate", 200)
        
        # Deactivate workflow
        if self.workflow_id:
            success, data = self.run_test("Deactivate Workflow", "POST", f"workflows/{self.workflow_id}/deactivate", 200)
        
        return True

    # PHASE 7: Courses & Memberships Tests (Enhanced)
    def test_phase7_courses_memberships(self):
        """Test Phase 7: Courses & Memberships"""
        print("\n🎓 PHASE 7: Testing Courses & Memberships...")
        
        # Create course
        course_data = {
            "title": "Comprehensive API Test Course",
            "description": "A test course created via API",
            "category": "tech",
            "level": "beginner",
            "language": "en",
            "pricing_type": "free",
            "price": 0,
            "currency": "USD"
        }
        
        success, response = self.run_test("Create Course", "POST", "courses", 200, course_data)
        if success and 'id' in response:
            self.course_id = response['id']
        else:
            return False
        
        # Get all courses
        success, data = self.run_test("Get All Courses", "GET", "courses", 200)
        
        # Create module
        module_data = {
            "title": "Introduction Module",
            "description": "Getting started with the course",
            "order": 0
        }
        
        success, response = self.run_test("Create Module", "POST", f"courses/{self.course_id}/modules", 200, module_data)
        if success and 'id' in response:
            self.module_id = response['id']
        
        # Create lesson
        lesson_data = {
            "title": "First Lesson",
            "description": "Introduction lesson",
            "content_type": "text",
            "content": {"text": "Welcome to the course!"},
            "duration": 10,
            "order": 0
        }
        
        success, response = self.run_test("Create Lesson", "POST", f"courses/{self.course_id}/modules/{self.module_id}/lessons", 200, lesson_data)
        if success and 'id' in response:
            self.lesson_id = response['id']
        
        # Publish course before enrollment
        publish_data = {"status": "published"}
        success, data = self.run_test("Publish Course for Enrollment", "PUT", f"courses/{self.course_id}", 200, publish_data)
        
        # Enroll in course
        enrollment_data = {
            "student_name": "Test Student",
            "student_email": "student@test.com",
            "payment_method": "mock"
        }
        
        success, response = self.run_test("Enroll in Course", "POST", f"courses/{self.course_id}/enroll", 200, enrollment_data)
        if success and 'id' in response:
            self.enrollment_id = response['id']
        
        # Get enrollments
        success, data = self.run_test("Get User Enrollments", "GET", "enrollments", 200)
        
        # Mark lesson complete
        if self.lesson_id:
            complete_data = {
                "time_spent": 10,
                "quiz_score": None,
                "quiz_passed": None
            }
            success, data = self.run_test("Mark Lesson Complete", "POST", f"courses/{self.course_id}/lessons/{self.lesson_id}/complete", 200, complete_data)
        
        # Get course progress
        success, data = self.run_test("Get Course Progress", "GET", f"courses/{self.course_id}/progress", 200)
        
        # Get public courses
        success, data = self.run_test("Get Public Courses", "GET", "courses/public/list", 200)
        
        # Create membership tier
        membership_data = {
            "name": "Test Premium Tier",
            "description": "Premium membership for testing",
            "price": 29.99,
            "currency": "USD",
            "billing_period": "monthly",
            "features": ["Access to all courses", "Priority support"],
            "course_ids": []
        }
        
        success, response = self.run_test("Create Membership Tier", "POST", "memberships", 200, membership_data)
        if success and 'id' in response:
            self.membership_id = response['id']
        
        # Get memberships
        success, data = self.run_test("Get Memberships", "GET", "memberships", 200)
        
        # Get course analytics
        success, data = self.run_test("Get Course Analytics Summary", "GET", "courses/analytics/summary", 200)
        
        return True

    def cleanup_test_data(self):
        """Clean up all test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order of dependencies
        if self.workflow_id:
            self.run_test("Delete Workflow", "DELETE", f"workflows/{self.workflow_id}", 200)
        
        if self.course_id:
            self.run_test("Delete Course", "DELETE", f"courses/{self.course_id}", 200)
        
        if self.membership_id:
            self.run_test("Delete Membership", "DELETE", f"memberships/{self.membership_id}", 200)
        
        if self.funnel_id:
            self.run_test("Delete Funnel", "DELETE", f"funnels/{self.funnel_id}", 200)
        
        if self.form_id:
            self.run_test("Delete Form", "DELETE", f"forms/{self.form_id}", 200)
        
        if self.survey_id:
            self.run_test("Delete Survey", "DELETE", f"surveys/{self.survey_id}", 200)
        
        if self.email_campaign_id:
            self.run_test("Delete Email Campaign", "DELETE", f"email/campaigns/{self.email_campaign_id}", 200)
        
        if self.email_template_id:
            self.run_test("Delete Email Template", "DELETE", f"email/templates/{self.email_template_id}", 200)
        
        if self.contact_id:
            self.run_test("Delete Contact", "DELETE", f"contacts/{self.contact_id}", 200)
        
        if self.tag_id:
            self.run_test("Delete Tag", "DELETE", f"tags/{self.tag_id}", 200)
        
        if self.segment_id:
            self.run_test("Delete Segment", "DELETE", f"segments/{self.segment_id}", 200)

    def run_comprehensive_tests(self):
        """Run comprehensive tests across all 7 phases"""
        print("🚀 Starting eFunnels Comprehensive API Tests (All 7 Phases)")
        print("=" * 80)
        
        start_time = time.time()
        
        # Test all phases
        phases = [
            ("Phase 1", self.test_phase1_authentication),
            ("Phase 2", self.test_phase2_contacts_crm),
            ("Phase 3", self.test_phase3_email_marketing),
            ("Phase 4", self.test_phase4_sales_funnels),
            ("Phase 5", self.test_phase5_forms_surveys),
            ("Phase 6", self.test_phase6_workflow_automation),
            ("Phase 7", self.test_phase7_courses_memberships),
        ]
        
        phase_results = {}
        
        for phase_name, test_func in phases:
            phase_start = self.tests_run
            try:
                test_func()
                phase_end = self.tests_run
                phase_tests = phase_end - phase_start
                phase_passed = sum(1 for r in self.test_results[phase_start:phase_end] if r['success'])
                phase_results[phase_name] = {
                    'tests': phase_tests,
                    'passed': phase_passed,
                    'success_rate': (phase_passed / phase_tests * 100) if phase_tests > 0 else 0
                }
            except Exception as e:
                print(f"❌ {phase_name} failed with exception: {str(e)}")
                phase_results[phase_name] = {'tests': 0, 'passed': 0, 'success_rate': 0}
        
        # Cleanup
        self.cleanup_test_data()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print comprehensive summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        for phase_name, results in phase_results.items():
            print(f"{phase_name}: {results['passed']}/{results['tests']} passed ({results['success_rate']:.1f}%)")
        
        print(f"\nOverall Results:")
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Overall success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
            
            # Print failed tests
            failed_tests = [r for r in self.test_results if not r['success']]
            if failed_tests:
                print("\n❌ Failed Tests:")
                for test in failed_tests:
                    print(f"   - {test['test']}: {test['error']}")
            
            return False

def main():
    tester = ComprehensiveeFunnelsAPITester()
    success = tester.run_comprehensive_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())