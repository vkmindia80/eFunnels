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
funnels_collection = db['funnels']
emails_collection = db['emails']
courses_collection = db['courses']
affiliates_collection = db['affiliates']
blogs_collection = db['blogs']
webinars_collection = db['webinars']
workflows_collection = db['workflows']
analytics_collection = db['analytics']
forms_collection = db['forms']
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
funnels_collection.create_index('user_id')
emails_collection.create_index('user_id')