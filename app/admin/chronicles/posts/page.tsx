'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Filter,
  Search,
  Flag,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  BookMarked,
  Link2,
  Bookmark,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Post {
  id: string;
  title: string;
  post_type: 'blog' | 'poem' | 'chain_entry' | 'story';
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  creator_id: string;
  creator_name: string;
  category?: string;
  tags: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  published_at?: string;
  flagged?: boolean;
  flag_count?: number;
  source: 'chronicles' | 'chain' | 'story';
  chain_id?: string;
  chain_title?: string;
}

interface PostFilters {
  type: string;
  status: string;
  flagged: string;
  search: string;
  sort: string;
}

const postTypeConfig = {
  blog: {
    label: 'Blog Post',
    icon: FileText,
    color: 'bg-green-100 dark:bg-black text-green-800 dark:text-green-200 border-green-200',
    bgColor: 'bg-green-50 dark:bg-black text-green-800 dark:text-green-200',
  },
  poem: {
    label: 'Poem',
    icon: BookMarked,
    color: 'bg-pink-100 dark:bg-black text-pink-800 dark:text-pink-200 border-pink-200',
    bgColor: 'bg-pink-50 dark:bg-black text-pink-800 dark:text-pink-200',
  },
  chain_entry: {
    label: 'Chain Post',
    icon: Link2,
    color: 'bg-purple-100 dark:bg-black text-purple-800 dark:text-purple-200 border-purple-200',
    bgColor: 'bg-purple-50 dark:bg-black text-purple-800 dark:text-purple-200',
  },
  story: {
    label: 'Story',
    icon: BookOpen,
    color: 'bg-blue-100 dark:bg-black text-blue-800 dark:text-blue-200 border-blue-200',
    bgColor: 'bg-blue-50 dark:bg-black text-blue-800 dark:text-blue-200',
  },
};

const sourceConfig = {
  chronicles: { label: 'Chronicles', color: 'bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-200' },
  chain: { label: 'Writing Chain', color: 'bg-purple-100 dark:bg-black text-purple-700 dark:text-purple-200' },
  story: { label: 'Story', color: 'bg-blue-100 dark:bg-black text-blue-700 dark:text-blue-200' },
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-yellow-100 dark:bg-black text-yellow-800 dark:text-yellow-200' },
  published: { label: 'Published', color: 'bg-green-100 dark:bg-black text-green-800 dark:text-green-200' },
  archived: { label: 'Archived', color: 'bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 dark:bg-black text-blue-800 dark:text-blue-200' },
};

