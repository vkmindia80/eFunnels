import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import boto3
from botocore.exceptions import ClientError
from typing import Optional, List
from datetime import datetime
import logging
from openai import OpenAI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailDeliveryError(Exception):
    pass

class EmailService:
    def __init__(self):
        self.provider = os.getenv('EMAIL_PROVIDER', 'mock')
        self.sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
        self.smtp_host = os.getenv('SMTP_HOST')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        self.aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.from_email = os.getenv('EMAIL_FROM', 'noreply@efunnels.com')
        self.emergent_api_key = os.getenv('EMERGENT_LLM_KEY')
        
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_name: str = "eFunnels",
        from_email: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> dict:
        """
        Send email using configured provider
        
        Returns dict with:
        - success: bool
        - provider: str
        - message_id: Optional[str]
        - error: Optional[str]
        """
        from_email = from_email or self.from_email
        
        if self.provider == 'sendgrid':
            return self._send_via_sendgrid(to_email, subject, html_content, from_name, from_email, reply_to)
        elif self.provider == 'smtp':
            return self._send_via_smtp(to_email, subject, html_content, from_name, from_email, reply_to)
        elif self.provider == 'aws_ses':
            return self._send_via_aws_ses(to_email, subject, html_content, from_name, from_email, reply_to)
        else:  # mock
            return self._send_via_mock(to_email, subject, html_content, from_name, from_email)
    
    def _send_via_mock(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        from_name: str,
        from_email: str
    ) -> dict:
        """Mock email sending - just logs the email"""
        logger.info(f"[MOCK EMAIL] To: {to_email}")
        logger.info(f"[MOCK EMAIL] From: {from_name} <{from_email}>")
        logger.info(f"[MOCK EMAIL] Subject: {subject}")
        logger.info(f"[MOCK EMAIL] Content length: {len(html_content)} characters")
        
        return {
            'success': True,
            'provider': 'mock',
            'message_id': f'mock-{datetime.utcnow().timestamp()}',
            'error': None
        }
    
    def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_name: str,
        from_email: str,
        reply_to: Optional[str]
    ) -> dict:
        """Send email via SendGrid"""
        try:
            if not self.sendgrid_api_key:
                raise EmailDeliveryError("SendGrid API key not configured")
            
            message = Mail(
                from_email=Email(from_email, from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if reply_to:
                message.reply_to = Email(reply_to)
            
            sg = SendGridAPIClient(self.sendgrid_api_key)
            response = sg.send(message)
            
            return {
                'success': response.status_code in [200, 202],
                'provider': 'sendgrid',
                'message_id': response.headers.get('X-Message-Id'),
                'error': None
            }
            
        except Exception as e:
            logger.error(f"SendGrid error: {str(e)}")
            return {
                'success': False,
                'provider': 'sendgrid',
                'message_id': None,
                'error': str(e)
            }
    
    def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_name: str,
        from_email: str,
        reply_to: Optional[str]
    ) -> dict:
        """Send email via SMTP"""
        try:
            if not all([self.smtp_host, self.smtp_username, self.smtp_password]):
                raise EmailDeliveryError("SMTP credentials not configured")
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{from_name} <{from_email}>"
            msg['To'] = to_email
            
            if reply_to:
                msg['Reply-To'] = reply_to
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return {
                'success': True,
                'provider': 'smtp',
                'message_id': f'smtp-{datetime.utcnow().timestamp()}',
                'error': None
            }
            
        except Exception as e:
            logger.error(f"SMTP error: {str(e)}")
            return {
                'success': False,
                'provider': 'smtp',
                'message_id': None,
                'error': str(e)
            }
    
    def _send_via_aws_ses(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_name: str,
        from_email: str,
        reply_to: Optional[str]
    ) -> dict:
        """Send email via AWS SES"""
        try:
            if not all([self.aws_access_key, self.aws_secret_key]):
                raise EmailDeliveryError("AWS SES credentials not configured")
            
            # Create SES client
            ses_client = boto3.client(
                'ses',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key,
                region_name=self.aws_region
            )
            
            # Build email
            destination = {'ToAddresses': [to_email]}
            message = {
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_content, 'Charset': 'UTF-8'}
                }
            }
            
            source = f"{from_name} <{from_email}>"
            
            # Send email
            kwargs = {
                'Source': source,
                'Destination': destination,
                'Message': message
            }
            
            if reply_to:
                kwargs['ReplyToAddresses'] = [reply_to]
            
            response = ses_client.send_email(**kwargs)
            
            return {
                'success': True,
                'provider': 'aws_ses',
                'message_id': response['MessageId'],
                'error': None
            }
            
        except ClientError as e:
            logger.error(f"AWS SES error: {str(e)}")
            return {
                'success': False,
                'provider': 'aws_ses',
                'message_id': None,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"AWS SES error: {str(e)}")
            return {
                'success': False,
                'provider': 'aws_ses',
                'message_id': None,
                'error': str(e)
            }
    
    def send_bulk_emails(
        self,
        recipients: List[dict],  # [{'email': str, 'data': dict}]
        subject: str,
        html_content: str,
        from_name: str = "eFunnels",
        from_email: Optional[str] = None
    ) -> List[dict]:
        """Send emails to multiple recipients"""
        results = []
        
        for recipient in recipients:
            # Personalize content if needed
            personalized_content = html_content
            if 'data' in recipient:
                for key, value in recipient['data'].items():
                    personalized_content = personalized_content.replace(f"{{{{{key}}}}}", str(value))
            
            result = self.send_email(
                to_email=recipient['email'],
                subject=subject,
                html_content=personalized_content,
                from_name=from_name,
                from_email=from_email
            )
            
            results.append({
                'email': recipient['email'],
                **result
            })
        
        return results


