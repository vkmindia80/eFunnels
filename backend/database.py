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
blogs_collection = db['blogs']
webinars_collection = db['webinars']
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
workflow_executions_collection.create_index('user_id')
workflow_executions_collection.create_index('status')