export default function AdminPostsManagement() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [filters, setFilters] = useState<PostFilters>({
    type: 'all',
    status: 'all',
    flagged: 'all',
    search: '',
    sort: 'recent',
  });

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    flagged: 0,
    byType: {
      blog: 0,
      poem: 0,
      chain_entry: 0,
      story: 0,
    },
  });

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.flagged !== 'all') params.append('flagged', filters.flagged);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);

      const res = await fetch(`/api/chronicles/admin/posts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch posts');

      const data = await res.json();
      setPosts(data.posts || []);
      setStats(data.stats || stats);
      setError('');
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPosts.length === 0) return;

    try {
      const res = await fetch('/api/chronicles/admin/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_ids: selectedPosts, action }),
      });

      if (!res.ok) throw new Error('Bulk action failed');

      setPosts((prev) =>
        prev.map((post) =>
          selectedPosts.includes(post.id)
            ? { ...post, status: action === 'publish' ? 'published' : action === 'archive' ? 'archived' : post.status }
            : post
        )
      );

      setSelectedPosts([]);
      setShowBulkActions(false);
      fetchPosts(); // Refresh stats
    } catch (err) {
      console.error('Bulk action failed:', err);
      setError('Failed to perform bulk action');
    }
  };

  const handleFlagPost = async (postId: string, reason: string) => {
    try {
      const res = await fetch(`/api/chronicles/admin/posts/${postId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) throw new Error('Failed to flag post');

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, flagged: true, flag_count: (post.flag_count || 0) + 1 } : post
        )
      );
    } catch (err) {
      console.error('Failed to flag post:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/chronicles/admin/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete post');

      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setSelectedPosts((prev) => prev.filter((id) => id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
      setError('Failed to delete post');
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map((post) => post.id));
    }
  };

  const getPostTypeIcon = (type: string) => {
    const config = postTypeConfig[type as keyof typeof postTypeConfig];
    if (!config) return FileText;
    return config.icon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Posts Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all chronicle posts, chain entries, and stories
          </p>
        </div>
        <Button onClick={() => router.push('/admin/chronicles/posts/new')}>
          + New Post
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-black border rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium">Total Posts</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-green-50 dark:bg-black border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Published</div>
          <div className="text-2xl font-bold text-green-900">{stats.published}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-black border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600 font-medium">Drafts</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.draft}</div>
        </div>
        <div className="bg-red-50 dark:bg-black border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600 font-medium">Flagged</div>
          <div className="text-2xl font-bold text-red-900">{stats.flagged}</div>
        </div>
        <div className="bg-purple-50 dark:bg-black border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">Total Views</div>
          <div className="text-2xl font-bold text-purple-900">
            {posts.reduce((sum, post) => sum + (post.views_count || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(postTypeConfig).map(([type, config]) => (
          <div
            key={type}
            className={`${config.bgColor} border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md`}
            onClick={() => setFilters({ ...filters, type })}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">{config.label}</div>
                <div className="text-2xl font-bold mt-1">
                  {stats.byType[type as keyof typeof stats.byType] || 0}
                </div>
              </div>
              <config.icon className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-black border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="blog">Blog Posts</SelectItem>
                <SelectItem value="poem">Poems</SelectItem>
                <SelectItem value="chain_entry">Chain Posts</SelectItem>
                <SelectItem value="story">Stories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Flagged</label>
            <Select
              value={filters.flagged}
              onValueChange={(value) => setFilters({ ...filters, flagged: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="flagged">Flagged Only</SelectItem>
                <SelectItem value="unflagged">Not Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <Select
              value={filters.sort}
              onValueChange={(value) => setFilters({ ...filters, sort: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="engagement">Most Engagement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <div className="bg-blue-50 dark:bg-black border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium">{selectedPosts.length} post(s) selected</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('publish')}
            >
              Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('archive')}
            >
              Archive
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction('delete')}
            >
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedPosts([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white dark:bg-black border rounded-lg overflow-hidden">
        {error && (
          <div className="border-b border-gray-200 p-4 bg-red-50 dark:bg-black">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No posts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-black border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPosts.length === posts.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Post
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Type & Source
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Creator
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Engagement
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {posts.map((post) => {
                  const typeConfig = postTypeConfig[post.post_type];
                  const status = statusConfig[post.status];
                  const PostIcon = getPostTypeIcon(post.post_type);
                  const source = sourceConfig[post.source];

                  return (
                    <tr
                      key={post.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        post.flagged ? 'bg-red-50 dark:bg-red-200/60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={() => togglePostSelection(post.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <PostIcon className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm line-clamp-1">
                              {post.title}
                            </div>
                            {post.source === 'chain' && post.chain_title && (
                              <div className="text-xs text-purple-600 font-medium mt-1">
                                📚 {post.chain_title}
                              </div>
                            )}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {post.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {post.flagged && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
                                <Flag className="w-3 h-3" />
                                <span>FLAGGED ({post.flag_count || 1})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${typeConfig.color}`}>
                            <PostIcon className="w-3 h-3" />
                            {typeConfig.label}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${source.color}`}>
                            {source.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {post.creator_name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span title="Views">👁 {post.views_count || 0}</span>
                          <span title="Likes">👍 {post.likes_count || 0}</span>
                          <span title="Comments">💬 {post.comments_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/chronicles/posts/${post.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/chronicles/posts/${post.id}/edit`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFlagPost(post.id, 'inappropriate_content')}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Flag className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}