class AIEmailGenerator:
    def __init__(self):
        self.api_key = os.getenv('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment")
        
        # Configure OpenAI client with Emergent LLM key
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://llm.emergent.tech/v1"
        )
    
    def generate_email_content(
        self,
        prompt: str,
        tone: str = "professional",
        purpose: str = "general",
        length: str = "medium",
        include_cta: bool = True
    ) -> dict:
        """
        Generate email content using AI
        
        Returns:
        {
            'subject': str,
            'content': str,
            'preview_text': str
        }
        """
        try:
            # Build the system prompt
            system_prompt = f"""You are an expert email marketing copywriter. Generate compelling email content that:
- Has a {tone} tone
- Is designed for {purpose} purposes
- Is {length} in length
- {'Includes a clear call-to-action' if include_cta else 'Does not include a call-to-action'}

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{{
    "subject": "Compelling subject line (max 60 characters)",
    "preview_text": "Preview text for email clients (max 100 characters)",
    "content": "Full HTML email content with proper formatting"
}}"""

            # Call OpenAI API with timeout
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
                timeout=10.0
            )
            
            # Parse response
            import json
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
                content = content.strip()
            
            result = json.loads(content)
            
            return {
                'subject': result.get('subject', 'Your Email Subject'),
                'content': result.get('content', ''),
                'preview_text': result.get('preview_text', '')
            }
            
        except Exception as e:
            logger.error(f"AI generation error: {str(e)}")
            # Return a proper fallback response based on purpose
            fallback_content = self._generate_fallback_content(prompt, tone, purpose, include_cta)
            return fallback_content
    
    def _generate_fallback_content(self, prompt: str, tone: str, purpose: str, include_cta: bool) -> dict:
        """Generate fallback email content when AI is unavailable"""
        templates = {
            'welcome': {
                'subject': 'Welcome to Our Platform!',
                'preview_text': 'We are excited to have you on board',
                'content': f'''
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #3B82F6;">Welcome Aboard!</h1>
                    <p>Hi there,</p>
                    <p>We're thrilled to have you join our platform. You're now part of a community that values innovation and excellence.</p>
                    <p>Here's what you can do next:</p>
                    <ul>
                        <li>Complete your profile</li>
                        <li>Explore our features</li>
                        <li>Connect with your team</li>
                    </ul>
                    {'''<div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
                    </div>''' if include_cta else ''}
                    <p>Best regards,<br>The Team</p>
                </div>
                '''
            },
            'promotional': {
                'subject': 'Exclusive Offer Just For You',
                'preview_text': 'Don't miss out on this special promotion',
                'content': f'''
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #3B82F6;">Special Promotion!</h1>
                    <p>Hello,</p>
                    <p>We have an exclusive offer that we think you'll love. For a limited time, take advantage of this special promotion.</p>
                    <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="margin-top: 0;">What's Included:</h2>
                        <ul>
                            <li>Premium features access</li>
                            <li>Priority support</li>
                            <li>Exclusive resources</li>
                        </ul>
                    </div>
                    {'''<div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Claim Your Offer</a>
                    </div>''' if include_cta else ''}
                    <p>Cheers,<br>The Team</p>
                </div>
                '''
            },
            'newsletter': {
                'subject': 'Your Monthly Newsletter',
                'preview_text': 'Updates, tips, and news from our team',
                'content': f'''
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #3B82F6;">Monthly Newsletter</h1>
                    <p>Hi there,</p>
                    <p>Here's what's new this month:</p>
                    <div style="margin: 30px 0;">
                        <h3 style="color: #3B82F6;">Latest Updates</h3>
                        <p>We've been busy improving our platform with new features and enhancements.</p>
                        
                        <h3 style="color: #3B82F6;">Tips & Tricks</h3>
                        <p>Learn how to get the most out of our platform with these helpful tips.</p>
                        
                        <h3 style="color: #3B82F6;">Community Highlights</h3>
                        <p>See what our amazing community has been up to this month.</p>
                    </div>
                    {'''<div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Read More</a>
                    </div>''' if include_cta else ''}
                    <p>Until next time,<br>The Team</p>
                </div>
                '''
            }
        }
        
        # Return template based on purpose, or general template
        return templates.get(purpose, {
            'subject': 'Important Update',
            'preview_text': 'We have something important to share with you',
            'content': f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3B82F6;">Hello!</h1>
                <p>We wanted to reach out to you with an important update.</p>
                <p>{prompt}</p>
                {'''<div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Learn More</a>
                </div>''' if include_cta else ''}
                <p>Best regards,<br>The Team</p>
            </div>
            '''
        })
    
    def improve_subject_line(self, subject: str, context: str = "") -> List[str]:
        """Generate alternative subject lines"""
        try:
            prompt = f"""Generate 5 alternative subject lines for an email with the current subject: "{subject}"
            
Context: {context}

Return ONLY a JSON array of 5 subject lines (no markdown, no code blocks):
["Subject 1", "Subject 2", "Subject 3", "Subject 4", "Subject 5"]"""

            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert at writing compelling email subject lines."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=300
            )
            
            import json
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
                content = content.strip()
            
            alternatives = json.loads(content)
            return alternatives[:5]  # Ensure max 5
            
        except Exception as e:
            logger.error(f"Subject line generation error: {str(e)}")
            return [subject]


def convert_blocks_to_html(blocks: List[dict]) -> str:
    """Convert email builder blocks to HTML"""
    html_parts = []
    
    for block in blocks:
        block_type = block.get('type')
        
        if block_type == 'heading':
            level = block.get('level', 2)
            text = block.get('text', '')
            align = block.get('align', 'left')
            html_parts.append(f'<h{level} style="text-align: {align};">{text}</h{level}>')
        
        elif block_type == 'paragraph':
            text = block.get('text', '')
            align = block.get('align', 'left')
            html_parts.append(f'<p style="text-align: {align};">{text}</p>')
        
        elif block_type == 'button':
            text = block.get('text', 'Click Here')
            url = block.get('url', '#')
            align = block.get('align', 'center')
            color = block.get('color', '#3B82F6')
            html_parts.append(f'''
            <div style="text-align: {align}; margin: 20px 0;">
                <a href="{url}" style="display: inline-block; padding: 12px 30px; background-color: {color}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">{text}</a>
            </div>
            ''')
        
        elif block_type == 'image':
            src = block.get('src', '')
            alt = block.get('alt', '')
            align = block.get('align', 'center')
            width = block.get('width', '100%')
            html_parts.append(f'<div style="text-align: {align};"><img src="{src}" alt="{alt}" style="max-width: {width}; height: auto;"></div>')
        
        elif block_type == 'divider':
            html_parts.append('<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">')
        
        elif block_type == 'spacer':
            height = block.get('height', 20)
            html_parts.append(f'<div style="height: {height}px;"></div>')
    
    # Wrap in email template
    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        {''.join(html_parts)}
    </body>
    </html>
    '''
    
    return html
