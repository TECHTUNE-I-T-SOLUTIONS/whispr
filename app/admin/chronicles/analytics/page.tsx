'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, RefreshCw, TrendingUp, Users, MessageSquare, Heart } from 'lucide-react';

interface AnalyticsData {
  aggregated: {
    totalCreators: number;
    newCreators: number;
    totalPosts: number;
    totalEngagement: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalRevenue: number;
    avgEngagementPerPost: number;
  };
  timeline: any[];
  hourly: any[];
  peakHours: any[];
  trendingHashtags: any[];
  dateRange: { start: string; end: string };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');

  const fetchAnalytics = async (range: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chronicles/admin/analytics?dateRange=${range}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [dateRange]);

  const downloadReport = () => {
    if (!data) return;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${data.dateRange.start}-to-${data.dateRange.end}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-md font-bold">Analytics</h1>
          <p className="text-muted-foreground text-xs">
            {data?.dateRange.start} to {data?.dateRange.end}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchAnalytics(dateRange)}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
            {/* Refresh */}
          </Button>
          <Button onClick={downloadReport}>
            <Download className="w-4 h-4" />
            {/* Export */}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {['7', '30', '90', '365'].map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            onClick={() => setDateRange(range)}
          >
            {range === '7' ? '7 days' : range === '30' ? '30 days' : range === '90' ? '90 days' : '1 year'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{data?.aggregated.totalCreators.toLocaleString()}</span>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
            <p className="text-sm text-green-600 mt-2">+{data?.aggregated.newCreators} new</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{data?.aggregated.totalPosts.toLocaleString()}</span>
              <MessageSquare className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Across all creators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{data?.aggregated.totalEngagement.toLocaleString()}</span>
              <Heart className="w-8 h-8 text-red-500 opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Likes, comments, shares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">${data?.aggregated.totalRevenue.toFixed(2)}</span>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Ad revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Likes', value: data?.aggregated.totalLikes || 0 },
                    { name: 'Comments', value: data?.aggregated.totalComments || 0 },
                    { name: 'Shares', value: data?.aggregated.totalShares || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Engagement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total_likes" stroke="#ef4444" name="Likes" />
                <Line type="monotone" dataKey="total_comments" stroke="#3b82f6" name="Comments" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Activity Today</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.hourly || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour_of_day" label={{ value: 'Hour', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Users', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="active_users" fill="#3b82f6" name="Active Users" />
              <Bar dataKey="new_posts" fill="#10b981" name="New Posts" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Peak Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Peak Activity Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.peakHours.map((hour: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                <span className="font-medium">{hour.hour_of_day || 0}:00 - {(hour.hour_of_day || 0) + 1}:00</span>
                <span className="text-sm">{hour.active_users?.toLocaleString() || 0} active users</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Hashtags */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Hashtags</CardTitle>
          <CardDescription>Top trending tags on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.trendingHashtags.map((hashtag: any) => (
              <div key={hashtag.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                <div>
                  <p className="font-medium">{hashtag.hashtag}</p>
                  <p className="text-sm text-muted-foreground">{hashtag.total_uses.toLocaleString()} uses</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">#{hashtag.trending_rank}</p>
                  <p className="text-sm text-green-600">+{hashtag.total_engagement.toLocaleString()} engagement</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Metric</th>
                  <th className="text-right py-2 px-4">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-2 px-4">Average Engagement per Post</td>
                  <td className="text-right py-2 px-4">{data?.aggregated.avgEngagementPerPost.toFixed(2) || 0}</td>
                </tr>
                <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-2 px-4">Total Likes</td>
                  <td className="text-right py-2 px-4">{data?.aggregated.totalLikes.toLocaleString()}</td>
                </tr>
                <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-2 px-4">Total Comments</td>
                  <td className="text-right py-2 px-4">{data?.aggregated.totalComments.toLocaleString()}</td>
                </tr>
                <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-2 px-4">Total Shares</td>
                  <td className="text-right py-2 px-4">{data?.aggregated.totalShares.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-2 px-4">Revenue per Creator</td>
                  <td className="text-right py-2 px-4">
                    ${data && data.aggregated.totalCreators > 0
                      ? (data.aggregated.totalRevenue / data.aggregated.totalCreators).toFixed(2)
                      : 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
