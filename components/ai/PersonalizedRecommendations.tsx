'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, TrendingUp, ExternalLink } from 'lucide-react';

interface RecommendationItem {
  id: string;
  title: string;
  type: string;
  url?: string;
  score: number;
  reason: string;
}

interface PersonalizedRecommendationsProps {
  userId?: string;
  contentType?: string;
  limit?: number;
  onItemClick?: (item: RecommendationItem) => void;
}

export default function PersonalizedRecommendations({
  userId,
  contentType,
  limit = 10,
  onItemClick,
}: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch RSS trending topics even without userId (public content)
    fetchRecommendations();
  }, [contentType, limit]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get trending topics from RSS first
      const trendingResponse = await fetch(`/api/rss/trending?limit=${limit}`);
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        
        // Convert trending topics to recommendation format
        const trendingRecommendations = trendingData.topics.map((topic: any, idx: number) => ({
          id: topic.id,
          title: topic.topic,
          type: 'trending',
          url: topic.sampleArticles[0]?.url,
          score: Math.round(topic.trendScore * 100),
          reason: `${topic.frequency} mentions across ${topic.uniqueSources} sources`,
        }));

        setRecommendations(trendingRecommendations);
        return;
      }

      // Fallback to AI recommendations if RSS fails
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (contentType) params.append('contentType', contentType);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/ai/recommendations?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const recordInteraction = async (contentId: string, interactionType: 'view' | 'like' | 'bookmark' | 'share') => {
    if (!userId) return;

    try {
      await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contentId,
          interactionType,
        }),
      });
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };


  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading recommendations...</span>
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
            onClick={fetchRecommendations}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No recommendations yet. Start exploring content to get personalized suggestions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-gray-800 dark:text-white">Recommended for You</h3>
        </div>
        <button
          onClick={fetchRecommendations}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Refresh"
        >
          <Loader2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
        {recommendations.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => {
              onItemClick?.(item);
              recordInteraction(item.id, 'view');
            }}
            className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-bold text-sm">
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
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded capitalize">{item.type}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {Math.round(item.score)}% match
                  </span>
                </div>
                {item.reason && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">{item.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
