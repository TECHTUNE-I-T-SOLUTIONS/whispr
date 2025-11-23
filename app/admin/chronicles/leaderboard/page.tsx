'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Trophy,
  Target,
  Zap,
  User,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  id: string;
  creator_id: string;
  pen_name: string;
  profile_image_url?: string;
  score: number;
  rank: number;
  category: 'weekly' | 'monthly' | 'alltime' | 'trending';
  total_posts: number;
  total_engagement: number;
  total_likes: number;
  created_at: string;
  updated_at: string;
}

interface CategoryStats {
  category: string;
  total_creators: number;
  avg_score: number;
  max_score: number;
}

export default function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    'weekly' | 'monthly' | 'alltime' | 'trending'
  >('weekly');
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState('');
  const [lastRecalculated, setLastRecalculated] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchStats();
  }, [selectedCategory]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/chronicles/leaderboard?category=${selectedCategory}&limit=100`
      );
      if (!res.ok) throw new Error('Failed to fetch leaderboard');

      const data = await res.json();
      setEntries(data.entries || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const categories = ['weekly', 'monthly', 'alltime', 'trending'] as const;
      const stats: CategoryStats[] = [];

      for (const category of categories) {
        const res = await fetch(
          `/api/chronicles/leaderboard?category=${category}&limit=1000`
        );
        if (res.ok) {
          const data = await res.json();
          const categoryEntries = data.entries || [];

          if (categoryEntries.length > 0) {
            stats.push({
              category,
              total_creators: categoryEntries.length,
              avg_score:
                categoryEntries.reduce(
                  (sum: number, e: LeaderboardEntry) => sum + e.score,
                  0
                ) / categoryEntries.length,
              max_score: Math.max(...categoryEntries.map((e: LeaderboardEntry) => e.score)),
            });
          }
        }
      }

      setCategoryStats(stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleRecalculateScores = async () => {
    if (
      !confirm(
        'This will recalculate all leaderboard scores. This may take a moment. Continue?'
      )
    )
      return;

    try {
      setRecalculating(true);
      const res = await fetch('/api/chronicles/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });

      if (!res.ok) throw new Error('Failed to recalculate scores');

      setLastRecalculated(new Date().toISOString());
      await fetchLeaderboard();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate');
    } finally {
      setRecalculating(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 border-gray-300';
    if (rank === 3) return 'bg-orange-100 border-orange-300';
    return 'bg-blue-50 border-blue-200';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank < 11 ? '⭐' : '•';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Leaderboard Management</h1>
          </div>
          <Button
            onClick={handleRecalculateScores}
            disabled={recalculating}
            className="bg-primary hover:bg-primary/90"
          >
            <Zap className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Recalculating...' : 'Recalculate All Scores'}
          </Button>
        </div>

        {/* Category Selector */}
        <div className="flex gap-3 mb-6">
          {(['weekly', 'monthly', 'alltime', 'trending'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {lastRecalculated && (
          <div className="text-sm text-gray-600 mb-4">
            Last recalculated: {new Date(lastRecalculated).toLocaleString()}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle className="w-4 h-4 text-red-600 inline mr-2" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {categoryStats.map((stat) => (
          <div
            key={stat.category}
            className={`border rounded-lg p-4 ${
              stat.category === selectedCategory
                ? 'bg-primary/5 border-primary'
                : 'bg-gray-50'
            }`}
          >
            <div className="text-sm font-medium capitalize mb-1">
              {stat.category}
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-600">Creators</div>
                <div className="text-xl font-bold">{stat.total_creators}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Max Score</div>
                <div className="text-lg font-semibold">{Math.round(stat.max_score)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Avg Score</div>
                <div className="text-lg font-semibold">
                  {Math.round(stat.avg_score)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Creator</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Score</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Posts</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Engagement</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Likes</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No leaderboard entries for this category</p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`border-b transition-colors hover:bg-gray-50 ${getRankColor(
                      entry.rank
                    )}`}
                  >
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRankIcon(entry.rank)}</span>
                        <span className="font-bold text-lg">#{entry.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center gap-3">
                        {entry.profile_image_url && (
                          <img
                            src={entry.profile_image_url}
                            alt={entry.pen_name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-semibold">{entry.pen_name}</div>
                          <div className="text-xs text-gray-500">
                            {entry.creator_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-lg">{entry.score}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-700">
                        <FileText className="w-4 h-4" />
                        {entry.total_posts}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-700">
                        <TrendingUp className="w-4 h-4" />
                        {entry.total_engagement}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-700">
                        ❤️ {entry.total_likes}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {new Date(entry.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scoring Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Scoring Algorithm</h3>
        <p className="text-sm text-blue-800 font-mono">
          Score = (Engagement × 2) + (Posts × 10) + (Streak × 5)
        </p>
        <p className="text-xs text-blue-700 mt-2">
          Engagement includes likes and comments. Streak is consecutive posting days.
        </p>
      </div>
    </div>
  );
}

// Add missing import
const FileText = ({ className }: { className: string }) => (
  <div className={className}>📄</div>
);
