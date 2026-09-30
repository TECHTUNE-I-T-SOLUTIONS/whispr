'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Flag,
  MessageSquare,
  Heart,
  Share2,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface PostDetail {
  id: string;
  title: string;
  content?: string;
  description?: string;
  post_type: 'blog' | 'poem' | 'chain_entry' | 'story';
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  creator_id: string;
  creator_name?: string;
  category?: string;
  tags: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  published_at?: string;
  excerpt?: string;
  cover_image_url?: string;
  genre?: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  creator_name: string;
  status: string;
  created_at: string;
  likes_count: number;
}

interface Reaction {
  id: string;
  reaction_type: string;
  creator_name: string;
  created_at: string;
}

interface Flag {
  id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

export default function AdminPostDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const routeParams = useParams();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [postType, setPostType] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagDescription, setFlagDescription] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [editedPost, setEditedPost] = useState<Partial<PostDetail>>({});
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(false);
  const [editedChapterContent, setEditedChapterContent] = useState('');

  useEffect(() => {
    const postId = routeParams.id as string;
    if (postId) {
      fetchPostDetail(postId);
    }
  }, [routeParams.id]);

  const fetchPostDetail = async (postId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chronicles/admin/posts/${postId}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch post');
      }

      const data = await res.json();
      
      // Debug logging
      console.log('Frontend received data:', {
        hasPost: !!data.post,
        postType: data.postType,
        creatorName: data.post?.creator_name,
        hasDescription: !!data.post?.description,
        descriptionLength: data.post?.description?.length || 0,
        chaptersCount: data.chapters?.length || 0,
        commentsCount: data.comments?.length || 0,
        reactionsCount: data.reactions?.length || 0,
        firstChapter: data.chapters?.[0],
        postKeys: data.post ? Object.keys(data.post) : [],
      });
      
      setPost(data.post);
      setPostType(data.postType || ''); // Store postType separately
      setChapters(data.chapters || []);
      setComments(data.comments || []);
      setReactions(data.reactions || []);
      setFlags(data.flags || []);
      setEditedPost(data.post);
      setError('');
    } catch (err) {
      console.error('Failed to fetch post:', err);
      setError('Failed to load post details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePost = async () => {
    try {
      setSaving(true);
      const postId = routeParams.id as string;
      
      // Prepare the update payload
      const updatePayload: any = {};
      
      // For stories, send description field
      if (postType === 'story') {
        if (editedPost.title) updatePayload.title = editedPost.title;
        if (editedPost.description) updatePayload.description = editedPost.description;
        if (editedPost.status) updatePayload.status = editedPost.status;
        if (editedPost.tags) updatePayload.tags = editedPost.tags;
      } else {
        // For other post types, send content field
        if (editedPost.title) updatePayload.title = editedPost.title;
        if (editedPost.content) updatePayload.content = editedPost.content;
        if (editedPost.status) updatePayload.status = editedPost.status;
        if (editedPost.tags) updatePayload.tags = editedPost.tags;
      }
      
      console.log('Sending update payload:', updatePayload);
      
      const res = await fetch(`/api/chronicles/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || 'Failed to update post');
      }

      const data = await res.json();
      console.log('Update response:', data);
      setPost(data.post);
      setEditMode(false);
      setError('');
    } catch (err) {
      console.error('Failed to update post:', err);
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      const postId = routeParams.id as string;
      const res = await fetch(`/api/chronicles/admin/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete post');

      router.push('/admin/chronicles/posts');
    } catch (err) {
      console.error('Failed to delete post:', err);
      setError('Failed to delete post');
    }
  };

  const handleFlagPost = async () => {
    if (!flagReason) return;

    try {
      const postId = routeParams.id as string;
      const res = await fetch(`/api/chronicles/admin/posts/${postId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: flagReason, description: flagDescription }),
      });

      if (!res.ok) throw new Error('Failed to flag post');

      setShowFlagModal(false);
      setFlagReason('');
      setFlagDescription('');
      fetchPostDetail(routeParams.id as string); // Refresh to show new flag
    } catch (err) {
      console.error('Failed to flag post:', err);
      setError('Failed to flag post');
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setEditedChapterContent(chapter.content);
    setIsChapterDrawerOpen(true);
    setEditingChapter(false);
  };

  const handleSaveChapter = async () => {
    if (!selectedChapter) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/chronicles/admin/chapters/${selectedChapter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedChapterContent }),
      });

      if (!res.ok) throw new Error('Failed to update chapter');

      // Refresh chapters list
      const postId = routeParams.id as string;
      fetchPostDetail(postId);
      setEditingChapter(false);
      setError('');
    } catch (err) {
      console.error('Failed to update chapter:', err);
      setError('Failed to update chapter');
    } finally {
      setSaving(false);
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'blog':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'poem':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'chain_entry':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'story':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Post Not Found</h2>
          <p className="text-muted-foreground mb-4 text-gray-600 dark:text-gray-400">The post you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin/chronicles/posts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Button>
        </div>
      </div>
    );
  }

  // Debug render
  console.log('Rendering with:', {
    postType: post?.post_type,
    postTypeState: postType,
    hasDescription: !!post?.description,
    descriptionPreview: post?.description?.substring(0, 100),
    chaptersLength: chapters.length,
    firstChapterTitle: chapters[0]?.title,
    allPostKeys: post ? Object.keys(post) : [],
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/chronicles/posts')}
            className="text-gray-900 dark:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Post Details</h1>
            <p className="text-muted-foreground text-sm mt-1 text-gray-600 dark:text-gray-400">
              View and manage post information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            {editMode ? 'Cancel' : 'Edit'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePost}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Post Info */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {editMode ? (
              <Input
                value={editedPost.title || ''}
                onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
                className="text-2xl font-bold mb-2"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{post.title}</h2>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getPostTypeColor(post.post_type)}>
                {post.post_type}
              </Badge>
              <Badge className={getStatusColor(post.status)}>
                {post.status}
              </Badge>
              {post.category && (
                <Badge variant="outline" className="dark:text-gray-300 dark:border-gray-600">{post.category}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Views</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{post.views_count || 0}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Heart className="w-4 h-4" />
              <span className="text-sm">Likes</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{post.likes_count || 0}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Comments</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{post.comments_count || 0}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Shares</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{post.shares_count || 0}</div>
          </div>
        </div>

        {/* Creator & Date Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">Creator:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {post.creator_name || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">Created:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          {post.published_at && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-600 dark:text-gray-400">Published:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {new Date(post.published_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="dark:text-gray-200">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Content - handle different post types */}
        <div>
          <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            {postType === 'story' ? 'Description' : 'Content'}
          </h3>
          {editMode ? (
            <Textarea
              value={post.post_type === 'story' ? (editedPost.description || '') : (editedPost.content || '')}
              onChange={(e) => {
                if (post.post_type === 'story') {
                  setEditedPost({ ...editedPost, description: e.target.value });
                } else {
                  setEditedPost({ ...editedPost, content: e.target.value });
                }
              }}
              rows={15}
              className="font-mono text-sm"
            />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100">
                {postType === 'story' 
                  ? (post.description || 'No description provided') 
                  : (post.content || 'No content provided')}
              </pre>
            </div>
          )}
        </div>

        {/* Save Button (Edit Mode) */}
        {editMode && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePost} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
          >
            <Edit className="w-4 h-4 mr-2" />
            {editMode ? 'Cancel Edit' : 'Edit Post'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFlagModal(true)}
            className="text-orange-600 hover:text-orange-700"
          >
            <Flag className="w-4 h-4 mr-2" />
            Flag Post
          </Button>
        </div>
      </div>

      {/* Chapters Section (for stories) */}
      {postType === 'story' && chapters.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BookOpen className="w-5 h-5" />
            Chapters ({chapters.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {chapters.map((chapter) => (
              <div 
                key={chapter.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleChapterClick(chapter)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      Chapter {chapter.chapter_number}: {chapter.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(chapter.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChapterClick(chapter);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {chapter.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flags Section */}
      {flags.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-900 dark:text-red-100">
            <Flag className="w-5 h-5" />
            Flags ({flags.length})
          </h3>
          <div className="space-y-3">
            {flags.map((flag) => (
              <div key={flag.id} className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-red-900 dark:text-red-100">{flag.reason}</div>
                    {flag.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{flag.description}</p>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(flag.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge className={flag.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                    {flag.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No comments yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{comment.creator_name}</div>
                    <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">{comment.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(comment.created_at).toLocaleString()}</span>
                      <span>❤️ {comment.likes_count || 0}</span>
                      <Badge className={comment.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {comment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reactions Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Heart className="w-5 h-5" />
          Recent Reactions ({reactions.length})
        </h3>
        {reactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reactions yet</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {reactions.map((reaction) => (
              <div key={reaction.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {reaction.reaction_type === 'like' && '👍'}
                    {reaction.reaction_type === 'love' && '❤️'}
                    {reaction.reaction_type === 'wow' && '😮'}
                    {reaction.reaction_type === 'haha' && '😂'}
                    {reaction.reaction_type === 'sad' && '😢'}
                    {reaction.reaction_type === 'angry' && '😠'}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{reaction.creator_name}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(reaction.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Flag Post</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Reason *</label>
                <Select value={flagReason} onValueChange={setFlagReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="copyright_violation">Copyright Violation</SelectItem>
                    <SelectItem value="misinformation">Misinformation</SelectItem>
                    <SelectItem value="hate_speech">Hate Speech</SelectItem>
                    <SelectItem value="explicit_content">Explicit Content</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Description (Optional)</label>
                <Textarea
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  placeholder="Provide additional details..."
                  rows={4}
                  className="dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFlagModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleFlagPost}
                  disabled={!flagReason}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Flag Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Detail Drawer */}
      {isChapterDrawerOpen && selectedChapter && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsChapterDrawerOpen(false)}
          />
          
          {/* Drawer - Responsive: full screen on mobile, side panel on desktop */}
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="w-screen max-w-2xl bg-white dark:bg-gray-800 shadow-xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    Chapter {selectedChapter.chapter_number}: {selectedChapter.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(selectedChapter.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChapterDrawerOpen(false)}
                  className="ml-4 flex-shrink-0"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {editingChapter ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editedChapterContent}
                      onChange={(e) => setEditedChapterContent(e.target.value)}
                      rows={20}
                      className="font-mono text-sm w-full"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingChapter(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveChapter} disabled={saving}>
                        {saving ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100 overflow-x-auto">
                        {selectedChapter.content}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {!editingChapter && (
                <div className="flex justify-end gap-2 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingChapter(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Chapter
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
