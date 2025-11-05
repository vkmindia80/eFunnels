"""
Webinar Email Service - Automated email reminders for webinars
Integrates with Phase 3 Email Marketing System
"""

import os
from datetime import datetime, timedelta
from typing import List, Dict
from email_service import EmailService
from database import (
    webinars_collection,
    webinar_registrations_collection,
    email_logs_collection
)
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebinarEmailService:
    def __init__(self):
        self.email_service = EmailService()
        self.from_email = os.getenv('EMAIL_FROM', 'noreply@efunnels.com')
        self.from_name = os.getenv('EMAIL_FROM_NAME', 'eFunnels Webinars')
    
    def send_registration_confirmation(
        self,
        webinar: dict,
        registration: dict
    ) -> dict:
        """Send confirmation email upon registration"""
        try:
            # Get webinar details
            webinar_title = webinar.get('title', 'Webinar')
            scheduled_at = webinar.get('scheduled_at')
            duration_minutes = webinar.get('duration_minutes', 60)
            presenter_name = webinar.get('presenter_name', 'Presenter')
            
            # Format date
            scheduled_date = scheduled_at.strftime('%B %d, %Y at %I:%M %p %Z') if scheduled_at else 'TBD'
            
            # Create email HTML
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                    .footer {{ text-align: center; color: #888; margin-top: 30px; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>You're Registered! 🎉</h1>
                        <p>Your spot is confirmed for {webinar_title}</p>
                    </div>
                    <div class="content">
                        <p>Hi {registration.get('first_name', 'there')},</p>
                        <p>Thank you for registering! We're excited to have you join us for this webinar.</p>
                        
                        <div class="details">
                            <h3>📅 Webinar Details</h3>
                            <p><strong>Title:</strong> {webinar_title}</p>
                            <p><strong>Date & Time:</strong> {scheduled_date}</p>
                            <p><strong>Duration:</strong> {duration_minutes} minutes</p>
                            <p><strong>Presenter:</strong> {presenter_name}</p>
                        </div>
                        
                        <p><strong>What to expect:</strong></p>
                        <p>{webinar.get('description', 'Join us for an engaging session!')}</p>
                        
                        <center>
                            <a href="#" class="button">Add to Calendar</a>
                        </center>
                        
                        <p><strong>Important:</strong> We'll send you reminder emails 24 hours and 1 hour before the webinar. You'll also receive a join link closer to the event.</p>
                        
                        <p>See you there!<br>
                        {presenter_name} and the {self.from_name} Team</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent to {registration.get('email')}</p>
                        <p>&copy; 2025 eFunnels. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Send email
            result = self.email_service.send_email(
                to_email=registration.get('email'),
                subject=f"Confirmed: You're registered for {webinar_title}",
                html_content=html_content,
                from_name=self.from_name,
                from_email=self.from_email
            )
            
            # Log email
            self._log_email(
                webinar_id=webinar.get('id'),
                recipient_email=registration.get('email'),
                subject=f"Confirmed: You're registered for {webinar_title}",
                status='sent' if result['success'] else 'failed',
                email_type='registration_confirmation',
                provider=result.get('provider'),
                error_message=result.get('error')
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending registration confirmation: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def send_reminder_24h(self, webinar: dict, registration: dict) -> dict:
        """Send 24-hour reminder email"""
        try:
            webinar_title = webinar.get('title', 'Webinar')
            scheduled_at = webinar.get('scheduled_at')
            
            scheduled_date = scheduled_at.strftime('%B %d, %Y at %I:%M %p %Z') if scheduled_at else 'TBD'
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .countdown {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }}
                    .countdown h2 {{ color: #667eea; font-size: 36px; margin: 10px 0; }}
                    .footer {{ text-align: center; color: #888; margin-top: 30px; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⏰ Tomorrow: {webinar_title}</h1>
                    </div>
                    <div class="content">
                        <p>Hi {registration.get('first_name', 'there')},</p>
                        
                        <div class="countdown">
                            <h2>24 Hours to Go!</h2>
                            <p>Your webinar starts tomorrow at:</p>
                            <h3>{scheduled_date}</h3>
                        </div>
                        
                        <p><strong>Quick Reminder:</strong></p>
                        <ul>
                            <li>Make sure you have a stable internet connection</li>
                            <li>Test your audio/video if you plan to participate</li>
                            <li>Prepare any questions you'd like to ask</li>
                            <li>Have a notepad ready for key takeaways</li>
                        </ul>
                        
                        <center>
                            <a href="#" class="button">Join Webinar (Live Tomorrow)</a>
                        </center>
                        
                        <p>We'll send you one more reminder 1 hour before the webinar starts with the join link.</p>
                        
                        <p>See you tomorrow!<br>
                        {webinar.get('presenter_name', 'The Team')}</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent to {registration.get('email')}</p>
                        <p>&copy; 2025 eFunnels. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            result = self.email_service.send_email(
                to_email=registration.get('email'),
                subject=f"🎯 Tomorrow: {webinar_title}",
                html_content=html_content,
                from_name=self.from_name,
                from_email=self.from_email
            )
            
            self._log_email(
                webinar_id=webinar.get('id'),
                recipient_email=registration.get('email'),
                subject=f"🎯 Tomorrow: {webinar_title}",
                status='sent' if result['success'] else 'failed',
                email_type='reminder_24h',
                provider=result.get('provider'),
                error_message=result.get('error')
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending 24h reminder: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def send_reminder_1h(self, webinar: dict, registration: dict) -> dict:
        """Send 1-hour reminder email with join link"""
        try:
            webinar_title = webinar.get('title', 'Webinar')
            webinar_id = webinar.get('id')
            
            # Generate join link (in production, this would be a real link)
            join_link = f"https://app.efunnels.com/webinar/{webinar_id}/join"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 18px; }}
                    .urgent {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }}
                    .footer {{ text-align: center; color: #888; margin-top: 30px; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 Starting in 1 Hour!</h1>
                        <p>{webinar_title}</p>
                    </div>
                    <div class="content">
                        <p>Hi {registration.get('first_name', 'there')},</p>
                        
                        <div class="urgent">
                            <h3>⚡ Your webinar is starting in 1 hour!</h3>
                            <p>Click the button below to join when it starts:</p>
                        </div>
                        
                        <center>
                            <a href="{join_link}" class="button">🎥 JOIN WEBINAR NOW</a>
                        </center>
                        
                        <p><strong>Before you join:</strong></p>
                        <ul>
                            <li>✅ Close unnecessary browser tabs</li>
                            <li>✅ Ensure your internet connection is stable</li>
                            <li>✅ Find a quiet place to join from</li>
                            <li>✅ Have your questions ready!</li>
                        </ul>
                        
                        <p><strong>Can't make it?</strong> Don't worry! We'll send you a link to the recording after the webinar.</p>
                        
                        <p>Looking forward to seeing you there!<br>
                        {webinar.get('presenter_name', 'The Team')}</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent to {registration.get('email')}</p>
                        <p>&copy; 2025 eFunnels. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            result = self.email_service.send_email(
                to_email=registration.get('email'),
                subject=f"🔴 LIVE in 1 Hour: {webinar_title}",
                html_content=html_content,
                from_name=self.from_name,
                from_email=self.from_email
            )
            
            self._log_email(
                webinar_id=webinar.get('id'),
                recipient_email=registration.get('email'),
                subject=f"🔴 LIVE in 1 Hour: {webinar_title}",
                status='sent' if result['success'] else 'failed',
                email_type='reminder_1h',
                provider=result.get('provider'),
                error_message=result.get('error')
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending 1h reminder: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def send_thank_you_with_recording(
        self,
        webinar: dict,
        registration: dict,
        recording_url: str = None
    ) -> dict:
        """Send thank you email after webinar with recording link"""
        try:
            webinar_title = webinar.get('title', 'Webinar')
            
            recording_section = ""
            if recording_url:
                recording_section = f"""
                <div class="recording">
                    <h3>📹 Watch the Recording</h3>
                    <p>Missed something? Want to review? The full recording is now available:</p>
                    <center>
                        <a href="{recording_url}" class="button">Watch Recording</a>
                    </center>
                </div>
                """
            else:
                recording_section = """
                <p>The recording will be available soon. We'll send you an email when it's ready!</p>
                """
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .recording {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                    .footer {{ text-align: center; color: #888; margin-top: 30px; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Thank You for Attending! 🙏</h1>
                        <p>{webinar_title}</p>
                    </div>
                    <div class="content">
                        <p>Hi {registration.get('first_name', 'there')},</p>
                        
                        <p>Thank you for joining us today! We hope you found the session valuable and learned something new.</p>
                        
                        {recording_section}
                        
                        <p><strong>What's Next?</strong></p>
                        <ul>
                            <li>Share what you learned with your team</li>
                            <li>Implement the strategies we discussed</li>
                            <li>Join us for our next webinar</li>
                            <li>Reach out if you have any questions</li>
                        </ul>
                        
                        <p><strong>Stay Connected:</strong><br>
                        Keep an eye on your inbox for upcoming webinars and exclusive content.</p>
                        
                        <p>Thank you again for your time and participation!<br>
                        {webinar.get('presenter_name', 'The Team')}</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent to {registration.get('email')}</p>
                        <p>&copy; 2025 eFunnels. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            result = self.email_service.send_email(
                to_email=registration.get('email'),
                subject=f"Thank you for attending: {webinar_title}",
                html_content=html_content,
                from_name=self.from_name,
                from_email=self.from_email
            )
            
            self._log_email(
                webinar_id=webinar.get('id'),
                recipient_email=registration.get('email'),
                subject=f"Thank you for attending: {webinar_title}",
                status='sent' if result['success'] else 'failed',
                email_type='thank_you',
                provider=result.get('provider'),
                error_message=result.get('error')
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending thank you email: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def process_scheduled_reminders(self):
        """
        Process all scheduled reminders for webinars
        Should be run as a background job/cron task
        """
        try:
            now = datetime.utcnow()
            
            # Find webinars that need 24h reminders
            webinars_24h = list(webinars_collection.find({
                'status': 'scheduled',
                'send_reminders': True,
                'scheduled_at': {
                    '$gte': now + timedelta(hours=23, minutes=45),
                    '$lte': now + timedelta(hours=24, minutes=15)
                }
            }))
            
            # Find webinars that need 1h reminders
            webinars_1h = list(webinars_collection.find({
                'status': 'scheduled',
                'send_reminders': True,
                'scheduled_at': {
                    '$gte': now + timedelta(minutes=45),
                    '$lte': now + timedelta(hours=1, minutes=15)
                }
            }))
            
            logger.info(f"Found {len(webinars_24h)} webinars for 24h reminders")
            logger.info(f"Found {len(webinars_1h)} webinars for 1h reminders")
            
            # Send 24h reminders
            for webinar in webinars_24h:
                registrations = list(webinar_registrations_collection.find({
                    'webinar_id': webinar['id'],
                    'status': 'registered'
                }))
                
                for registration in registrations:
                    self.send_reminder_24h(webinar, registration)
            
            # Send 1h reminders
            for webinar in webinars_1h:
                registrations = list(webinar_registrations_collection.find({
                    'webinar_id': webinar['id'],
                    'status': 'registered'
                }))
                
                for registration in registrations:
                    self.send_reminder_1h(webinar, registration)
            
            return {
                'success': True,
                '24h_reminders_sent': len(webinars_24h),
                '1h_reminders_sent': len(webinars_1h)
            }
            
        except Exception as e:
            logger.error(f"Error processing reminders: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _log_email(
        self,
        webinar_id: str,
        recipient_email: str,
        subject: str,
        status: str,
        email_type: str,
        provider: str = 'mock',
        error_message: str = None
    ):
        """Log webinar email for tracking"""
        try:
            log_entry = {
                'id': str(uuid.uuid4()),
                'webinar_id': webinar_id,
                'recipient_email': recipient_email,
                'subject': subject,
                'status': status,
                'email_type': email_type,  # registration_confirmation, reminder_24h, reminder_1h, thank_you
                'provider': provider,
                'error_message': error_message,
                'sent_at': datetime.utcnow() if status == 'sent' else None,
                'created_at': datetime.utcnow()
            }
            
            # Store in email_logs_collection
            email_logs_collection.insert_one(log_entry)
            
        except Exception as e:
            logger.error(f"Error logging email: {str(e)}")


# Initialize service
webinar_email_service = WebinarEmailService()
