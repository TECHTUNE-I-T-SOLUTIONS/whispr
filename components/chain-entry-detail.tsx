'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

interface Entry {
  id: string;
  chain_id: string;
  creator_id: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  category?: string;
  tags?: string[];
  status: string;
  sequence: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  added_by?: string;
}

interface Creator {
  id: string;
  pen_name: string;
  profile_image_url?: string;
}

export default function ChainEntryDetail({
  chainId,
  entryId,
  initial_entry,
  chain_title,
}: {
  chainId: string;
  entryId: string;
  initial_entry: Entry;
  chain_title: string;
}) {
  const [entry, setEntry] = useState<Entry>(initial_entry);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [liked, setLiked] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);

  const supabase = createSupabaseBrowser();

  // Initialize auth session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user || null);
    };
    getSession();
  }, [supabase]);

  // Track view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch(
          `/api/chronicles/chains/${chainId}/entries/${entryId}/engage`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'view' }),
          }
        );

        // Update view count
        setEntry(prev => ({
          ...prev,
          views_count: prev.views_count + 1,
        }));
      } catch (err) {
        console.error('Failed to track view:', err);
      }
    };

    trackView();
  }, [chainId, entryId, supabase]);

  // Fetch creator info
  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const { data, error } = await supabase
          .from('chronicles_creators')
          .select('id, pen_name, profile_image_url')
          .eq('id', entry.creator_id)
          .single();

        if (data) {
          setCreator(data);
        }
      } catch (err) {
        console.error('Failed to fetch creator:', err);
      }
    };

    if (entry.creator_id) {
      fetchCreator();
    }
  }, [entry.creator_id, supabase]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!showComments) return;
      try {
        const res = await fetch(
          `/api/chronicles/chains/${chainId}/entries/${entryId}/comments`
        );
        const data = await res.json();
        if (data.success) {
          setComments(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };

    fetchComments();
  }, [showComments, chainId, entryId]);

  // Check if user already liked
  useEffect(() => {
    const checkLiked = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession?.user?.id) return;

        const { data: creator } = await supabase
          .from('chronicles_creators')
          .select('id')
          .eq('user_id', authSession.user.id)
          .single();

        if (!creator) return;

        const { data, error } = await supabase
          .from('chronicles_chain_entry_reactions')
          .select('id')
          .eq('entry_id', entryId)
          .eq('creator_id', creator.id)
          .eq('reaction_type', 'like')
          .maybeSingle();

        if (!error && data) {
          setLiked(true);
        }
      } catch (err) {
        console.error('Failed to check like status:', err);
      }
    };

    checkLiked();
  }, [entryId, supabase]);

  const handleLike = async () => {
    if (!authUser) {
      alert('Please log in to like this entry');
      return;
    }

    setLoadingAction('like');
    try {
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/chronicles/chains/${chainId}/entries/${entryId}/engage`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'like' }),
        }
      );

      if (res.ok) {
        setLiked(!liked);
        setEntry(prev => ({
          ...prev,
          likes_count: liked ? prev.likes_count - 1 : prev.likes_count + 1,
        }));
      }
    } catch (err) {
      console.error('Failed to like entry:', err);
      alert('Failed to like entry');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleShare = async () => {
    setLoadingAction('share');
    try {
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const shareUrl = `${window.location.origin}/chronicles/chains/${chainId}/entries/${entryId}`;

      if (navigator.share) {
        await navigator.share({
          title: entry.title,
          text: entry.excerpt || entry.content.substring(0, 100),
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }

      // Track share action
      await fetch(
        `/api/chronicles/chains/${chainId}/entries/${entryId}/engage`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'share' }),
        }
      );

      setEntry(prev => ({
        ...prev,
        shares_count: prev.shares_count + 1,
      }));
    } catch (err) {
      console.error('Failed to share entry:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/chronicles/chains/${chainId}/entries/${entryId}/comments`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ content: newComment }),
        }
      );

      if (res.ok) {
        setNewComment('');
        // Refresh comments
        const commentsRes = await fetch(
          `/api/chronicles/chains/${chainId}/entries/${entryId}/comments`
        );
        const commentsData = await commentsRes.json();
        if (commentsData.success) {
          setComments(commentsData.data || []);
        }
        // Update comment count
        setEntry(prev => ({
          ...prev,
          comments_count: prev.comments_count + 1,
        }));
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
      alert('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="whispr-gradient min-h-screen py-10">
      <div className="container max-w-3xl">
        {/* Back Button */}
        <Link
          href={`/chronicles/chains/${chainId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <span>←</span>
          <span>Back to {chain_title}</span>
        </Link>

        {/* Entry Card */}
        <article className="bg-card border border-border rounded-lg overflow-hidden">
          {entry.cover_image_url && (
            <div className="relative w-full h-64 overflow-hidden">
              <img
                src={entry.cover_image_url}
                alt={entry.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="badge bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded mb-3 inline-block">
                  Entry #{entry.sequence}
                </div>
                <h1 className="text-4xl font-bold mb-2">{entry.title}</h1>
                {entry.category && (
                  <p className="text-muted-foreground text-sm">Category: {entry.category}</p>
                )}
              </div>
            </div>

            {/* Creator Info */}
            {creator && (
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/50">
                {creator.profile_image_url && (
                  <img
                    src={creator.profile_image_url}
                    alt={creator.pen_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">@{creator.pen_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Excerpt */}
            {entry.excerpt && (
              <p className="text-lg text-muted-foreground italic mb-6">{entry.excerpt}</p>
            )}

            {/* Content */}
            <div className="prose dark:prose-invert max-w-none mb-8">
              <p>{entry.content}</p>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {entry.tags.map(tag => (
                  <span
                    key={tag}
                    className="badge bg-secondary/50 text-secondary-foreground text-xs px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement Stats */}
            <div className="grid grid-cols-4 gap-2 py-4 border-t border-b border-border/50 mb-6">
              <div className="text-center">
                <div className="text-lg font-bold">{entry.likes_count}</div>
                <div className="text-xs text-muted-foreground">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{entry.comments_count}</div>
                <div className="text-xs text-muted-foreground">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{entry.shares_count}</div>
                <div className="text-xs text-muted-foreground">Shares</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{entry.views_count}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center flex-wrap mb-8">
              <button
                onClick={handleLike}
                disabled={loadingAction === 'like'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  liked
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                } disabled:opacity-50`}
              >
                <span>{liked ? '❤️' : '🤍'}</span>
                {loadingAction === 'like' ? 'Loading...' : liked ? 'Liked' : 'Like'}
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors"
              >
                <span>💬</span>
                Comments
              </button>

              <button
                onClick={handleShare}
                disabled={loadingAction === 'share'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <span>↗️</span>
                {loadingAction === 'share' ? 'Sharing...' : 'Share'}
              </button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="border-t border-border/50 pt-6">
                <h3 className="text-lg font-semibold mb-4">Comments</h3>

                {/* Comment Form */}
                {authUser ? (
                  <form onSubmit={handleSubmitComment} className="mb-6">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg bg-secondary/20 border border-border/50 focus:border-primary outline-none resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    <Link href="/auth/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                    {' '}to comment
                  </p>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="p-4 bg-secondary/10 rounded-lg">
                        <div className="flex items-start gap-3 mb-2">
                          {comment.creator?.profile_image_url && (
                            <img
                              src={comment.creator.profile_image_url}
                              alt={comment.creator.pen_name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              @{comment.creator?.pen_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
