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
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, contentType, limit]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
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

  if (!userId) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-center text-gray-500">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400" />
          <p>Sign in to get personalized recommendations</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-center text-red-500 py-8">
          <p>{error}</p>
          <button
            onClick={fetchRecommendations}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-center text-gray-500 py-8">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No recommendations yet. Start exploring content to get personalized suggestions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-800">Recommended for You</h3>
        </div>
        <button
          onClick={fetchRecommendations}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <Loader2 className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {recommendations.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => {
              onItemClick?.(item);
              recordInteraction(item.id, 'view');
            }}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-gray-900 line-clamp-2">{item.title}</h4>
                  {item.url && (
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="px-2 py-0.5 bg-gray-100 rounded capitalize">{item.type}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {Math.round(item.score)}% match
                  </span>
                </div>
                {item.reason && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
