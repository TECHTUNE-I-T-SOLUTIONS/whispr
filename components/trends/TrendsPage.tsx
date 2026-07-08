'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Loader2, ExternalLink, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { addUtmTracking } from '@/lib/utils/utm';

interface TrendingTopic {
  id: string;
  topic: string;
  keywords: string[];
  frequency: number;
  uniqueSources: number;
  credibilityScore: number;
  recencyScore: number;
  trendScore: number;
  lastUpdated: string;
  sampleArticles?: Array<{
    id: string;
    title: string;
    url: string;
    sourceName: string;
    publishedAt: string;
  }>;
}

export function TrendsPage() {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchTrendingTopics();
  }, [currentPage]);

  const fetchTrendingTopics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rss/trending?limit=100`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trending topics');
      }

      const topics = data.topics || [];
      setTrendingTopics(topics);
      setTotalPages(Math.ceil(topics.length / itemsPerPage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trending topics');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
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

  const getPaginatedTopics = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return trendingTopics.slice(startIndex, endIndex);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading trending topics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchTrendingTopics}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const paginatedTopics = getPaginatedTopics();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-auto mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full text-primary text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            Live from RSS Feeds
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            What's Trending Now
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Real-time topics from trusted sources worldwide, updated continuously
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-primary/10 dark:bg-primary/10 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-primary">{trendingTopics.length}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Topics</p>
          </div>
          <div className="bg-primary/10 dark:bg-primary/10 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {trendingTopics.reduce((sum, t) => sum + t.frequency, 0)}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Mentions</p>
          </div>
          <div className="bg-primary/10 dark:bg-primary/10 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {new Set(trendingTopics.flatMap(t => t.sampleArticles?.map(a => a.sourceName) || [])).size}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Sources</p>
          </div>
          <div className="bg-primary/10 dark:bg-primary/10 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {Math.round(trendingTopics.reduce((sum, t) => sum + t.trendScore, 0) / trendingTopics.length * 100)}%
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Avg Trend Score</p>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {paginatedTopics.map((topic, index) => (
            <div
              key={topic.id}
              className="bg-primary/10 dark:bg-primary/10 rounded-xl p-6 hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    #{(currentPage - 1) * itemsPerPage + index + 1}
                  </span>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>{topic.uniqueSources} sources</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white capitalize">
                {topic.topic.length > 30 ? topic.topic.substring(0, 30) + '...' : topic.topic}
              </h3>

              {topic.sampleArticles && topic.sampleArticles.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                    {topic.sampleArticles[0]?.title}
                  </p>
                  <a
                    href={addUtmTracking(topic.sampleArticles[0]?.url || '', 'trends', 'referral')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <span className="capitalize">{topic.sampleArticles[0]?.sourceName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-3">
                <span>{topic.frequency} mentions</span>
                <span className="text-primary font-medium">
                  {Math.round(topic.trendScore * 100)}% trend
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(topic.lastUpdated)}
                </span>
                <span>Credibility: {Math.round(topic.credibilityScore * 100)}%</span>
              </div>

              {topic.keywords && topic.keywords.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {topic.keywords.slice(0, 3).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary text-xs rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 dark:bg-primary/10 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={fetchTrendingTopics}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <TrendingUp className="w-4 h-4" />
            Refresh Trends
          </button>
        </div>
      </div>
    </div>
  );
}
