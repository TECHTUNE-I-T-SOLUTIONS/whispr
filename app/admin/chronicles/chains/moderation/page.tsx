'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Eye, Flag, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SafeImage } from '@/components/SafeImage';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  status: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  published_at: string;
  creator: { id: string; pen_name: string; profile_image_url?: string };
  is_flagged?: boolean;
  flag_reason?: string;
}

interface Chain {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  creator: { id: string; pen_name: string; profile_image_url?: string };
  entries_count?: number;
  updated_at?: string;
}

interface ChainEntry {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  status: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  sequence: number;
  published_at: string;
  chain: { id: string; title: string };
  creator: { id: string; pen_name: string; profile_image_url?: string };
  is_flagged?: boolean;
  flag_reason?: string;
}

export default function ChainModerationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [entries, setEntries] = useState<ChainEntry[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingChains, setLoadingChains] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<Post | Chain | ChainEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagItemId, setFlagItemId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagDescription, setFlagDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'post' | 'chain' | 'entry' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [flaggedPostIds, setFlaggedPostIds] = useState<Set<string>>(new Set());

  // Map user-friendly reasons to API codes
  const flagReasons = [
    { label: 'Inappropriate Content', value: 'inappropriate_content' },
    { label: 'Spam', value: 'spam' },
    { label: 'Copyright Infringement', value: 'copyright_violation' },
    { label: 'Misinformation', value: 'misinformation' },
    { label: 'Hate Speech', value: 'hate_speech' },
    { label: 'Explicit Content', value: 'explicit_content' },
    { label: 'Harassment', value: 'harassment' },
    { label: 'Other', value: 'other' }
  ];

  // Load all data on mount
  useEffect(() => {
    fetchPosts();
    fetchChains();
    fetchEntries();
    fetchFlaggedPosts();
  }, []);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/chronicles/admin/posts?limit=100');
      if (!res.ok) throw new Error('Failed to load posts');
      const json = await res.json();
      setPosts(json.data || []);
      setError('');
    } catch (e) {
      console.error('Posts error:', e);
      setError('Unable to load posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchChains = async () => {
    setLoadingChains(true);
    try {
      const res = await fetch('/api/chronicles/admin/moderation-chains?limit=100');
      if (!res.ok) throw new Error('Failed to load chains');
      const json = await res.json();
      setChains(json.data || []);
      setError('');
    } catch (e) {
      console.error('Chains error:', e);
      setError('Unable to load chains');
    } finally {
      setLoadingChains(false);
    }
  };

  const fetchEntries = async () => {
    setLoadingEntries(true);
    try {
      const res = await fetch('/api/chronicles/admin/chains/entries?limit=100');
      if (!res.ok) throw new Error('Failed to load entries');
      const json = await res.json();
      setEntries(json.data || []);
      setError('');
    } catch (e) {
      console.error('Entries error:', e);
      setError('Unable to load entries');
    } finally {
      setLoadingEntries(false);
    }
  };

  const fetchFlaggedPosts = async () => {
    try {
      const res = await fetch('/api/admin/chronicles/flag-post');
      const json = await res.json();
      
      if (json.flagged_posts && Array.isArray(json.flagged_posts)) {
        const flaggedIds = new Set(
          json.flagged_posts
            .map((p: any) => p.post_id || p.chain_entry_post_id)
            .filter(Boolean)
        );
        setFlaggedPostIds(flaggedIds);
        console.log('[MODERATION] Flagged posts loaded:', flaggedIds.size);
      } else {
        console.warn('[MODERATION] No flagged posts data:', json);
        setFlaggedPostIds(new Set());
      }
    } catch (e) {
      console.error('[MODERATION] Error fetching flagged posts:', e);
      // Don't fail - just show no flagged posts
      setFlaggedPostIds(new Set());
    }
  };

  const confirmDelete = (id: string, type: 'post' | 'chain' | 'entry') => {
    setDeleteTarget({ id, type });
    setShowDeleteConfirm(true);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    setIsDeleting(true);

    try {
      let endpoint = '';
      if (type === 'post') endpoint = `/api/chronicles/admin/posts/${id}`;
      else if (type === 'chain') endpoint = `/api/chronicles/admin/moderation-chains/${id}`;
      else endpoint = `/api/chronicles/admin/chains/entries/${id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        if (type === 'post') setPosts(posts.filter((p) => p.id !== id));
        else if (type === 'chain') setChains(chains.filter((c) => c.id !== id));
        else setEntries(entries.filter((e) => e.id !== id));
        setShowDetailModal(false);
        toast({
          title: 'Success',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: `Failed to delete ${type}`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const openFlagModal = (id: string) => {
    setFlagItemId(id);
    setFlagReason('');
    setFlagDescription('');
    setShowFlagModal(true);
  };

  const submitFlag = async () => {
    if (!flagItemId || !flagReason) {
      toast({
        title: 'Missing Information',
        description: 'Please select a reason for flagging',
        variant: 'destructive',
      });
      return;
    }

    setIsFlagging(true);
    try {
      let endpoint = '';
      let body: any = { reason: flagReason, description: flagDescription };

      if (activeTab === 'posts') {
        endpoint = '/api/admin/chronicles/flag-post';
        body.post_id = flagItemId;
      } else if (activeTab === 'chains') {
        endpoint = '/api/admin/chronicles/flag-post';
        body.chain_id = flagItemId;
      } else if (activeTab === 'entries') {
        endpoint = '/api/admin/chronicles/flag-post';
        body.chain_entry_post_id = flagItemId;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      console.log('[FLAG] Response status:', res.status);

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Content flagged for review successfully',
        });
        setShowFlagModal(false);
        setShowDetailModal(false);
        // Add to flagged set
        const newFlagged = new Set(flaggedPostIds);
        newFlagged.add(flagItemId);
        setFlaggedPostIds(newFlagged);
        // Refresh the list
        if (activeTab === 'posts') fetchPosts();
        else if (activeTab === 'chains') fetchChains();
        else if (activeTab === 'entries') fetchEntries();
      } else {
        const errorData = await res.json();
        toast({
          title: 'Error',
          description: `Failed to flag: ${errorData.error || 'Unknown error'}`,
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error('Flag error:', e);
      toast({
        title: 'Error',
        description: 'Failed to flag content',
        variant: 'destructive',
      });
    } finally {
      setIsFlagging(false);
    }
  };

  const handleStatusChange = async (id: string, status: string, type: 'post' | 'chain' | 'entry') => {
    // Chains don't have status, only posts and entries do
    if (type === 'chain') return;

    try {
      let endpoint = '';
      if (type === 'post') endpoint = '/api/chronicles/admin/posts';
      else if (type === 'entry') endpoint = '/api/chronicles/admin/chains/entries';

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        if (type === 'post') {
          const updated = posts.map((p) => (p.id === id ? { ...p, status } : p));
          setPosts(updated);
          if (selectedItem?.id === id) setSelectedItem({ ...selectedItem, status });
        } else if (type === 'entry') {
          const updated = entries.map((e) => (e.id === id ? { ...e, status } : e));
          setEntries(updated);
          if (selectedItem?.id === id) setSelectedItem({ ...selectedItem, status });
        }
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const renderPostItem = (post: Post) => (
    <div key={post.id} className="p-4 bg-white dark:bg-black rounded-lg shadow">
      <div className="flex items-start gap-4">
        {post.cover_image_url && (
          <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 relative">
            <SafeImage src={post.cover_image_url} alt={post.title} width={80} height={80} className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold truncate">{post.title}</h3>
              <p className="text-sm text-muted-foreground">By {post.creator.pen_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(post.published_at).toLocaleDateString()} • {post.views_count} views • {post.likes_count} likes
              </p>
            </div>
            <div className="flex gap-2 flex-col">
              {flaggedPostIds.has(post.id) && (
                <span className="text-xs px-2 py-1 rounded whitespace-nowrap bg-red-100 text-red-800 flex items-center gap-1">
                  <Flag className="w-3 h-3" /> Flagged
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                post.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                'bg-green-100 text-green-800'
              }`}>
                {post.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => { setSelectedItem(post); setShowDetailModal(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </Button>
            <Button size="sm" variant="outline" className="text-blue-600" disabled={flaggedPostIds.has(post.id)} onClick={() => openFlagModal(post.id)}>
              <Flag className="w-4 h-4 mr-2" /> Flag
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChainItem = (chain: Chain) => (
    <div key={chain.id} className="p-4 bg-white dark:bg-black rounded-lg shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{chain.title}</h3>
          <p className="text-sm text-muted-foreground">By {chain.creator.pen_name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(chain.created_at).toLocaleDateString()} • {chain.entries_count || 0} entries
          </p>
          {chain.description && (
            <p className="text-sm mt-2 line-clamp-2">{chain.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="outline" onClick={() => { setSelectedItem(chain); setShowDetailModal(true); }}>
          <Eye className="w-4 h-4 mr-2" /> View Details
        </Button>
        <Button size="sm" variant="outline" className="text-blue-600" disabled={flaggedPostIds.has(chain.id)} onClick={() => openFlagModal(chain.id)}>
          <Flag className="w-4 h-4 mr-2" /> Flag
        </Button>
      </div>
    </div>
  );

  const renderEntryItem = (entry: ChainEntry) => (
    <div key={entry.id} className="p-4 bg-white dark:bg-black rounded-lg shadow">
      <div className="flex items-start gap-4">
        {entry.cover_image_url && (
          <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 relative">
            <SafeImage src={entry.cover_image_url} alt={entry.title} width={80} height={80} className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Chain: {entry.chain?.title || 'Unknown Chain'}</p>
              <h3 className="font-semibold truncate">{entry.title}</h3>
              <p className="text-sm text-muted-foreground">By {entry.creator?.pen_name || 'Unknown Author'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(entry.published_at).toLocaleDateString()} • {entry.views_count} views • {entry.likes_count} likes
              </p>
            </div>
            <div className="flex gap-2 flex-col">
              {flaggedPostIds.has(entry.id) && (
                <span className="text-xs px-2 py-1 rounded whitespace-nowrap bg-red-100 text-red-800 flex items-center gap-1">
                  <Flag className="w-3 h-3" /> Flagged
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                entry.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                entry.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                'bg-green-100 text-green-800'
              }`}>
                {entry.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => { setSelectedItem(entry); setShowDetailModal(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </Button>
            <Button size="sm" variant="outline" className="text-blue-600" disabled={flaggedPostIds.has(entry.id)} onClick={() => openFlagModal(entry.id)}>
              <Flag className="w-4 h-4 mr-2" /> Flag
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Chronicles Moderation</h1>
        <p className="text-muted-foreground">Review and manage posts, chains, and entries</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="chains">Chains ({chains.length})</TabsTrigger>
          <TabsTrigger value="entries">Entries ({entries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {loadingPosts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No posts to moderate</p>
          ) : (
            <div className="space-y-3">{posts.map(renderPostItem)}</div>
          )}
        </TabsContent>

        <TabsContent value="chains" className="mt-6">
          {loadingChains ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : chains.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No chains to moderate</p>
          ) : (
            <div className="space-y-3">{chains.map(renderChainItem)}</div>
          )}
        </TabsContent>

        <TabsContent value="entries" className="mt-6">
          {loadingEntries ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No entries to moderate</p>
          ) : (
            <div className="space-y-3">{entries.map(renderEntryItem)}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              {activeTab === 'posts' && `By ${(selectedItem as Post)?.creator?.pen_name || 'Unknown'}`}
              {activeTab === 'chains' && `By ${(selectedItem as Chain)?.creator?.pen_name || 'Unknown'}`}
              {activeTab === 'entries' && `In chain: ${(selectedItem as ChainEntry)?.chain?.title || 'Unknown Chain'}`}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {(selectedItem as Post).cover_image_url && (
                <div className="w-full h-64 rounded overflow-hidden relative">
                  <SafeImage 
                    src={(selectedItem as Post).cover_image_url} 
                    alt={selectedItem.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}

              {activeTab !== 'chains' && (
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <select
                    value={selectedItem.status}
                    onChange={(e) => handleStatusChange(selectedItem.id, e.target.value, activeTab as any)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Content</h3>
                <div className="prose dark:prose-invert max-w-none max-h-64 overflow-y-auto">
                  <p>{(selectedItem as any).content || (selectedItem as any).description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(
                      activeTab === 'chains' 
                        ? (selectedItem as Chain).created_at 
                        : (selectedItem as Post | ChainEntry).published_at || (selectedItem as Post | ChainEntry).created_at
                    ).toLocaleString()}
                  </p>
                </div>
                {activeTab === 'chains' && (
                  <div>
                    <p className="text-muted-foreground">Entries</p>
                    <p className="font-medium">{(selectedItem as Chain).entries_count || 0}</p>
                  </div>
                )}
                {activeTab !== 'chains' && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-medium">{(selectedItem as Post | ChainEntry).views_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Likes</p>
                      <p className="font-medium">{(selectedItem as Post | ChainEntry).likes_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comments</p>
                      <p className="font-medium">{(selectedItem as Post | ChainEntry).comments_count || 0}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button className="flex-1 text-blue-600" variant="outline" onClick={() => openFlagModal(selectedItem.id)}>
                  <Flag className="w-4 h-4 mr-2" /> Flag for Review
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => confirmDelete(selectedItem.id, activeTab as any)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={performDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flag Modal */}
      <Dialog open={showFlagModal} onOpenChange={setShowFlagModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Flag Content for Review</DialogTitle>
            <DialogDescription>Select a reason and add details about why this content should be reviewed</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason</label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-black"
              >
                <option value="">Select a reason...</option>
                {flagReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Additional Details (Optional)</label>
              <textarea
                value={flagDescription}
                onChange={(e) => setFlagDescription(e.target.value)}
                placeholder="Provide more context about why this content is problematic..."
                className="w-full px-3 py-2 border rounded-md min-h-24 text-sm bg-white dark:bg-black"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowFlagModal(false)}
                disabled={isFlagging}
              >
                Cancel
              </Button>
              <Button
                onClick={submitFlag}
                disabled={isFlagging || !flagReason}
                className="bg-red-600 hover:bg-red-700"
              >
                {isFlagging ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Flagging...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-2" />
                    Flag Content
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
