'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  BookOpen,
  Flame,
  Award,
  Plus,
  Settings,
  Loader2,
  LogOut,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

interface CreatorStats {
  totalPosts: number;
  totalEngagement: number;
  currentStreak: number;
  longestStreak: number;
  points: number;
  badges: string[];
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

export default function ChroniclesDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'analytics'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, postsRes] = await Promise.all([
        fetch('/api/chronicles/creator/stats'),
        fetch('/api/chronicles/creator/posts'),
      ]);

      if (!statsRes.ok || !postsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const statsData = await statsRes.json();
      const postsData = await postsRes.json();

      setStats(statsData);
      setPosts(postsData.posts || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/chronicles/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground">Manage your stories and track your growth</p>
          </div>
          <div className="flex gap-2">
            <Link href="/chronicles/write">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> New Post
              </Button>
            </Link>
            <Link href="/chronicles/settings">
              <Button variant="outline">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                <BarChart3 className="w-5 h-5 text-pink-600" />
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
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 mb-8">
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

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 mb-8">
          <div className="flex border-b border-gray-200 dark:border-slate-800">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'posts', label: 'Your Posts', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold mb-4">Quick Stats</h3>
                  <p className="text-muted-foreground">Keep writing consistently to build your streak and earn badges!</p>
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div>
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
                        <div className="flex-1">
                          <h4 className="font-bold mb-1">{post.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              post.status === 'published'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {post.status}
                            </span>
                            <span>{post.likesCount} likes</span>
                            <span>{post.commentsCount} comments</span>
                            <span>{post.sharesCount} shares</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
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
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
