'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Loader2, AlertCircle } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  post_type: 'blog' | 'poem';
  category: string;
  tags: string[];
  cover_image_url?: string;
  view_count: number;
  engagement_count: number;
  published_at: string;
  creator?: {
    id: string;
    pen_name: string;
    profile_picture_url?: string;
    bio: string;
  };
}

export default function PublicPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [post, setPost] = useState<Post | null>(null);
  const [liked, setLiked] = useState(false);
  const [engagementCount, setEngagementCount] = useState(0);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      // In production, this would fetch from `/api/chronicles/posts/[slug]`
      // For now, this is a placeholder
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    setLiked(!liked);
    setEngagementCount(liked ? engagementCount - 1 : engagementCount + 1);

    try {
      const res = await fetch('/api/chronicles/engagement', {
        method: liked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          action: 'like',
        }),
      });

      if (!res.ok) {
        // Revert on error
        setLiked(!liked);
        setEngagementCount(liked ? engagementCount + 1 : engagementCount - 1);
      }
    } catch (err) {
      console.error('Like error:', err);
      setLiked(!liked);
      setEngagementCount(liked ? engagementCount + 1 : engagementCount - 1);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error || 'Post not found'}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <article className="max-w-3xl mx-auto py-12 px-4">
        {/* Cover Image */}
        {post.cover_image_url && (
          <div className="mb-8 relative h-96 w-full rounded-lg overflow-hidden">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Post Header */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              {post.post_type === 'poem' ? '📝 Poem' : '📖 Blog Post'}
            </span>
            <span className="px-3 py-1 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>

          <h1 className="text-5xl font-bold mb-4">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 font-medium">{post.excerpt}</p>
          )}

          {/* Author Info */}
          {post.creator && (
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                {post.creator.profile_picture_url ? (
                  <Image
                    src={post.creator.profile_picture_url}
                    alt={post.creator.pen_name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  post.creator.pen_name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <Link href={`/chronicles/creators/${post.creator.id}`}>
                  <p className="font-semibold hover:text-purple-600 cursor-pointer">
                    {post.creator.pen_name}
                  </p>
                </Link>
                <p className="text-sm text-muted-foreground">{post.creator.bio}</p>
              </div>
            </div>
          )}

          {/* Post Meta */}
          <div className="flex gap-6 text-sm text-muted-foreground mt-6 text-center justify-around border-t border-gray-200 dark:border-slate-800 pt-6">
            <div>
              <p className="text-lg font-bold text-foreground">{post.view_count}</p>
              <p>Views</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{engagementCount}</p>
              <p>Engagement</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {new Date(post.published_at).toLocaleDateString()}
              </p>
              <p>Published</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none mb-8 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/chronicles/feed?tag=${tag}`}
                className="px-3 py-1 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="border-t border-b border-gray-200 dark:border-slate-800 py-4 flex gap-3 mb-8">
          <Button
            variant={liked ? 'default' : 'outline'}
            className={liked ? 'bg-red-600 hover:bg-red-700' : ''}
            onClick={handleLike}
          >
            <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
            Like
          </Button>
          <Button variant="outline">
            <MessageCircle className="w-4 h-4 mr-2" />
            Comment
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Comments Section */}
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>
          <p className="text-muted-foreground">Comments coming soon</p>
        </div>
      </article>
    </main>
  );
}
