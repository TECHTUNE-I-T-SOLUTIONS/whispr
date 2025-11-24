'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
// import ChroniclesDashboardLayout from '@/components/chronicles-dashboard-layout';
import {
  BarChart3,
  BookOpen,
  Flame,
  Award,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
} from 'lucide-react';

interface CreatorStats {
  totalPosts: number;
  totalEngagement: number;
  currentStreak: number;
  longestStreak: number;
  points: number;
  badges: string[];
  totalFollowers: number;
  penName: string;
  bio?: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  publishedAt?: string;
}

function DashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check if user is authenticated
      const sessionRes = await fetch('/api/session');
      if (!sessionRes.ok) {
        // Not authenticated, redirect to login
        router.push('/chronicles/login');
        return;
      }

      setIsAuthChecked(true);
      fetchDashboardData();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/chronicles/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, postsRes] = await Promise.all([
        fetch('/api/chronicles/creator/stats'),
        fetch('/api/chronicles/creator/posts'),
      ]);

      if (!statsRes.ok) {
        console.error('Stats error:', statsRes.status);
        if (statsRes.status === 401) {
          router.push('/chronicles/login');
          return;
        }
        throw new Error(`Stats failed: ${statsRes.status}`);
      }

      if (!postsRes.ok) {
        console.error('Posts error:', postsRes.status);
        if (postsRes.status === 401) {
          router.push('/chronicles/login');
          return;
        }
        throw new Error(`Posts failed: ${postsRes.status}`);
      }

      const statsData = await statsRes.json();
      const postsData = await postsRes.json();

      setStats(statsData);
      setPosts(Array.isArray(postsData) ? postsData : postsData.posts || []);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (!isAuthChecked) {
    return (
      // <ChroniclesDashboardLayout>
        <div className="flex items-center justify-center py-20 p-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      // </ChroniclesDashboardLayout>
    );
  }

  return (
    // <ChroniclesDashboardLayout>
      <div className="space-y-8 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your stories and track your growth</p>
          </div>
          <Link href="/chronicles/write">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> New Post
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Posts */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Posts</h3>
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold">{stats.totalPosts}</p>
                </div>

                {/* Engagement */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Engagement</h3>
                    <TrendingUp className="w-5 h-5 text-pink-600" />
                  </div>
                  <p className="text-3xl font-bold">{stats.totalEngagement}</p>
                </div>

                {/* Current Streak */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Current Streak</h3>
                    <Flame className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground mt-1">Longest: {stats.longestStreak}</p>
                </div>

                {/* Points */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Points</h3>
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold">{stats.points}</p>
                </div>
              </div>
            )}

            {/* Badges */}
            {stats && stats.badges.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" /> Your Badges
                </h2>
                <div className="flex flex-wrap gap-2">
                  {stats.badges.map((badge) => (
                    <span
                      key={badge}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                    >
                      ✨ {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Section */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Your Posts
                </h2>
              </div>

              <div className="p-6">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="font-bold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">Start your writing journey with your first post!</p>
                    <Link href="/chronicles/write">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Write Your First Post
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold mb-1 truncate">{post.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                post.status === 'published'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              }`}
                            >
                              {post.status}
                            </span>
                            <span>{post.likesCount} likes</span>
                            <span>{post.commentsCount} comments</span>
                            <span>{post.sharesCount} shares</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <Link href={`/chronicles/posts/${post.slug}`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/chronicles/write/${post.id}`}>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    // </ChroniclesDashboardLayout>
  );
}

export default DashboardContent;