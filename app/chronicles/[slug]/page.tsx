'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Loader2, AlertCircle, LogIn, X, Send } from 'lucide-react';
import { AppBanner } from '@/components/app-banner';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: 'blog' | 'poem';
  category: string;
  tags: string[];
  coverImageUrl?: string;
  viewCount: number;
  likesCount: number;
  commentsCount?: number;
  sharesCount?: number;
  publishedAt: string;
  author?: {
    id: string;
    name: string;
    penName: string;
    avatar_url?: string;
    bio: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    avatar_url?: string;
  };
}

export default function PublicPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [post, setPost] = useState<Post | null>(null);
  const [liked, setLiked] = useState(false);
  const [engagementCount, setEngagementCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentCreator, setCurrentCreator] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userReactionId, setUserReactionId] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [sharesCount, setSharesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (slug) {
      checkAuthentication();
      fetchPost();
    }
  }, [slug]);

  // Check user's reaction and fetch reactions for this post after post loads
  useEffect(() => {
    if (post && authToken) {
      checkUserLike(post.id);
    }
  }, [post, authToken]);

  const checkAuthentication = async () => {
    try {
      const supabase = createSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.access_token) {
        setAuthToken(session.access_token);
      }
      
      const res = await fetch('/api/session');
      if (res.ok) {
        const data = await res.json();
        // Check if user is authenticated and has a creator session
        const isAuth = data.authenticated && data.creator;
        setIsAuthenticated(isAuth);
        if (isAuth) {
          setCurrentCreator(data.creator);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentCreator(null);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setIsAuthenticated(false);
      setCurrentCreator(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/chronicles/posts/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Post not found');
        } else if (response.status === 401) {
          setError('You must be logged in as a Chronicles creator to view this post');
        } else {
          setError('Failed to load post');
        }
        setLoading(false);
        return;
      }
      
      const result = await response.json();
      
      // Handle both response structures: { success, data } and { post }
      const postData = result.data || result.post;
      
      if (!postData) {
        setError('Post data not found');
        setLoading(false);
        return;
      }
      
      setPost(postData);
      setEngagementCount(postData.likesCount || 0);
      setSharesCount(postData.sharesCount || 0);
      
      // Fetch comments for the post
      await fetchComments(postData.id);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(err instanceof Error ? err.message : 'Failed to load post');
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/chronicles/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const checkUserLike = async (postId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/chronicles/posts/${postId}/reactions`, {
        headers,
      });
      
      if (res.ok) {
        const data = await res.json();
        // Set reaction counts
        const counts: Record<string, number> = {};
        if (data.reactions && Array.isArray(data.reactions)) {
          data.reactions.forEach((reaction: any) => {
            counts[reaction.type] = reaction.count;
          });
        }
        setReactionCounts(counts);
        
        // Check if current user has liked
        if (data.userReaction) {
          setLiked(data.userReaction === 'like' || data.userReaction.type === 'like');
          // Store reaction for deletion
          if (typeof data.userReaction === 'object' && data.userReaction.id) {
            setUserReactionId(data.userReaction.id);
          }
        } else {
          setLiked(false);
          setUserReactionId(null);
        }
      }
    } catch (err) {
      console.error('Error checking user like:', err);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    // Check if user is authenticated
    if (!isAuthenticated || !authToken) {
      setShowLoginModal(true);
      return;
    }

    setIsLiking(true);
    const previousLiked = liked;
    const previousCount = reactionCounts['like'] || 0;
    
    try {
      if (liked && userReactionId) {
        // Remove like
        const res = await fetch(`/api/chronicles/posts/${post.id}/reactions/${userReactionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (res.ok) {
          setLiked(false);
          setUserReactionId(null);
          setReactionCounts({
            ...reactionCounts,
            'like': Math.max(0, previousCount - 1),
          });
          setEngagementCount(Math.max(0, engagementCount - 1));
        } else {
          console.error('Failed to remove like');
        }
      } else {
        // Add like
        const res = await fetch(`/api/chronicles/posts/${post.id}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            reaction_type: 'like',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setLiked(true);
          if (data.reaction && data.reaction.id) {
            setUserReactionId(data.reaction.id);
          }
          setReactionCounts({
            ...reactionCounts,
            'like': previousCount + 1,
          });
          setEngagementCount(engagementCount + 1);
        } else {
          console.error('Failed to add like');
        }
      }
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    // Show login modal if not authenticated
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // Scroll to comment input
    document.getElementById('comment-input')?.focus();
  };

  const handleShare = async () => {
    if (!post) return;

    setIsSharing(true);
    let sharePlatform = 'native_share';
    
    try {
      // Record share to database
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const recordShareRes = await fetch(`/api/chronicles/posts/${post.id}/shares`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          share_platform: sharePlatform,
        }),
      });

      if (!recordShareRes.ok) {
        console.error('Failed to record share');
      }

      // Use Web Share API if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: post.title,
            text: post.excerpt,
            url: window.location.href,
          });
          // Update share count on successful share
          setSharesCount(sharesCount + 1);
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('Share error:', err);
          }
        }
      } else {
        // Fallback: copy link to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href);
          setSharesCount(sharesCount + 1);
        } catch (err) {
          console.error('Copy error:', err);
        }
      }
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleAddComment = async () => {
    if (!post || !newComment.trim() || !isAuthenticated || !authToken) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/chronicles/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: newComment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments([data.comment || data.data, ...comments]);
        setNewComment('');
        // Update comment count
        if (post) {
          setPost({
            ...post,
            commentsCount: (post.commentsCount || 0) + 1,
          });
        }
      } else {
        const error = await res.json();
        console.error('Failed to add comment:', error);
      }
    } catch (err) {
      console.error('Add comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error || !post) {
    const isAuthError = error?.includes('logged in') || error?.includes('Unauthorized');
    
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className={`flex flex-col gap-4 p-6 rounded-lg border ${
            isAuthError 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30'
          }`}>
            <div className="flex gap-3">
              {isAuthError ? (
                <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isAuthError 
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {error || 'Post not found'}
                </p>
                {isAuthError && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    To view detailed chronicles posts, you need to log in or create a creator account.
                  </p>
                )}
              </div>
            </div>
            {isAuthError && (
              <div className="flex gap-3 mt-2">
                <Link href="/chronicles/login">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login to Chronicles
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Go Back
                </Button>
              </div>
            )}
            {!isAuthError && (
              <Button 
                variant="outline"
                onClick={fetchPost}
                className="self-start mt-2"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black">
      <article className="max-w-3xl mx-auto py-12 px-4">
        {/* Cover Image */}
        {post.coverImageUrl && (
          <div className="mb-8 relative h-96 w-full rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-800">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              className="object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
              priority
            />
          </div>
        )}

        {/* Post Header */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              {post.type === 'poem' ? '📝 Poem' : '📖 Blog Post'}
            </span>
            {post.category && (
              <span className="px-3 py-1 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                {post.category}
              </span>
            )}
          </div>

          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 font-medium">{post.excerpt}</p>
          )}

          {/* Author Info */}
          {post.author && (
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                {post.author.avatar_url ? (
                  <img 
                    src={post.author.avatar_url}
                    alt={post.author.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                ) : (
                  post.author.name?.charAt(0).toUpperCase() || post.author.penName?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <Link href={`/chronicles/portfolio/${post.author.penName}`}>
                  <p className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">
                    {post.author.name}
                  </p>
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400">{post.author.bio}</p>
              </div>
            </div>
          )}

          {/* Post Meta */}
          <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400 mt-6 text-center justify-around border-t border-gray-200 dark:border-slate-800 pt-6">
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{post.viewCount || 0}</p>
              <p>Views</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{engagementCount}</p>
              <p>Likes</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {new Date(post.publishedAt).toLocaleDateString()}
              </p>
              <p>Published</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-purple dark:prose-invert max-w-none mb-8 leading-relaxed text-gray-900 dark:text-white">
          <div className="whitespace-pre-wrap break-words">
            {post.content}
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/chronicles/feed?tag=${tag}`}
                className="px-3 py-1 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="border-t border-b border-gray-200 dark:border-slate-800 py-4 flex gap-3 mb-8">
          <Button
            variant={liked ? 'default' : 'outline'}
            className={liked ? 'bg-red-600 hover:bg-red-700' : ''}
            onClick={handleLike}
            disabled={isLiking}
          >
            {isLiking ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
            )}
            Like ({reactionCounts['like'] || engagementCount})
          </Button>
          <Button variant="outline" onClick={handleComment}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Comment ({post.commentsCount || 0})
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4 mr-2" />
            )}
            Share ({sharesCount})
          </Button>
        </div>

        {/* Comments Section */}
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Comments ({comments.length})</h2>
          
          {/* Comment Input */}
          {isAuthenticated && (
            <div className="mb-8 p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
              <div className="flex gap-3 items-end">
                <textarea
                  id="comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this post..."
                  className="flex-1 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-600 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="outline"
                  onClick={() => setNewComment('')}
                  disabled={!newComment.trim()}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submittingComment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Comment List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
                  <div className="flex gap-3 mb-3">
                    {comment.creator?.profile_image_url ? (
                      <img
                        src={comment.creator.profile_image_url}
                        alt={comment.creator.pen_name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    ) : comment.creator?.avatar_url ? (
                      <img
                        src={comment.creator.avatar_url}
                        alt={comment.creator.pen_name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {comment.creator?.pen_name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {comment.creator?.pen_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at || comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-800">
              <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {isAuthenticated ? 'No comments yet. Be the first to comment!' : 'Log in to see and post comments'}
              </p>
            </div>
          )}
        </div>

        {/* App Banner for Mobile Users */}
        <div className="mt-12">
          <AppBanner postId={post.id} postType="chronicles" />
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 relative">
              {/* Close Button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mx-auto mb-4">
                  <LogIn className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                  Join Chronicles
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-2">
                  Sign in to like, comment, and share posts with the Chronicles community.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-4">
                <Link href="/auth/login" className="block w-full">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login to Chronicles
                  </Button>
                </Link>
                <Link href="/auth/signup" className="block w-full">
                  <Button variant="outline" className="w-full">
                    Create an Account
                  </Button>
                </Link>
              </div>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">or</span>
                </div>
              </div>

              {/* Guest Option */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white py-2"
              >
                Continue without signing in
              </button>
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
