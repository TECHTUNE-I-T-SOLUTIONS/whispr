'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Analytics {
  summary: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalEngagement: number;
    avgEngagementPerPost: number;
    avgViewsPerPost: number;
  };
  trendingPosts: Array<{
    id: string;
    title: string;
    slug: string;
    views_count: number;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    engagement: number;
    type?: string;
    chain_id?: string;
  }>;
  dailyAnalytics: Array<{
    date: string;
    posts: number;
    views: number;
    engagement: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    views: number;
    engagement: number;
  }>;
}

const COLORS = ['#9333ea', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chronicles/posts/analytics');

      if (!response.ok) {
        setError('Failed to load analytics');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAnalytics(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black pt-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black pt-20">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{error}</p>
          <Button onClick={fetchAnalytics} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, trendingPosts, dailyAnalytics, categoryBreakdown } = analytics;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your content performance and engagement metrics
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Published</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary.publishedPosts}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {summary.draftPosts} drafts
            </p>
          </div>

          <div className="bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Views</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary.totalViews.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Avg: {Math.round(summary.avgViewsPerPost)}/post
            </p>
          </div>

          <div className="bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Likes</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary.totalLikes.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Engagement metric
            </p>
          </div>

          <div className="bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Comments</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary.totalComments.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Total comments
            </p>
          </div>

          <div className="bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Engagement</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary.totalEngagement.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Avg: {Math.round(summary.avgEngagementPerPost)}/post
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Daily Engagement Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Engagement Trend (Last 30 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(dailyAnalytics.length / 5) || 0}
                />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#9333ea"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown Pie Chart */}
          <div className="bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Posts by Category
            </h2>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Category Details */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800 mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Category Performance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Category
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Posts
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Views
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Engagement
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Avg/Post
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((cat) => (
                    <tr
                      key={cat.category}
                      className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                        {cat.category}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                        {cat.count}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                        {cat.views.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                        {cat.engagement.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-purple-600 dark:text-purple-400 font-semibold">
                        {Math.round(cat.engagement / cat.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trending Posts */}
        {trendingPosts.length > 0 && (
          <div className="bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Top Performing Posts
            </h2>
            <div className="space-y-3">
              {trendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {post.title}
                    </h3>
                    <div className="flex gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.likes_count} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.comments_count} comments
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
