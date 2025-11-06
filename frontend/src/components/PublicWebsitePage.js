import React, { useState, useEffect } from 'react';
import api from '../api';

const PublicWebsitePage = ({ userId, slug }) => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicPage();
  }, [userId, slug]);

  const fetchPublicPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/public/website/pages/${slug}?user_id=${userId}`);
      setPage(response.data);
    } catch (err) {
      console.error('Error fetching public page:', err);
      setError(err.response?.data?.detail || 'Page not found');
    } finally {
      setLoading(false);
    }
  };

  const renderBlock = (block) => {
    if (!block || !block.type) {
      console.warn('Invalid block:', block);
      return null;
    }

    try {
      return renderBlockContent(block);
    } catch (error) {
      console.error('Error rendering block:', error, block);
      return null;
    }
  };

  const renderBlockContent = (block) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = block.level ? `h${block.level}` : 'h2';
        return (
          <HeadingTag 
            className={`font-bold mb-4 ${
              block.level === 1 ? 'text-4xl md:text-5xl' :
              block.level === 2 ? 'text-3xl md:text-4xl' :
              block.level === 3 ? 'text-2xl md:text-3xl' :
              'text-xl md:text-2xl'
            }`}
            style={block.style || {}}
          >
            {block.content}
          </HeadingTag>
        );

      case 'text':
      case 'paragraph':
        return (
          <p 
            className="mb-4 text-gray-700 leading-relaxed"
            style={block.style || {}}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );

      case 'image':
        return (
          <div className="mb-6">
            <img
              src={block.src || block.url}
              alt={block.alt || ''}
              className="max-w-full h-auto rounded-lg shadow-md"
              style={block.style || {}}
            />
            {block.caption && (
              <p className="text-sm text-gray-600 mt-2 text-center italic">
                {block.caption}
              </p>
            )}
          </div>
        );

      case 'button':
        return (
          <div className="mb-6">
            <a
              href={block.link || block.url || '#'}
              className="inline-block px-6 py-3 rounded-lg font-semibold transition-colors"
              style={block.style || { 
                backgroundColor: '#3B82F6', 
                color: 'white',
                textDecoration: 'none'
              }}
              target={block.newTab ? '_blank' : '_self'}
              rel={block.newTab ? 'noopener noreferrer' : ''}
            >
              {block.text || block.content || 'Click Here'}
            </a>
          </div>
        );

      case 'video':
        return (
          <div className="mb-6 aspect-video">
            {block.url && block.url.includes('youtube') ? (
              <iframe
                src={block.url.replace('watch?v=', 'embed/')}
                className="w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video 
                src={block.url} 
                controls 
                className="w-full h-full rounded-lg"
                style={block.style || {}}
              />
            )}
          </div>
        );

      case 'divider':
        return <hr className="my-8 border-gray-300" style={block.style || {}} />;

      case 'spacer':
        return <div style={{ height: block.height || '20px' }} />;

      case 'html':
        return (
          <div 
            className="mb-6"
            dangerouslySetInnerHTML={{ __html: block.content || block.html }}
          />
        );

      case 'container':
      case 'section':
        return (
          <div 
            className="mb-6"
            style={block.style || {}}
          >
            {block.children && block.children.map((child, index) => (
              <div key={index}>{renderBlock(child)}</div>
            ))}
          </div>
        );

      case 'columns':
        return (
          <div 
            className={`grid gap-6 mb-6 ${
              block.columns === 2 ? 'md:grid-cols-2' :
              block.columns === 3 ? 'md:grid-cols-3' :
              block.columns === 4 ? 'md:grid-cols-4' :
              'md:grid-cols-2'
            }`}
            style={block.style || {}}
          >
            {block.children && block.children.map((child, index) => (
              <div key={index}>{renderBlock(child)}</div>
            ))}
          </div>
        );

      case 'list':
        const ListTag = block.ordered ? 'ol' : 'ul';
        return (
          <ListTag 
            className={`mb-4 ${block.ordered ? 'list-decimal' : 'list-disc'} list-inside`}
            style={block.style || {}}
          >
            {block.items && block.items.map((item, index) => (
              <li key={index} className="mb-2">{item}</li>
            ))}
          </ListTag>
        );

      case 'quote':
      case 'blockquote':
        return (
          <blockquote 
            className="border-l-4 border-blue-500 pl-6 italic mb-6 text-gray-700"
            style={block.style || {}}
          >
            {block.content}
          </blockquote>
        );

      case 'code':
        return (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>{block.content}</code>
          </pre>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold text-blue-900 mb-3">Possible reasons:</h2>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>The page may not be published yet. Pages must be published to be publicly accessible.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>The page might be marked as private. Only public pages can be viewed via this URL.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>The URL might be incorrect or the page may have been deleted.</span>
              </li>
            </ul>
          </div>
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      {page.seo_title && (
        <title>{page.seo_title}</title>
      )}
      
      {/* Custom CSS */}
      {page.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: page.custom_css }} />
      )}

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <article className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          {/* Page Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            {page.title}
          </h1>

          {/* Page Content Blocks */}
          <div className="prose prose-lg max-w-none">
            {page.content && page.content.blocks && page.content.blocks.map((block, index) => (
              <div key={index}>
                {renderBlock(block)}
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* Custom JS */}
      {page.custom_js && (
        <script dangerouslySetInnerHTML={{ __html: page.custom_js }} />
      )}
    </div>
  );
};

export default PublicWebsitePage;
