import React, { useState } from 'react';
import { Sparkles, Zap, FileText, MessageSquare, TrendingUp, BookOpen, Video, ShoppingBag, Mail } from 'lucide-react';
import api from '../api';

const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Content Generation States
  const [headlineInput, setHeadlineInput] = useState({ topic: '', style: 'attention-grabbing' });
  const [blogInput, setBlogInput] = useState({ title: '', keywords: '' });
  const [productInput, setProductInput] = useState({ name: '', features: '' });
  const [socialInput, setSocialInput] = useState({ topic: '', platforms: 'twitter,facebook,linkedin' });
  
  // Landing Page States
  const [landingInput, setLandingInput] = useState({ product: '', audience: '', benefits: '' });
  
  // Course/Webinar States
  const [courseInput, setCourseInput] = useState({ title: '', level: 'beginner' });
  const [webinarInput, setWebinarInput] = useState({ topic: '', duration: 60 });
  
  // Text Improvement States
  const [improveInput, setImproveInput] = useState({ text: '', type: 'grammar' });
  const [sentimentInput, setSentimentInput] = useState('');

  const generateHeadlines = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/generate/headline', null, {
        params: { topic: headlineInput.topic, style: headlineInput.style }
      });
      setResult({ type: 'headlines', data: response.data });
    } catch (error) {
      alert('Failed to generate headlines');
    } finally {
      setLoading(false);
    }
  };

  const generateBlogPost = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/generate/blog-post', null, {
        params: { title: blogInput.title, keywords: blogInput.keywords }
      });
      setResult({ type: 'blog', data: response.data });
    } catch (error) {
      alert('Failed to generate blog post');
    } finally {
      setLoading(false);
    }
  };

  const generateProductDescription = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/generate/product-description', null, {
        params: { product_name: productInput.name, features: productInput.features }
      });
      setResult({ type: 'product', data: response.data });
    } catch (error) {
      alert('Failed to generate product description');
    } finally {
      setLoading(false);
    }
  };

  const generateSocialPosts = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/generate/social-posts', null, {
        params: { topic: socialInput.topic, platforms: socialInput.platforms }
      });
      setResult({ type: 'social', data: response.data });
    } catch (error) {
      alert('Failed to generate social posts');
    } finally {
      setLoading(false);
    }
  };

  const generateLandingPage = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/generate/landing-page', null, {
        params: {
          product: landingInput.product,
          target_audience: landingInput.audience,
          benefits: landingInput.benefits
        }
      });
      setResult({ type: 'landing', data: response.data });
    } catch (error) {
      alert('Failed to generate landing page copy');
    } finally {
      setLoading(false);
    }
  };

  const generateCourseCurriculum = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/generate/course-curriculum', null, {
        params: { title: courseInput.title, level: courseInput.level }
      });
      setResult({ type: 'course', data: response.data });
    } catch (error) {
      alert('Failed to generate course curriculum');
    } finally {
      setLoading(false);
    }
  };

  const generateWebinarOutline = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/generate/webinar-outline', null, {
        params: { topic: webinarInput.topic, duration: webinarInput.duration }
      });
      setResult({ type: 'webinar', data: response.data });
    } catch (error) {
      alert('Failed to generate webinar outline');
    } finally {
      setLoading(false);
    }
  };

  const improveText = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/improve/text', null, {
        params: { text: improveInput.text, improvement_type: improveInput.type }
      });
      setResult({ type: 'improve', data: response.data });
    } catch (error) {
      alert('Failed to improve text');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSentiment = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/analyze/sentiment', null, {
        params: { text: sentimentInput }
      });
      setResult({ type: 'sentiment', data: response.data });
    } catch (error) {
      alert('Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  };

  const renderContentGeneration = () => (
    <div className="space-y-6">
      {/* Headlines */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="headline-generator">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-yellow-500" size={24} />
          <h3 className="text-lg font-semibold">Headline Generator</h3>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Enter topic (e.g., Summer Sale, Product Launch)"
            value={headlineInput.topic}
            onChange={(e) => setHeadlineInput({ ...headlineInput, topic: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="headline-topic-input"
          />
          <select
            value={headlineInput.style}
            onChange={(e) => setHeadlineInput({ ...headlineInput, style: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="headline-style-select"
          >
            <option value="attention-grabbing">Attention-Grabbing</option>
            <option value="professional">Professional</option>
            <option value="creative">Creative</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            onClick={generateHeadlines}
            disabled={loading || !headlineInput.topic}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50"
            data-testid="generate-headline-button"
          >
            {loading ? 'Generating...' : 'Generate Headlines'}
          </button>
        </div>
      </div>

      {/* Blog Post */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="blog-generator">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-blue-500" size={24} />
          <h3 className="text-lg font-semibold">Blog Post Generator</h3>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Blog post title"
            value={blogInput.title}
            onChange={(e) => setBlogInput({ ...blogInput, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="blog-title-input"
          />
          <input
            type="text"
            placeholder="Keywords (comma-separated)"
            value={blogInput.keywords}
            onChange={(e) => setBlogInput({ ...blogInput, keywords: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="blog-keywords-input"
          />
          <button
            onClick={generateBlogPost}
            disabled={loading || !blogInput.title}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50"
            data-testid="generate-blog-button"
          >
            {loading ? 'Generating...' : 'Generate Blog Post'}
          </button>
        </div>
      </div>

      {/* Product Description */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="product-generator">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingBag className="text-green-500" size={24} />
          <h3 className="text-lg font-semibold">Product Description</h3>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Product name"
            value={productInput.name}
            onChange={(e) => setProductInput({ ...productInput, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="product-name-input"
          />
          <input
            type="text"
            placeholder="Features (comma-separated)"
            value={productInput.features}
            onChange={(e) => setProductInput({ ...productInput, features: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="product-features-input"
          />
          <button
            onClick={generateProductDescription}
            disabled={loading || !productInput.name}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50"
            data-testid="generate-product-button"
          >
            {loading ? 'Generating...' : 'Generate Description'}
          </button>
        </div>
      </div>

      {/* Social Media Posts */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="social-generator">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="text-pink-500" size={24} />
          <h3 className="text-lg font-semibold">Social Media Posts</h3>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Topic"
            value={socialInput.topic}
            onChange={(e) => setSocialInput({ ...socialInput, topic: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="social-topic-input"
          />
          <input
            type="text"
            placeholder="Platforms (twitter,facebook,linkedin,instagram)"
            value={socialInput.platforms}
            onChange={(e) => setSocialInput({ ...socialInput, platforms: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="social-platforms-input"
          />
          <button
            onClick={generateSocialPosts}
            disabled={loading || !socialInput.topic}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50"
            data-testid="generate-social-button"
          >
            {loading ? 'Generating...' : 'Generate Posts'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderLandingPage = () => (
    <div className="bg-white rounded-lg shadow p-6" data-testid="landing-page-generator">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="text-purple-500" size={24} />
        <h3 className="text-lg font-semibold">Landing Page Copy Generator</h3>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Product/Service name"
          value={landingInput.product}
          onChange={(e) => setLandingInput({ ...landingInput, product: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          data-testid="landing-product-input"
        />
        <input
          type="text"
          placeholder="Target audience"
          value={landingInput.audience}
          onChange={(e) => setLandingInput({ ...landingInput, audience: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          data-testid="landing-audience-input"
        />
        <textarea
          placeholder="Key benefits (comma-separated)"
          value={landingInput.benefits}
          onChange={(e) => setLandingInput({ ...landingInput, benefits: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          rows={3}
          data-testid="landing-benefits-input"
        />
        <button
          onClick={generateLandingPage}
          disabled={loading || !landingInput.product || !landingInput.audience}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50"
          data-testid="generate-landing-button"
        >
          {loading ? 'Generating...' : 'Generate Landing Page Copy'}
        </button>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-6">
      {/* Course Curriculum */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="course-generator">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="text-orange-500" size={24} />
          <h3 className="text-lg font-semibold">Course Curriculum Generator</h3>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Course title"
            value={courseInput.title}
            onChange={(e) => setCourseInput({ ...courseInput, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="course-title-input"
          />
          <select
            value={courseInput.level}
            onChange={(e) => setCourseInput({ ...courseInput, level: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="course-level-select"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={generateCourseCurriculum}
            disabled={loading || !courseInput.title}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50"
            data-testid="generate-course-button"
          >
            {loading ? 'Generating...' : 'Generate Curriculum'}
          </button>
        </div>
      </div>

      {/* Webinar Outline */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="webinar-generator">
        <div className="flex items-center gap-3 mb-4">
          <Video className="text-red-500" size={24} />
          <h3 className="text-lg font-semibold">Webinar Outline Generator</h3>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Webinar topic"
            value={webinarInput.topic}
            onChange={(e) => setWebinarInput({ ...webinarInput, topic: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="webinar-topic-input"
          />
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={webinarInput.duration}
            onChange={(e) => setWebinarInput({ ...webinarInput, duration: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="webinar-duration-input"
          />
          <button
            onClick={generateWebinarOutline}
            disabled={loading || !webinarInput.topic}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50"
            data-testid="generate-webinar-button"
          >
            {loading ? 'Generating...' : 'Generate Outline'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderTextTools = () => (
    <div className="space-y-6">
      {/* Text Improvement */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="text-improver">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-indigo-500" size={24} />
          <h3 className="text-lg font-semibold">Text Improvement</h3>
        </div>
        <div className="space-y-3">
          <textarea
            placeholder="Enter text to improve"
            value={improveInput.text}
            onChange={(e) => setImproveInput({ ...improveInput, text: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            rows={4}
            data-testid="improve-text-input"
          />
          <select
            value={improveInput.type}
            onChange={(e) => setImproveInput({ ...improveInput, type: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="improve-type-select"
          >
            <option value="grammar">Grammar & Spelling</option>
            <option value="clarity">Clarity & Readability</option>
            <option value="engagement">Engagement & Impact</option>
          </select>
          <button
            onClick={improveText}
            disabled={loading || !improveInput.text}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50"
            data-testid="improve-text-button"
          >
            {loading ? 'Improving...' : 'Improve Text'}
          </button>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="sentiment-analyzer">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="text-teal-500" size={24} />
          <h3 className="text-lg font-semibold">Sentiment Analysis</h3>
        </div>
        <div className="space-y-3">
          <textarea
            placeholder="Enter text to analyze"
            value={sentimentInput}
            onChange={(e) => setSentimentInput(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            rows={4}
            data-testid="sentiment-text-input"
          />
          <button
            onClick={analyzeSentiment}
            disabled={loading || !sentimentInput}
            className="w-full bg-gradient-to-r from-teal-500 to-green-500 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50"
            data-testid="analyze-sentiment-button"
          >
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!result) return null;

    return (
      <div className="bg-blue-50 rounded-lg p-6 mt-6" data-testid="ai-results">
        <h3 className="text-lg font-semibold mb-4">AI Generated Content</h3>
        
        {result.type === 'headlines' && (
          <div className="space-y-2">
            <h4 className="font-medium">Headlines for: {result.data.topic}</h4>
            {result.data.headlines.map((headline, index) => (
              <div key={index} className="bg-white p-3 rounded-lg">
                {headline}
              </div>
            ))}
          </div>
        )}

        {result.type === 'blog' && (
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">{result.data.title}</h4>
            <div className="prose max-w-none whitespace-pre-wrap">{result.data.content}</div>
          </div>
        )}

        {result.type === 'product' && (
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">{result.data.product_name}</h4>
            <p className="whitespace-pre-wrap">{result.data.description}</p>
          </div>
        )}

        {result.type === 'social' && (
          <div className="space-y-3">
            {Object.entries(result.data.posts).map(([platform, post]) => (
              <div key={platform} className="bg-white p-4 rounded-lg">
                <h4 className="font-medium capitalize mb-2">{platform}</h4>
                <p>{post}</p>
              </div>
            ))}
          </div>
        )}

        {result.type === 'landing' && (
          <div className="bg-white p-4 rounded-lg space-y-4">
            <div>
              <h4 className="font-medium text-gray-600">Headline</h4>
              <p className="text-xl font-bold">{result.data.headline}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-600">Subheadline</h4>
              <p>{result.data.subheadline}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-600">Body</h4>
              <p className="whitespace-pre-wrap">{result.data.body}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-600">Call to Action</h4>
              <p className="font-semibold text-blue-600">{result.data.cta}</p>
            </div>
          </div>
        )}

        {result.type === 'course' && (
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">{result.data.title} ({result.data.level})</h4>
            <div className="prose max-w-none whitespace-pre-wrap">{result.data.curriculum}</div>
          </div>
        )}

        {result.type === 'webinar' && (
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">{result.data.topic} ({result.data.duration} minutes)</h4>
            <div className="prose max-w-none whitespace-pre-wrap">{result.data.outline}</div>
          </div>
        )}

        {result.type === 'improve' && (
          <div className="space-y-3">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Original</h4>
              <p className="whitespace-pre-wrap">{result.data.original}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-2">Improved</h4>
              <p className="whitespace-pre-wrap">{result.data.improved}</p>
            </div>
          </div>
        )}

        {result.type === 'sentiment' && (
          <div className="bg-white p-4 rounded-lg space-y-3">
            <div>
              <h4 className="font-medium text-gray-600">Sentiment</h4>
              <p className="text-lg capitalize">{result.data.analysis.sentiment}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-600">Tone</h4>
              <p>{result.data.analysis.tone}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-600">Key Themes</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {result.data.analysis.themes.map((theme, index) => (
                  <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-600">Suggestions</h4>
              <p>{result.data.analysis.suggestions}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="ai-assistant">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">AI Assistant</h2>
        <p className="text-gray-600 mt-1">Powered by advanced AI to supercharge your content creation</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="content-tab"
          >
            Content Generation
          </button>
          <button
            onClick={() => setActiveTab('landing')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'landing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="landing-tab"
          >
            Landing Pages
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'education'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="education-tab"
          >
            Education
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'tools'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="tools-tab"
          >
            Text Tools
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'content' && renderContentGeneration()}
      {activeTab === 'landing' && renderLandingPage()}
      {activeTab === 'education' && renderEducation()}
      {activeTab === 'tools' && renderTextTools()}

      {/* Results */}
      {renderResults()}
    </div>
  );
};

export default AIAssistant;
