'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, X, Heart, MessageCircle, Share2, Eye, Flag } from 'lucide-react';
import Link from 'next/link';

// Modal dialog component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white dark:bg-gray-900 border-b flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

// Flag Post Modal component
function FlagPostModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  flagData,
  setFlagData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  flagData: { reason: string; description: string };
  setFlagData: (data: { reason: string; description: string }) => void;
}) {
  if (!isOpen) return null;

  const flagReasons = [
    'Inappropriate Content',
    'Spam',
    'Plagiarism',
    'Copyright Violation',
    'Offensive Language',
    'Harassment',
    'Misinformation',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-600" />
            Flag Post for Review
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reason Selection */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Reason for Flagging
            </label>
            <select
              value={flagData.reason}
              onChange={(e) =>
                setFlagData({ ...flagData, reason: e.target.value })
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a reason...</option>
              {flagReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Additional Details (Optional)
            </label>
            <textarea
              value={flagData.description}
              onChange={(e) =>
                setFlagData({ ...flagData, description: e.target.value })
              }
              disabled={isLoading}
              placeholder="Provide more context for this flag..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
            />
          </div>

          {/* "This will change the post status to draft" message */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Flagging this post will change its status to
              draft immediately.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={onSubmit}
              disabled={!flagData.reason || isLoading}
            >
              {isLoading ? 'Flagging...' : 'Flag Post'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface Chain {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    pen_name: string;
    profile_image_url?: string;
    bio?: string;
  };
  stats?: {
    totalEntries: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    uniqueContributors: number;
  };
  topContributors?: Array<{
    id: string;
    pen_name: string;
    profile_image_url?: string;
    postCount: number;
  }>;
}

interface ChainEntry {
  id: string;
  chain_id: string;
  creator_id: string;
  title: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  status: string;
  sequence: number;
  added_by?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    pen_name: string;
    profile_image_url?: string;
  };
  added_by_creator?: {
    id: string;
    pen_name: string;
    profile_image_url?: string;
  };
  comments?: any[];
  reactions?: any[];
  engagement?: {
    totalComments: number;
    totalReactions: number;
    likes: number;
  };
}

export default function ChainDetailPage() {
  const router = useRouter();
  const params = useParams();
  const chainId = params?.id as string;

  const [chain, setChain] = useState<Chain | null>(null);
  const [entries, setEntries] = useState<ChainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [selectedEntry, setSelectedEntry] = useState<ChainEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Flag modal state
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagData, setFlagData] = useState({ reason: '', description: '' });
  const [isFlagging, setIsFlagging] = useState(false);

  useEffect(() => {
    if (chainId) {
      fetchChainDetails();
      fetchChainEntries();
    }
  }, [chainId]);

  const fetchChainDetails = async () => {
    try {
      console.log("Fetching chain details for:", chainId);
      const response = await fetch(`/api/admin/chronicles/chains/${chainId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chain');
      }
      const data = await response.json();
      console.log("Chain details response:", data);
      setChain(data.chain);
    } catch (err) {
      console.error("Error fetching chain:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchChainEntries = async () => {
    try {
      console.log("Fetching chain entries for:", chainId);
      const response = await fetch(`/api/admin/chronicles/chains/${chainId}/entries`);
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }
      const data = await response.json();
      console.log("Entries response:", data);
      console.log("Number of entries:", data.entries?.length || 0);
      if (data.entries && data.entries.length > 0) {
        console.log("First entry:", data.entries[0]);
      }
      setEntries(data.entries || []);
    } catch (err) {
      console.error("Error fetching entries:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openEntryModal = (entry: ChainEntry) => {
    console.log("Opening modal for entry:", entry.id);
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const closeEntryModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const handleFlagPost = async () => {
    if (!selectedEntry || !flagData.reason) {
      alert('Please select a reason for flagging');
      return;
    }

    setIsFlagging(true);
    try {
      const response = await fetch('/api/admin/chronicles/flag-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: selectedEntry.id,
          chain_entry_post_id: selectedEntry.id,
          reason: flagData.reason,
          description: flagData.description,
          status: 'pending',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to flag post');
      }

      alert('Post flagged successfully for review');
      setIsFlagModalOpen(false);
      setFlagData({ reason: '', description: '' });
      closeEntryModal();
      // Refresh entries
      fetchChainEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to flag post');
    } finally {
      setIsFlagging(false);
    }
  };

  const handleDeleteComment = async (entry: ChainEntry, commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      console.log("Deleting comment:", commentId);
      // For future implementation - delete comment from API
      // After deletion, update the entry
      alert('Comment deletion feature coming soon. For now, manage comments from the chronicals/comments admin page.');
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleDeleteReaction = async (entry: ChainEntry, reactionId: string) => {
    if (!confirm('Are you sure you want to remove this like?')) return;
    
    try {
      console.log("Deleting reaction:", reactionId);
      // For future implementation - delete reaction from API
      alert('Reaction deletion feature coming soon.');
    } catch (err) {
      console.error("Error deleting reaction:", err);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    
    try {
      const response = await fetch(`/api/admin/chronicles/chains/${chainId}/entries/${entryId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setEntries(entries.filter(e => e.id !== entryId));
      } else {
        setError('Failed to delete entry');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading chain details...</p>
      </main>
    );
  }

  if (!chain) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/admin/chronicles/chains">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chains
          </Link>
        </Button>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6 text-red-700 dark:text-red-300">
            Chain not found or an error occurred.
            {error && <p className="mt-2">{error}</p>}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/admin/chronicles/chains">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chains
        </Link>
      </Button>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 mb-6">
          <CardContent className="p-4 text-red-700 dark:text-red-300">
            {error}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{chain.title}</CardTitle>
              {chain.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {chain.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setIsFlagModalOpen(true)}
              >
                <Flag className="w-4 h-4 mr-2" />
                Flag Chain
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href={`/admin/chronicles/chains/${chainId}/edit`}>
                  Edit Chain
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Created By</p>
              <p className="font-semibold">@{chain.creator?.pen_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Created Date</p>
              <p className="font-semibold">
                {new Date(chain.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {(chain as any).stats && (
            <div className="border-t pt-4 grid grid-cols-5 gap-3 text-sm">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Entries</p>
                <p className="text-xl font-bold text-blue-600">{(chain as any).stats.totalEntries}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Likes</p>
                <p className="text-xl font-bold text-red-600">{(chain as any).stats.totalLikes}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Comments</p>
                <p className="text-xl font-bold text-green-600">{(chain as any).stats.totalComments}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Views</p>
                <p className="text-xl font-bold text-purple-600">{(chain as any).stats.totalViews}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Contributors</p>
                <p className="text-xl font-bold text-indigo-600">{(chain as any).stats.uniqueContributors}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Chain Entries ({entries.length})
        </h2>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No entries in this chain yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <Card 
              key={entry.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openEntryModal(entry)}
            >
              <CardContent className="p-0">
                <div className="flex gap-4">
                  {/* Image Section */}
                  {entry.cover_image_url && (
                    <div className="w-48 h-40 flex-shrink-0 relative overflow-hidden">
                      <img
                        src={entry.cover_image_url}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Content Section */}
                  <div className="flex-grow p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0 font-semibold text-sm text-indigo-600">
                          {entry.sequence}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                              {entry.title}
                            </h3>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {entry.status}
                            </span>
                          </div>
                          {entry.excerpt && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {entry.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Metadata and Stats */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 border-t pt-3">
                      <span className="flex items-center gap-1">👤 <span className="font-medium">@{entry.creator?.pen_name || 'Unknown'}</span></span>
                      {entry.added_by_creator && entry.added_by_creator.pen_name !== entry.creator?.pen_name && (
                        <span className="flex items-center gap-1">➕ <span className="font-medium">@{entry.added_by_creator.pen_name}</span></span>
                      )}
                      <span className="flex items-center gap-1">📅 {new Date(entry.published_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">👁️ {entry.views_count || 0}</span>
                      <span className="flex items-center gap-1">❤️ {entry.likes_count || 0}</span>
                      <span className="flex items-center gap-1">💬 {entry.comments_count || 0}</span>
                      <span className="flex items-center gap-1">🔗 {entry.shares_count || 0}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="pr-4 pt-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Entry Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeEntryModal}
        title={selectedEntry?.title || 'Entry Details'}
      >
        {selectedEntry && (
          <div className="space-y-6">
            {/* Cover Image */}
            {selectedEntry.cover_image_url && (
              <div className="w-full h-96 rounded-lg overflow-hidden">
                <img
                  src={selectedEntry.cover_image_url}
                  alt={selectedEntry.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Title and Status */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{selectedEntry.title}</h2>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {selectedEntry.status}
                </span>
              </div>
              {selectedEntry.excerpt && (
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {selectedEntry.excerpt}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Author</p>
                <p className="font-semibold">@{selectedEntry.creator?.pen_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Published Date</p>
                <p className="font-semibold">{new Date(selectedEntry.published_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Added by</p>
                <p className="font-semibold">{selectedEntry.added_by_creator?.pen_name || selectedEntry.creator?.pen_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Sequence</p>
                <p className="font-semibold">#{selectedEntry.sequence}</p>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="grid grid-cols-4 gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-full bg-red-100 dark:bg-red-900/30">
                  <Heart className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-xl font-bold text-red-600">{selectedEntry.likes_count || 0}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Likes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-full bg-green-100 dark:bg-green-900/30">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-xl font-bold text-green-600">{selectedEntry.comments_count || 0}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Comments</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Share2 className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xl font-bold text-blue-600">{selectedEntry.shares_count || 0}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Shares</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Eye className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xl font-bold text-purple-600">{selectedEntry.views_count || 0}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Views</p>
              </div>
            </div>

            {/* Full Content */}
            {selectedEntry.content && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Full Content</h3>
                <div className="prose dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
                  {selectedEntry.content}
                </div>
              </div>
            )}

            {/* Comments Section */}
            {selectedEntry.comments && selectedEntry.comments.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Comments ({selectedEntry.comments.length})</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedEntry.comments.map((comment: any) => (
                    <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">@{comment.creator?.pen_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDeleteComment(selectedEntry, comment.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span>❤️ {comment.likes_count || 0}</span>
                        <span>💬 {comment.replies_count || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reactions/Likes Section */}
            {selectedEntry.reactions && selectedEntry.reactions.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Users Who Liked ({selectedEntry.reactions.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedEntry.reactions.map((reaction: any) => (
                    <div key={reaction.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                      <div className="flex items-center gap-2">
                        {reaction.creator?.profile_image_url && (
                          <img
                            src={reaction.creator.profile_image_url}
                            alt={reaction.creator.pen_name}
                            className="w-6 h-6 rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-sm font-medium">@{reaction.creator?.pen_name || 'Unknown'}</span>
                        <span className="text-xs text-gray-500">{reaction.reaction_type}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDeleteReaction(selectedEntry, reaction.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t pt-6 flex gap-3">
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => setIsFlagModalOpen(true)}
              >
                <Flag className="w-4 h-4 mr-2" />
                Flag for Review
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => {
                  handleDeleteEntry(selectedEntry.id);
                  closeEntryModal();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Entry
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={closeEntryModal}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Flag Post Modal */}
      <FlagPostModal
        isOpen={isFlagModalOpen}
        onClose={() => {
          setIsFlagModalOpen(false);
          setFlagData({ reason: '', description: '' });
        }}
        onSubmit={handleFlagPost}
        isLoading={isFlagging}
        flagData={flagData}
        setFlagData={setFlagData}
      />
    </main>
  );
}
