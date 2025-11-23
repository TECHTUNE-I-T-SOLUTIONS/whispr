'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Users,
  BookOpen,
  TrendingUp,
  Heart,
  Share2,
  Loader2,
  AlertCircle,
  MapPin,
  Mail,
  Globe,
} from 'lucide-react';

interface Creator {
  id: string;
  pen_name: string;
  bio: string;
  profile_picture_url?: string;
  profile_visibility: 'public' | 'private';
  post_count: number;
  engagement_count: number;
  current_streak: number;
  total_points: number;
  verified_badge: boolean;
  social_links: Record<string, string>;
  content_type: string;
  categories: string[];
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  post_type: string;
  category: string;
  engagement_count: number;
  view_count: number;
  published_at: string;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const creatorId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creator, setCreator] = useState<Creator | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    if (creatorId) {
      fetchCreator();
    }
  }, [creatorId]);

  const fetchCreator = async () => {
    try {
      // In production: GET /api/chronicles/creators/[id]
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load creator');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error || !creator) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error || 'Creator not found'}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
                {creator.profile_picture_url ? (
                  <Image
                    src={creator.profile_picture_url}
                    alt={creator.pen_name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  creator.pen_name.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{creator.pen_name}</h1>
                {creator.verified_badge && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mb-4">{creator.bio}</p>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {creator.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Social Links */}
              <div className="flex gap-3 mb-4">
                {creator.social_links?.twitter && (
                  <a
                    href={creator.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Twitter"
                    className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    𝕏
                  </a>
                )}
                {creator.social_links?.website && (
                  <a
                    href={creator.social_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Website"
                    className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {creator.social_links?.linkedin && (
                  <a
                    href={creator.social_links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    in
                  </a>
                )}
              </div>

              {/* Follow Button */}
              <Button
                className={
                  followed
                    ? 'bg-gray-300 dark:bg-slate-700'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                }
                onClick={() => setFollowed(!followed)}
              >
                <Users className="w-4 h-4 mr-2" />
                {followed ? 'Following' : 'Follow'}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-slate-800">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{creator.post_count}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <BookOpen className="w-4 h-4" /> Posts
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-pink-600">{creator.engagement_count}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Heart className="w-4 h-4" /> Engagement
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{creator.current_streak}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" /> Streak
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{creator.total_points}</p>
              <p className="text-sm text-muted-foreground">Points</p>
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Posts</h2>

          {posts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/chronicles/${post.slug}`}>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 hover:border-purple-600 dark:hover:border-purple-400 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                        <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium flex-shrink-0">
                        {post.post_type === 'poem' ? '📝' : '📖'} {post.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> {post.engagement_count}
                      </span>
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
