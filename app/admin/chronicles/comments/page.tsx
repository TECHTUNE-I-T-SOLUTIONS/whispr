'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Flag,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Comment {
  id: string;
  post_id: string;
  creator_id: string;
  content: string;
  status: 'approved' | 'pending' | 'rejected' | 'hidden';
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
  creator?: {
    pen_name: string;
    profile_image_url?: string;
  };
  post?: {
    title: string;
    slug: string;
  };
}

interface FilterOptions {
  status: string;
  search: string;
  sort: string;
}

const statusColors = {
  approved: 'bg-green-50 border-green-200 text-green-900',
  pending: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  rejected: 'bg-red-50 border-red-200 text-red-900',
  hidden: 'bg-gray-50 border-gray-200 text-gray-900',
};

const statusIcons = {
  approved: <CheckCircle className="w-4 h-4 text-green-600" />,
  pending: <AlertCircle className="w-4 h-4 text-yellow-600" />,
  rejected: <Flag className="w-4 h-4 text-red-600" />,
  hidden: <Eye className="w-4 h-4 text-gray-600" />,
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'pending',
    search: '',
    sort: 'newest',
  });

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, [filters]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      params.append('limit', '100');

      const res = await fetch(`/api/admin/chronicles/comments?${params}`);
      if (!res.ok) throw new Error('Failed to fetch comments');

      const data = await res.json();
      let items = data.data || data;

      // Filter by search
      if (filters.search) {
        const search = filters.search.toLowerCase();
        items = items.filter(
          (c: Comment) =>
            c.content.toLowerCase().includes(search) ||
            c.creator?.pen_name.toLowerCase().includes(search)
        );
      }

      // Sort
      if (filters.sort === 'newest') {
        items.sort(
          (a: Comment, b: Comment) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (filters.sort === 'engagement') {
        items.sort(
          (a: Comment, b: Comment) => b.likes_count - a.likes_count
        );
      }

      setComments(items);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommentStatus = async (
    commentId: string,
    newStatus: 'approved' | 'pending' | 'rejected' | 'hidden'
  ) => {
    try {
      const res = await fetch(`/api/admin/chronicles/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update comment');

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, status: newStatus } : c
        )
      );
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/admin/chronicles/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete comment');

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleToggleSelect = (commentId: string) => {
    const newSet = new Set(selectedComments);
    if (newSet.has(commentId)) {
      newSet.delete(commentId);
    } else {
      newSet.add(commentId);
    }
    setSelectedComments(newSet);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedComments.size === 0) return;

    try {
      for (const commentId of selectedComments) {
        if (action === 'approve') {
          await handleUpdateCommentStatus(commentId, 'approved');
        } else if (action === 'reject') {
          await handleUpdateCommentStatus(commentId, 'rejected');
        } else if (action === 'delete') {
          await handleDeleteComment(commentId);
        }
      }
      setSelectedComments(new Set());
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  };

  const pendingCount = comments.filter((c) => c.status === 'pending').length;
  const approvedCount = comments.filter((c) => c.status === 'approved').length;
  const rejectedCount = comments.filter((c) => c.status === 'rejected').length;

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Comments Management</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              fetchComments();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total</div>
            <div className="text-2xl font-bold text-blue-900">{comments.length}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-600 font-medium">Pending</div>
            <div className="text-2xl font-bold text-yellow-900">{pendingCount}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Approved</div>
            <div className="text-2xl font-bold text-green-900">{approvedCount}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium">Rejected</div>
            <div className="text-2xl font-bold text-red-900">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle className="w-4 h-4 text-red-600 inline mr-2" />
          {error}
        </div>
      )}

      {/* Filters & Bulk Actions */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sort</label>
            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters({ ...filters, sort: e.target.value })
              }
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="engagement">Most Engagement</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium mb-2 block">Search</label>
            <Input
              type="text"
              placeholder="Search by content or creator..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedComments.size > 0 && (
          <div className="flex items-center gap-3 pt-4 border-t">
            <span className="text-sm text-gray-600">
              {selectedComments.size} selected
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkAction('approve')}
            >
              Approve All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkAction('reject')}
            >
              Reject All
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              Delete All
            </Button>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No comments to review</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`border rounded-lg p-4 ${
                statusColors[comment.status]
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedComments.has(comment.id)}
                  onChange={() => handleToggleSelect(comment.id)}
                  className="w-4 h-4 mt-1"
                />

                {/* Content */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {statusIcons[comment.status]}
                      <span className="font-semibold capitalize">
                        {comment.status}
                      </span>
                    </div>
                    <span className="text-xs opacity-70">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <User className="w-4 h-4 opacity-70" />
                    <span className="font-medium">
                      {comment.creator?.pen_name || 'Unknown'}
                    </span>
                    <span className="opacity-50">•</span>
                    {comment.post && (
                      <>
                        <FileText className="w-4 h-4 opacity-70" />
                        <span className="opacity-70">{comment.post.title}</span>
                      </>
                    )}
                  </div>

                  {/* Comment Content */}
                  <p className="text-sm leading-relaxed mb-3 p-3 bg-white/50 rounded">
                    {comment.content}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs opacity-70 mb-3">
                    <span>👍 {comment.likes_count} likes</span>
                    <span>💬 {comment.replies_count} replies</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {comment.status !== 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleUpdateCommentStatus(comment.id, 'approved')
                      }
                    >
                      Approve
                    </Button>
                  )}
                  {comment.status !== 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleUpdateCommentStatus(comment.id, 'rejected')
                      }
                    >
                      Reject
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
