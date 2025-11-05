"""
AI Helper Module for eFunnels
Uses Emergent LLM Key for AI-powered features across OpenAI, Claude, and Gemini
"""

import os
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import uuid

load_dotenv()

EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')

class AIHelper:
    """Helper class for AI-powered features"""
    
    def __init__(self, provider="openai", model="gpt-4o-mini"):
        """
        Initialize AI Helper
        
        Args:
            provider: "openai", "anthropic", or "gemini"
            model: Model name (default: gpt-4o-mini)
        """
        self.provider = provider
        self.model = model
        self.api_key = EMERGENT_LLM_KEY
        
    async def generate_text(self, prompt: str, system_message: str = "You are a helpful AI assistant.") -> str:
        """
        Generate text using LLM
        
        Args:
            prompt: User prompt
            system_message: System message for context
            
        Returns:
            Generated text
        """
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=str(uuid.uuid4()),
                system_message=system_message
            ).with_model(self.provider, self.model)
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return response.text if hasattr(response, 'text') else str(response)
        except Exception as e:
            return f"Error generating text: {str(e)}"
    
    async def generate_email_copy(self, topic: str, tone: str = "professional") -> str:
        """
        Generate email copy
        
        Args:
            topic: Email topic/subject
            tone: Tone of email (professional, casual, friendly)
            
        Returns:
            Generated email content
        """
        system_message = f"You are an expert email copywriter. Create compelling, {tone} email content."
        prompt = f"Write an email about: {topic}"
        
        return await self.generate_text(prompt, system_message)
    
    async def generate_blog_post(self, title: str, keywords: list = None) -> str:
        """
        Generate blog post content
        
        Args:
            title: Blog post title
            keywords: SEO keywords (optional)
            
        Returns:
            Generated blog post
        """
        system_message = "You are an expert content writer. Create engaging, SEO-friendly blog posts."
        keywords_str = ", ".join(keywords) if keywords else ""
        prompt = f"Write a blog post with title: {title}"
        if keywords_str:
            prompt += f"\nInclude these keywords: {keywords_str}"
        
        return await self.generate_text(prompt, system_message)
    
    async def generate_funnel_suggestions(self, business_type: str, goal: str) -> str:
        """
        Generate sales funnel suggestions
        
        Args:
            business_type: Type of business
            goal: Business goal
            
        Returns:
            Funnel suggestions
        """
        system_message = "You are a sales funnel expert. Provide strategic funnel recommendations."
        prompt = f"Suggest a sales funnel for {business_type} with goal: {goal}"
        
        return await self.generate_text(prompt, system_message)
    
    async def generate_product_description(self, product_name: str, features: list = None) -> str:
        """
        Generate product description
        
        Args:
            product_name: Product name
            features: Product features (optional)
            
        Returns:
            Generated product description
        """
        system_message = "You are a product marketing expert. Create compelling product descriptions."
        features_str = ", ".join(features) if features else ""
        prompt = f"Write a product description for: {product_name}"
        if features_str:
            prompt += f"\nKey features: {features_str}"
        
        return await self.generate_text(prompt, system_message)
    
    async def improve_text(self, text: str, improvement_type: str = "grammar") -> str:
        """
        Improve existing text
        
        Args:
            text: Text to improve
            improvement_type: Type of improvement (grammar, clarity, engagement)
            
        Returns:
            Improved text
        """
        system_message = f"You are a text editor. Improve the text for better {improvement_type}."
        prompt = f"Improve this text:\n\n{text}"
        
        return await self.generate_text(prompt, system_message)
    
    async def generate_headline(self, topic: str, style: str = "attention-grabbing") -> list:
        """
        Generate multiple headline options
        
        Args:
            topic: Topic for headlines
            style: Style of headlines (attention-grabbing, professional, creative, urgent)
            
        Returns:
            List of headline options
        """
        system_message = "You are an expert copywriter specializing in compelling headlines."
        prompt = f"Generate 5 {style} headlines for: {topic}\n\nReturn only the headlines, one per line, numbered 1-5."
        
        response = await self.generate_text(prompt, system_message)
        # Parse response into list
        headlines = [line.strip() for line in response.split('\n') if line.strip() and any(c.isdigit() for c in line[:3])]
        return headlines[:5] if headlines else [response]
    
    async def generate_landing_page_copy(self, product: str, target_audience: str, benefits: list) -> dict:
        """
        Generate complete landing page copy
        
        Args:
            product: Product or service name
            target_audience: Target audience description
            benefits: List of key benefits
            
        Returns:
            Dict with headline, subheadline, body, and CTA
        """
        system_message = "You are an expert landing page copywriter. Create high-converting copy."
        benefits_str = "\n".join([f"- {b}" for b in benefits])
        
        prompt = f"""Create landing page copy for: {product}
Target Audience: {target_audience}
Key Benefits:
{benefits_str}

Please provide:
1. A compelling headline
2. A supporting subheadline
3. Body copy (2-3 paragraphs)
4. A strong call-to-action

Format your response as:
HEADLINE: [headline]
SUBHEADLINE: [subheadline]
BODY: [body copy]
CTA: [call to action]"""
        
        response = await self.generate_text(prompt, system_message)
        
        # Parse response
        result = {
            "headline": "",
            "subheadline": "",
            "body": "",
            "cta": ""
        }
        
        lines = response.split('\n')
        current_section = None
        content = []
        
        for line in lines:
            if line.startswith('HEADLINE:'):
                current_section = 'headline'
                result['headline'] = line.replace('HEADLINE:', '').strip()
            elif line.startswith('SUBHEADLINE:'):
                current_section = 'subheadline'
                result['subheadline'] = line.replace('SUBHEADLINE:', '').strip()
            elif line.startswith('BODY:'):
                current_section = 'body'
                result['body'] = line.replace('BODY:', '').strip()
            elif line.startswith('CTA:'):
                current_section = 'cta'
                result['cta'] = line.replace('CTA:', '').strip()
            elif line.strip() and current_section:
                if current_section == 'body':
                    result['body'] += '\n' + line.strip()
        
        return result
    
    async def generate_social_media_posts(self, topic: str, platforms: list = None) -> dict:
        """
        Generate social media posts for multiple platforms
        
        Args:
            topic: Topic for posts
            platforms: List of platforms (twitter, facebook, linkedin, instagram)
            
        Returns:
            Dict with posts for each platform
        """
        if not platforms:
            platforms = ['twitter', 'facebook', 'linkedin']
        
        system_message = "You are a social media expert. Create engaging, platform-optimized posts."
        prompt = f"Create social media posts about: {topic}\n\nGenerate posts optimized for: {', '.join(platforms)}\n\nFormat as:\nPLATFORM: [post content]"
        
        response = await self.generate_text(prompt, system_message)
        
        result = {}
        lines = response.split('\n')
        current_platform = None
        
        for line in lines:
            for platform in platforms:
                if platform.upper() in line.upper():
                    current_platform = platform
                    result[platform] = line.split(':', 1)[1].strip() if ':' in line else ""
                    break
            else:
                if current_platform and line.strip():
                    result[current_platform] += ' ' + line.strip()
        
        return result
    
    async def generate_webinar_outline(self, topic: str, duration_minutes: int = 60) -> dict:
        """
        Generate webinar outline with sections and timings
        
        Args:
            topic: Webinar topic
            duration_minutes: Duration in minutes
            
        Returns:
            Structured webinar outline
        """
        system_message = "You are a webinar expert. Create engaging, well-structured webinar outlines."
        prompt = f"""Create a detailed outline for a {duration_minutes}-minute webinar on: {topic}

Include:
- Introduction (with timing)
- Main sections (3-5 sections with key points)
- Q&A section
- Conclusion with CTA

Format each section with estimated time allocation."""
        
        response = await self.generate_text(prompt, system_message)
        
        return {
            "topic": topic,
            "duration": duration_minutes,
            "outline": response
        }
    
    async def generate_course_curriculum(self, course_title: str, target_level: str = "beginner") -> dict:
        """
        Generate course curriculum structure
        
        Args:
            course_title: Title of the course
            target_level: Target skill level (beginner, intermediate, advanced)
            
        Returns:
            Structured curriculum with modules and lessons
        """
        system_message = "You are an instructional design expert. Create comprehensive course curricula."
        prompt = f"""Create a detailed curriculum for a {target_level}-level course titled: {course_title}

Structure:
- 4-6 modules
- 3-5 lessons per module
- Learning objectives for each module
- Estimated time per module

Format as a structured outline."""
        
        response = await self.generate_text(prompt, system_message)
        
        return {
            "title": course_title,
            "level": target_level,
            "curriculum": response
        }
    
    async def analyze_text_sentiment(self, text: str) -> dict:
        """
        Analyze sentiment and tone of text
        
        Args:
            text: Text to analyze
            
        Returns:
            Sentiment analysis results
        """
        system_message = "You are a text analysis expert. Analyze sentiment and provide insights."
        prompt = f"""Analyze the sentiment and tone of this text:

{text}

Provide:
1. Overall sentiment (positive, negative, neutral)
2. Tone (formal, casual, urgent, friendly, etc.)
3. Key themes (list 3-5)
4. Suggestions for improvement

Format as:
SENTIMENT: [sentiment]
TONE: [tone]
THEMES: [comma-separated themes]
SUGGESTIONS: [suggestions]"""
        
        response = await self.generate_text(prompt, system_message)
        
        result = {
            "sentiment": "",
            "tone": "",
            "themes": [],
            "suggestions": ""
        }
        
        for line in response.split('\n'):
            if line.startswith('SENTIMENT:'):
                result['sentiment'] = line.replace('SENTIMENT:', '').strip()
            elif line.startswith('TONE:'):
                result['tone'] = line.replace('TONE:', '').strip()
            elif line.startswith('THEMES:'):
                themes_str = line.replace('THEMES:', '').strip()
                result['themes'] = [t.strip() for t in themes_str.split(',')]
            elif line.startswith('SUGGESTIONS:'):
                result['suggestions'] = line.replace('SUGGESTIONS:', '').strip()
        
        return result


# Convenience functions
async def generate_content(prompt: str, provider="openai", model="gpt-4o-mini") -> str:
    """Quick content generation"""
    helper = AIHelper(provider, model)
    return await helper.generate_text(prompt)


async def generate_email(topic: str, tone: str = "professional") -> str:
    """Quick email generation"""
    helper = AIHelper()
    return await helper.generate_email_copy(topic, tone)


# Example usage for testing
if __name__ == "__main__":
    async def test():
        helper = AIHelper()
        
        # Test email generation
        email = await helper.generate_email_copy("Summer Sale Launch", "friendly")
        print("Generated Email:")
        print(email)
        print("\n" + "="*50 + "\n")
        
        # Test blog post
        blog = await helper.generate_blog_post("10 Ways to Increase Conversions", ["sales", "marketing"])
        print("Generated Blog Post:")
        print(blog)
    
    asyncio.run(test())
