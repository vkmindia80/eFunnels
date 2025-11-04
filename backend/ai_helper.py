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
