'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Trash2,
  Lock,
  Unlock,
  MessageSquare,
  BarChart3,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Creator {
  id: string;
  user_id: string;
  pen_name: string;
  bio?: string;
  profile_image_url?: string;
  is_verified?: boolean;
  is_banned?: boolean;
  total_posts: number;
  total_engagement: number;
  total_followers?: number;
  created_at: string;
  updated_at: string;
}

interface CreatorStats {
  total_creators: number;
  verified_creators: number;
  banned_creators: number;
  active_today: number;
  avg_posts_per_creator: number;
}

interface FilterOptions {
  status: string;
  sort: string;
  search: string;
}

const statusColors = {
  verified: 'bg-green-50 border-green-200 text-green-900',
  banned: 'bg-red-50 border-red-200 text-red-900',
  new: 'bg-blue-50 border-blue-200 text-blue-900',
  active: 'bg-purple-50 border-purple-200 text-purple-900',
  inactive: 'bg-gray-50 border-gray-200 text-gray-900',
};

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    sort: 'recent',
    search: '',
  });

  useEffect(() => {
    fetchCreators();
    fetchStats();
    const interval = setInterval(() => {
      fetchCreators();
      fetchStats();
    }, 60000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      // This would be a new endpoint to get all creators (admin view)
      const res = await fetch('/api/chronicles/admin/creators');
      if (!res.ok && res.status !== 404) {
        throw new Error('Failed to fetch creators');
      }

      const text = await res.text();
      if (!text) {
        setCreators([]);
        setError('');
        return;
      }

      const data = JSON.parse(text);
      let items = data.creators || data || [];

      // Ensure items is an array
      if (!Array.isArray(items)) {
        items = [];
      }

      // Filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        items = items.filter(
          (c: Creator) =>
            c.pen_name.toLowerCase().includes(search) ||
            c.id.includes(search)
        );
      }

      if (filters.status === 'verified') {
        items = items.filter((c: Creator) => c.is_verified);
      } else if (filters.status === 'banned') {
        items = items.filter((c: Creator) => c.is_banned);
      }

      // Sort
      if (filters.sort === 'engagement') {
        items.sort((a: Creator, b: Creator) => b.total_engagement - a.total_engagement);
      } else if (filters.sort === 'posts') {
        items.sort((a: Creator, b: Creator) => b.total_posts - a.total_posts);
      } else if (filters.sort === 'recent') {
        items.sort(
          (a: Creator, b: Creator) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      setCreators(items);
      setError('');
    } catch (err) {
      console.error('Failed to fetch creators:', err);
      setCreators([]);
      setError('Failed to load creators');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // This would be fetched from a stats endpoint
      const res = await fetch('/api/chronicles/admin/stats');
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          setStats(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // Set default stats so page doesn't crash
      setStats({
        total_creators: 0,
        verified_creators: 0,
        banned_creators: 0,
        active_today: 0,
        avg_posts_per_creator: 0,
      });
    }
  };

  const handleBanCreator = async (creatorId: string) => {
    if (!confirm('Are you sure you want to ban this creator?')) return;

    try {
      const res = await fetch(`/api/chronicles/admin/creators/${creatorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: true }),
      });

      if (!res.ok) throw new Error('Failed to ban creator');

      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId ? { ...c, is_banned: true } : c
        )
      );

      if (selectedCreator?.id === creatorId) {
        setSelectedCreator({ ...selectedCreator, is_banned: true });
      }
    } catch (err) {
      console.error('Failed to ban creator:', err);
    }
  };

  const handleUnbanCreator = async (creatorId: string) => {
    try {
      const res = await fetch(`/api/chronicles/admin/creators/${creatorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: false }),
      });

      if (!res.ok) throw new Error('Failed to unban creator');

      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId ? { ...c, is_banned: false } : c
        )
      );

      if (selectedCreator?.id === creatorId) {
        setSelectedCreator({ ...selectedCreator, is_banned: false });
      }
    } catch (err) {
      console.error('Failed to unban creator:', err);
    }
  };

  const handleVerifyCreator = async (creatorId: string) => {
    try {
      const res = await fetch(`/api/chronicles/admin/creators/${creatorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: true }),
      });

      if (!res.ok) throw new Error('Failed to verify creator');

      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId ? { ...c, is_verified: true } : c
        )
      );

      if (selectedCreator?.id === creatorId) {
        setSelectedCreator({ ...selectedCreator, is_verified: true });
      }
    } catch (err) {
      console.error('Failed to verify creator:', err);
    }
  };

  const getCreatorStatus = (creator: Creator) => {
    if (creator.is_banned) return 'banned';
    if (creator.is_verified) return 'verified';
    const daysOld = (Date.now() - new Date(creator.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) return 'new';
    return 'active';
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
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Creators Management</h1>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Total Creators</div>
              <div className="text-2xl font-bold text-blue-900">{stats.total_creators}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Verified</div>
              <div className="text-2xl font-bold text-green-900">
                {stats.verified_creators}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-medium">Active Today</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.active_today}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-600 font-medium">Banned</div>
              <div className="text-2xl font-bold text-red-900">{stats.banned_creators}</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Avg Posts</div>
              <div className="text-2xl font-bold text-purple-900">
                {stats.avg_posts_per_creator ? stats.avg_posts_per_creator.toFixed(1) : '0.0'}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle className="w-4 h-4 text-red-600 inline mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {/* Creators List */}
        <div className="col-span-3">
          {/* Filters */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  aria-label="Filter by creator status"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Creators</option>
                  <option value="verified">Verified Only</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort</label>
                <select
                  aria-label="Sort creators by"
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters({ ...filters, sort: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="recent">Recent Joined</option>
                  <option value="engagement">Most Engagement</option>
                  <option value="posts">Most Posts</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  type="text"
                  placeholder="Search creators..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Creators Grid */}
          <div className="space-y-3">
            {creators.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white border rounded-lg">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No creators found</p>
              </div>
            ) : (
              creators.map((creator) => {
                const status = getCreatorStatus(creator);
                return (
                  <div
                    key={creator.id}
                    onClick={() => setSelectedCreator(creator)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      statusColors[status]
                    } ${
                      selectedCreator?.id === creator.id
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-grow">
                        {creator.profile_image_url && (
                          <img
                            src={creator.profile_image_url}
                            alt={creator.pen_name}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{creator.pen_name}</h3>
                            {creator.is_verified && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {creator.is_banned && (
                              <Lock className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          {creator.bio && (
                            <p className="text-sm opacity-75 mb-2">{creator.bio}</p>
                          )}

                          <div className="flex items-center gap-4 text-sm opacity-75">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {creator.total_posts} posts
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {creator.total_engagement} engagement
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(creator.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Creator Detail */}
        <div>
          {selectedCreator ? (
            <div className="bg-white border rounded-lg p-4 sticky top-6">
              <h3 className="font-semibold mb-4">Creator Details</h3>

              {selectedCreator.profile_image_url && (
                <img
                  src={selectedCreator.profile_image_url}
                  alt={selectedCreator.pen_name}
                  className="w-full h-32 rounded-lg object-cover mb-4"
                />
              )}

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs text-gray-600 font-medium">Name</div>
                  <div className="font-semibold">{selectedCreator.pen_name}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 font-medium">Status</div>
                  <div className="capitalize">
                    {selectedCreator.is_banned
                      ? '🚫 Banned'
                      : selectedCreator.is_verified
                      ? '✅ Verified'
                      : '⭐ Active'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 font-medium">Posts</div>
                  <div>{selectedCreator.total_posts}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 font-medium">Engagement</div>
                  <div>{selectedCreator.total_engagement}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 font-medium">Joined</div>
                  <div>{new Date(selectedCreator.created_at).toLocaleDateString()}</div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {!selectedCreator.is_verified && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleVerifyCreator(selectedCreator.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify
                    </Button>
                  )}

                  {!selectedCreator.is_banned && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleBanCreator(selectedCreator.id)}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Ban Creator
                    </Button>
                  )}

                  {selectedCreator.is_banned && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleUnbanCreator(selectedCreator.id)}
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Unban
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed rounded-lg p-4 text-center text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Select a creator to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
