'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper to extract first image from HTML content
function extractFirstImageFromContent(content: string): string | null {
  if (!content) return null;
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
  return imgMatch ? imgMatch[1] : null;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  cover_image_url?: string;
  published_at?: string;
  is_challenge_entry?: boolean;
}

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chronicles/creator/posts?status=published');
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setPosts(json.posts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
          <p className="text-lg text-red-600">{error}</p>
          <Button onClick={fetchPosts} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Posts</h1>
          <Link href="/chronicles/write">
            <Button>New Post</Button>
          </Link>
        </div>

        <div className="space-y-6">
          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">No posts yet</div>
          )}

          {posts.map((post) => {
            const thumbnail = post.cover_image_url || extractFirstImageFromContent(post.content);
            
            return (
              <article key={post.id} className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 dark:hover:shadow-white dark:hover:shadow-sm overflow-hidden">
                <div className="md:flex">
                  {thumbnail && (
                    <div className="md:w-1/3 relative h-44 md:h-auto">
                      <Image src={thumbnail} alt={post.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-4 md:flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        <Link href={`/chronicles/${post.slug}`}>{post.title}</Link>
                      </h2>
                      {post.is_challenge_entry && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          🎯 Challenge Entry
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{post.excerpt}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</span>
                      <Link href={`/chronicles/${post.slug}`} className="ml-auto">
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                    </div>
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
