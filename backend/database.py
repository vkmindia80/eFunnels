from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['efunnels']

# Collections
users_collection = db['users']
contacts_collection = db['contacts']
contact_activities_collection = db['contact_activities']
tags_collection = db['tags']
segments_collection = db['segments']
email_templates_collection = db['email_templates']
email_campaigns_collection = db['email_campaigns']
email_logs_collection = db['email_logs']
funnels_collection = db['funnels']

# Course & Membership collections
courses_collection = db['courses']
course_modules_collection = db['course_modules']
course_lessons_collection = db['course_lessons']
course_enrollments_collection = db['course_enrollments']
course_progress_collection = db['course_progress']
certificates_collection = db['certificates']
membership_tiers_collection = db['membership_tiers']
membership_subscriptions_collection = db['membership_subscriptions']

affiliates_collection = db['affiliates']

# Webinar collections (Phase 9)
webinars_collection = db['webinars']
webinar_registrations_collection = db['webinar_registrations']
webinar_chat_messages_collection = db['webinar_chat_messages']
webinar_qa_collection = db['webinar_qa']
webinar_polls_collection = db['webinar_polls']
webinar_recordings_collection = db['webinar_recordings']

workflows_collection = db['workflows']
workflow_executions_collection = db['workflow_executions']
workflow_templates_collection = db['workflow_templates']
analytics_collection = db['analytics']
forms_collection = db['forms']
form_submissions_collection = db['form_submissions']
form_templates_collection = db['form_templates']
form_views_collection = db['form_views']
surveys_collection = db['surveys']
survey_responses_collection = db['survey_responses']
files_collection = db['files']
settings_collection = db['settings']

# Create indexes
users_collection.create_index('email', unique=True)
contacts_collection.create_index('email')
contacts_collection.create_index('user_id')
contacts_collection.create_index([('user_id', 1), ('email', 1)])
contact_activities_collection.create_index('contact_id')
contact_activities_collection.create_index('user_id')
tags_collection.create_index([('user_id', 1), ('name', 1)], unique=True)
segments_collection.create_index('user_id')
email_templates_collection.create_index('user_id')
email_campaigns_collection.create_index('user_id')
email_campaigns_collection.create_index('status')
email_logs_collection.create_index('campaign_id')
email_logs_collection.create_index('contact_id')
email_logs_collection.create_index('user_id')
email_logs_collection.create_index('status')
funnels_collection.create_index('user_id')
funnel_pages_collection = db['funnel_pages']
funnel_pages_collection.create_index('funnel_id')
funnel_pages_collection.create_index('user_id')
funnel_templates_collection = db['funnel_templates']
funnel_visits_collection = db['funnel_visits']
funnel_visits_collection.create_index('funnel_id')
funnel_visits_collection.create_index('page_id')
funnel_visits_collection.create_index('session_id')
funnel_conversions_collection = db['funnel_conversions']
funnel_conversions_collection.create_index('funnel_id')
funnel_conversions_collection.create_index('contact_id')

# Forms & Surveys indexes
forms_collection.create_index('user_id')
forms_collection.create_index('status')
form_submissions_collection.create_index('form_id')
form_submissions_collection.create_index('user_id')
form_submissions_collection.create_index('contact_id')
form_views_collection.create_index('form_id')
surveys_collection.create_index('user_id')
surveys_collection.create_index('status')
survey_responses_collection.create_index('survey_id')
survey_responses_collection.create_index('user_id')

# Workflow automation indexes
workflows_collection.create_index('user_id')
workflows_collection.create_index('is_active')
workflows_collection.create_index('trigger_type')
workflow_executions_collection.create_index('workflow_id')
workflow_executions_collection.create_index('contact_id')

# Course & Membership indexes
courses_collection.create_index('user_id')
courses_collection.create_index('status')
courses_collection.create_index('category')
course_modules_collection.create_index('course_id')
course_modules_collection.create_index('user_id')
course_lessons_collection.create_index('course_id')
course_lessons_collection.create_index('module_id')
course_lessons_collection.create_index('user_id')
course_enrollments_collection.create_index('user_id')
course_enrollments_collection.create_index('course_id')
course_enrollments_collection.create_index('course_owner_id')
course_enrollments_collection.create_index([('user_id', 1), ('course_id', 1)], unique=True)
course_progress_collection.create_index('enrollment_id')
course_progress_collection.create_index('user_id')
course_progress_collection.create_index('course_id')
course_progress_collection.create_index('lesson_id')
certificates_collection.create_index('user_id')
certificates_collection.create_index('course_id')
certificates_collection.create_index('certificate_number', unique=True)
membership_tiers_collection.create_index('user_id')
membership_tiers_collection.create_index('status')
membership_subscriptions_collection.create_index('user_id')
membership_subscriptions_collection.create_index('tier_id')
membership_subscriptions_collection.create_index('tier_owner_id')
membership_subscriptions_collection.create_index('status')

workflow_executions_collection.create_index('user_id')
workflow_executions_collection.create_index('status')

# Blog & Website Builder collections (Phase 8)
blog_posts_collection = db['blog_posts']
blog_categories_collection = db['blog_categories']
blog_tags_collection = db['blog_tags']
blog_comments_collection = db['blog_comments']
blog_post_views_collection = db['blog_post_views']
website_pages_collection = db['website_pages']
website_themes_collection = db['website_themes']
navigation_menus_collection = db['navigation_menus']
website_page_views_collection = db['website_page_views']

# Blog & Website indexes
blog_posts_collection.create_index('user_id')
blog_posts_collection.create_index('status')
blog_posts_collection.create_index('slug', unique=True)
blog_posts_collection.create_index('category_id')
blog_posts_collection.create_index([('user_id', 1), ('status', 1)])
blog_categories_collection.create_index('user_id')
blog_categories_collection.create_index([('user_id', 1), ('slug', 1)], unique=True)
blog_tags_collection.create_index('user_id')
blog_tags_collection.create_index([('user_id', 1), ('slug', 1)], unique=True)
blog_comments_collection.create_index('post_id')
blog_comments_collection.create_index('user_id')
blog_comments_collection.create_index('status')
blog_post_views_collection.create_index('post_id')
blog_post_views_collection.create_index('user_id')
website_pages_collection.create_index('user_id')
website_pages_collection.create_index('status')
website_pages_collection.create_index([('user_id', 1), ('slug', 1)], unique=True)
website_themes_collection.create_index('user_id')
website_themes_collection.create_index([('user_id', 1), ('is_active', 1)])
navigation_menus_collection.create_index('user_id')
navigation_menus_collection.create_index([('user_id', 1), ('location', 1)])
website_page_views_collection.create_index('page_id')
website_page_views_collection.create_index('user_id')

# Webinar indexes (Phase 9)
webinars_collection.create_index('user_id')
webinars_collection.create_index('status')
webinars_collection.create_index('scheduled_at')
webinar_registrations_collection.create_index('webinar_id')
webinar_registrations_collection.create_index('email')
webinar_registrations_collection.create_index([('webinar_id', 1), ('email', 1)], unique=True)
webinar_registrations_collection.create_index('status')
webinar_chat_messages_collection.create_index('webinar_id')
webinar_chat_messages_collection.create_index('created_at')
webinar_qa_collection.create_index('webinar_id')
webinar_qa_collection.create_index('is_answered')
webinar_polls_collection.create_index('webinar_id')
webinar_polls_collection.create_index('is_active')
webinar_recordings_collection.create_index('webinar_id')
webinar_recordings_collection.create_index('is_public')