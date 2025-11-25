'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, AlertCircle, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url?: string;
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  published_at?: string;
  creator?: { id: string; pen_name: string; profile_image_url?: string };
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
      const res = await fetch('/api/chronicles/posts/feed');
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chronicles Feed</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Latest posts from creators</p>
        </div>

        <div className="space-y-6">
          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">No posts yet</div>
          )}

          {posts.map((post) => (
            <article key={post.id} className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="md:flex">
                {post.cover_image_url && (
                  <div className="md:w-1/3 relative h-44 md:h-auto">
                    <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" />
                  </div>
                )}
                <div className="p-4 md:flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {post.creator?.profile_image_url ? (
                      <Image src={post.creator.profile_image_url} alt={post.creator.pen_name} width={32} height={32} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">{post.creator?.pen_name?.charAt(0).toUpperCase()}</div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{post.creator?.pen_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</p>
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    <Link href={`/chronicles/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{post.excerpt}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {post.views_count || 0}</span>
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likes_count || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {post.comments_count || 0}</span>
                    <span className="flex items-center gap-1"><Share2 className="w-4 h-4" /> {post.shares_count || 0}</span>
                    <Link href={`/chronicles/${post.slug}`} className="ml-auto">
                      <Button size="sm" variant="ghost">Read</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
