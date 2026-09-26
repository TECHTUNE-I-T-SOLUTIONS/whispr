'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  MapPin,
  Heart,
  MessageSquare,
  TrendingUp,
  BookOpen,
  Loader2,
  AlertCircle,
  Filter,
  X,
  UserPlus,
  MessageCircle,
} from 'lucide-react';

interface Creator {
  id: string;
  pen_name: string;
  bio: string;
  profile_picture_url?: string;
  profile_visibility: 'public' | 'private';
  post_count: number;
  engagement_count: number;
  current_streak: number;
  total_points: number;
  verified_badge: boolean;
  social_links: Record<string, string>;
  content_type: string;
  categories: string[];
  location?: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

interface Filters {
  search: string;
  category: string;
  contentType: string;
  sortBy: 'recent' | 'followers' | 'engagement' | 'posts';
}

export default function CreatorsDiscoveryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: 'all',
    contentType: 'all',
    sortBy: 'recent',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [creators, filters]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chronicles/creators/discover');
      
      if (!res.ok) {
        throw new Error('Failed to fetch creators');
      }
      
      const data = await res.json();
      setCreators(data.creators || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load creators');
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...creators];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (creator) =>
          creator.pen_name.toLowerCase().includes(search) ||
          creator.bio.toLowerCase().includes(search) ||
          creator.categories.some((cat) => cat.toLowerCase().includes(search))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter((creator) =>
        creator.categories.includes(filters.category)
      );
    }

    // Content type filter
    if (filters.contentType !== 'all') {
      filtered = filtered.filter(
        (creator) => creator.content_type === filters.contentType
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'followers':
        filtered.sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0));
        break;
      case 'engagement':
        filtered.sort((a, b) => b.engagement_count - a.engagement_count);
        break;
      case 'posts':
        filtered.sort((a, b) => b.post_count - a.post_count);
        break;
      case 'recent':
      default:
        // Keep original order (assumed to be recent)
        break;
    }

    setFilteredCreators(filtered);
  };

  const handleFollow = async (creatorId: string) => {
    try {
      const res = await fetch('/api/chronicles/creators/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
      });

      if (!res.ok) throw new Error('Failed to follow creator');

      const data = await res.json();

      // Update local state
      setCreators((prev) =>
        prev.map((creator) =>
          creator.id === creatorId
            ? { ...creator, is_following: data.following }
            : creator
        )
      );
    } catch (err) {
      console.error('Failed to follow creator:', err);
    }
  };

  const handleWhispr = (creatorId: string, penName: string) => {
    router.push(`/chronicles/messages?recipient=${creatorId}&name=${penName}`);
  };

  const categories = [
    'all',
    'Fiction',
    'Poetry',
    'Non-Fiction',
    'Fantasy',
    'Romance',
    'Sci-Fi',
    'Mystery',
    'Thriller',
    'Horror',
    'Biography',
    'Self-Help',
  ];

  const contentTypes = ['all', 'Short Stories', 'Novels', 'Poetry', 'Essays', 'Articles'];

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/50 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Discover Creators</h1>
          </div>
          <p className="text-lg opacity-90">
            Connect with fellow creators, share interests, and grow together
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search creators by name, bio, or interests..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters && <X className="w-4 h-4" />}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-black"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <select
                  value={filters.contentType}
                  onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-black"
                >
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-black"
                >
                  <option value="recent">Most Recent</option>
                  <option value="followers">Most Followers</option>
                  <option value="engagement">Most Engagement</option>
                  <option value="posts">Most Posts</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg mb-8">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Creators Grid */}
        {filteredCreators.length === 0 ? (
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {creators.length === 0 ? 'No creators found' : 'No creators match your filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator) => (
              <div
                key={creator.id}
                className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Creator Header */}
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/60 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 overflow-hidden">
                      {creator.profile_picture_url ? (
                        <img
                          src={creator.profile_picture_url}
                          alt={creator.pen_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        creator.pen_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          href={`/chronicles/portfolio/${creator.pen_name}`}
                          className="font-semibold text-lg truncate hover:text-primary transition-colors"
                        >
                          {creator.pen_name}
                        </Link>
                        {creator.verified_badge && (
                          <span className="text-blue-500">✓</span>
                        )}
                      </div>
                      {creator.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{creator.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{creator.bio}</p>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {creator.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs"
                      >
                        {cat}
                      </span>
                    ))}
                    {creator.categories.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                        +{creator.categories.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-purple-600">{creator.post_count}</p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-pink-600">{creator.engagement_count}</p>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{creator.followers_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={creator.is_following ? 'outline' : 'default'}
                      className={`flex-1 ${
                        !creator.is_following
                          ? 'bg-gradient-to-r from-primary/60 to-primary/80 hover:from-primary/20 hover:to-primary/40 text-white'
                          : ''
                      }`}
                      onClick={() => handleFollow(creator.id)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {creator.is_following ? 'Following' : 'Follow'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWhispr(creator.id, creator.pen_name)}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link href={`/chronicles/portfolio/${creator.pen_name}`}>
                        <BookOpen className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
