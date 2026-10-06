'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface SuggestedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  type: 'blog' | 'poem';
  category: string;
  tags: string[];
  cover_image_url?: string;
  created_at: string;
  published_at: string;
  reading_time: number;
  admin: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface SuggestedPostsProps {
  postId: string;
  postType?: string;
}

export function SuggestedPosts({ postId, postType }: SuggestedPostsProps) {
  const [posts, setPosts] = useState<SuggestedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedPosts();
  }, [postId, postType]);

  const fetchSuggestedPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/suggested-posts?postId=${postId}&type=${postType}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Error fetching suggested posts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border-t pt-6">
        <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-6">
      <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/${post.type === 'poem' ? 'poems' : 'blog'}/${post.slug}`}
            className="group block"
          >
            <div className="bg-card/50 backdrop-blur rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
              {post.cover_image_url && (
                <div className="relative h-48 w-full bg-muted">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.type === 'poem'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                      {post.type === 'poem' ? '📝 Poem' : '📖 Blog'}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{post.admin.full_name || post.admin.username}</span>
                  <span>{post.reading_time || 1} min read</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
