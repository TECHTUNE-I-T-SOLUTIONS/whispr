'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, AlertCircle, Eye, Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Author {
  id: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  type?: 'admin' | 'creator';
}

interface FeedPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  type: string;
  source: 'admin' | 'creator';
  featured: boolean;
  readingTime: number;
  tags?: string[];
  viewCount: number;
  likesCount: number;
  coverImageUrl?: string;
  createdAt: string;
  publishedAt: string;
  author: Author;
  userReaction?: string | null;
}

// Helper function to strip HTML tags from content
function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/\n\n+/g, '\n') // Clean up multiple newlines
    .trim();
}

// Helper function to get preview text from content
function getContentPreview(content: string, excerpt: string): string {
  if (excerpt) return excerpt;
  const stripped = stripHtmlTags(content);
  return stripped.substring(0, 150) + (stripped.length > 150 ? '...' : '');
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 100); // Limit length
}

// Helper function to get detail page URL
function getDetailPageUrl(post: FeedPost): string {
  if (post.source === 'admin') {
    return `/poems/${post.id}`;
  }
  // For creator posts, generate slug from title for routing
  const slug = generateSlug(post.title);
  return `/chronicles/${slug}`;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/feed');
      if (!res.ok) {
        setError('Failed to load feed');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPosts(data.posts || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 pt-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 pt-20">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{error}</p>
          <Button onClick={fetchFeed} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Chronicles Feed</h1>
          <p className="text-gray-600 dark:text-gray-400">Latest posts from creators and admins</p>
        </div>

        <div className="space-y-6">
          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">No posts yet</div>
          )}

          {posts.map((post) => {
            const previewText = getContentPreview(post.content, post.excerpt);
            const detailUrl = getDetailPageUrl(post);
            const authorInitials = post.author?.name?.charAt(0).toUpperCase() || '?';

            return (
              <article 
                key={post.id} 
                className="bg-white dark:bg-black rounded-lg shadow-md border border-gray-200 dark:border-slate-800 hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Cover Image */}
                  {post.coverImageUrl && (
                    <div className="md:w-1/3 relative h-44 md:h-auto overflow-hidden bg-gray-200 dark:bg-slate-800">
                      <Image 
                        src={post.coverImageUrl} 
                        alt={post.title} 
                        fill 
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className={`p-4 md:p-6 flex flex-col justify-between ${post.coverImageUrl ? 'md:w-2/3' : 'w-full'}`}>
                    {/* Author Info */}
                    <div className="flex items-center gap-3 mb-4">
                      {post.author?.avatar_url ? (
                        <img 
                          src={post.author.avatar_url} 
                          alt={post.author.name || 'Author'}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.onerror = null;
                            img.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {authorInitials}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {post.author?.name || 'Unknown Author'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {post.source === 'admin' ? 'Whispr Admin' : 'Chronicles Creator'}
                        </p>
                      </div>
                      {post.featured && (
                        <span className="text-xs font-semibold px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt/Preview */}
                    <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base mb-4 line-clamp-2">
                      {previewText}
                    </p>

                    {/* Meta Info and Action */}
                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> 
                        {post.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> 
                        {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> 
                        {post.readingTime} min read
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      
                      <Link href={detailUrl} className="ml-auto">
                        <Button size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700">
                          Read Full Post
                        </Button>
                      </Link>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <span 
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{post.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
