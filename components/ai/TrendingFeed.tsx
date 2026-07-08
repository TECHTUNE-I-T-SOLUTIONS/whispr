'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Loader2, ExternalLink, Clock, Flame, Newspaper, Github, Youtube } from 'lucide-react';

interface TrendingItem {
  id: string;
  title: string;
  url?: string;
  source: string;
  score?: number;
  publishedAt?: string;
  views?: number;
  stars?: number;
  channelTitle?: string;
}

interface TrendingFeedProps {
  category?: string;
  limit?: number;
  onItemClick?: (item: TrendingItem) => void;
  showSources?: 'all' | 'news' | 'github' | 'youtube' | 'combined';
}

export default function TrendingFeed({
  category,
  limit = 10,
  onItemClick,
  showSources = 'combined',
}: TrendingFeedProps) {
  const [trending, setTrending] = useState<{
    news: TrendingItem[];
    github: TrendingItem[];
    youtube: TrendingItem[];
    overall: TrendingItem[];
  }>({ news: [], github: [], youtube: [], overall: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overall' | 'news' | 'github' | 'youtube'>('overall');

  useEffect(() => {
    fetchTrending();
  }, [category, limit]);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', limit.toString());

      // Fetch AI trending data
      const response = await fetch(`/api/ai/trending?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trending content');
      }

      // Fetch RSS trending data
      let rssTrending: TrendingItem[] = [];
      try {
        const rssResponse = await fetch(`/api/rss/trending?limit=5`);
        if (rssResponse.ok) {
          const rssData = await rssResponse.json();
          rssTrending = (rssData.topics || []).map((topic: any, idx: number) => ({
            id: topic.id,
            title: topic.sampleArticles?.[0]?.title || topic.topic,
            url: topic.sampleArticles?.[0]?.url,
            source: 'news',
            score: topic.trendScore,
            publishedAt: topic.lastUpdated,
          }));
        }
      } catch (rssErr) {
        console.error('Failed to fetch RSS trending:', rssErr);
      }

      // Combine RSS news with existing news
      const combinedNews = [...rssTrending, ...(data.news || [])].slice(0, limit);

      setTrending({
        ...data,
        news: combinedNews,
        overall: [...rssTrending, ...(data.overall || [])].slice(0, limit),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trending content');
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'news':
        return <Newspaper className="w-4 h-4" />;
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'news':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'github':
        return 'text-gray-800 dark:text-gray-300 bg-gray-200 dark:bg-gray-800';
      case 'youtube':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatNumber = (num?: number) => {
    if (!num) return '';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getDisplayItems = () => {
    switch (activeTab) {
      case 'news':
        return trending.news;
      case 'github':
        return trending.github;
      case 'youtube':
        return trending.youtube;
      default:
        return trending.overall;
    }
  };

  const tabs = [
    { key: 'overall' as const, label: 'Overall', icon: TrendingUp },
    { key: 'news' as const, label: 'News', icon: Newspaper },
    { key: 'github' as const, label: 'GitHub', icon: Github },
    { key: 'youtube' as const, label: 'YouTube', icon: Youtube },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading trending content...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        <div className="text-center text-red-500 dark:text-red-400 py-8">
          <p>{error}</p>
          <button
            onClick={fetchTrending}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayItems = getDisplayItems();

  return (
    <div className="bg-transparent border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-800 dark:text-white">Trending Now</h3>
        </div>
        <div>
        <button
          onClick={fetchTrending}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Refresh"
        >
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
        <button
          onClick={() => window.location.href = '/trends'}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="View all trends"
        >
          <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
        </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-slate-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-purple-500/20 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-b-2 border-purple-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/20 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
        {displayItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No trending content available
          </div>
        ) : (
          displayItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="p-4 hover:bg-gray-500/20 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">{item.title}</h4>
                    {item.url && (
                      <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${getSourceColor(item.source)}`}>
                      {getSourceIcon(item.source)}
                      <span className="capitalize">{item.source}</span>
                    </div>
                    {item.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.publishedAt)}
                      </span>
                    )}
                    {item.views && (
                      <span>{formatNumber(item.views)} views</span>
                    )}
                    {item.stars && (
                      <span>{formatNumber(item.stars)} stars</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

