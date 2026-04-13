'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SafeImage } from '@/components/SafeImage';

interface FlaggedContent {
  id: string;
  post_id?: string;
  chain_entry_post_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  created_at: string;
  flagged_by: string;
  resolved_by?: string;
  resolved_at?: string;
  post?: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    creator: {
      id: string;
      pen_name: string;
      profile_image_url?: string;
    };
  };
  chain_entry?: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    chain_id: string;
    creator: {
      id: string;
      pen_name: string;
      profile_image_url?: string;
    };
  };
}

const reasonLabels: Record<string, string> = {
  inappropriate_content: 'Inappropriate Content',
  spam: 'Spam',
  copyright_violation: 'Copyright Infringement',
  misinformation: 'Misinformation',
  hate_speech: 'Hate Speech',
  explicit_content: 'Explicit Content',
  harassment: 'Harassment',
  other: 'Other',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export default function FlaggedContentPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedContent[]>([]);
  const [flaggedChains, setFlaggedChains] = useState<FlaggedContent[]>([]);
  const [flaggedEntries, setFlaggedEntries] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [newStatus, setNewStatus] = useState<string>('');
  const [resolutionReason, setResolutionReason] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [stats, setStats] = useState({
    total_flagged: 0,
    pending: 0,
    under_review: 0,
    resolved: 0,
    dismissed: 0,
  });

  // Fetch flagged content
  const fetchFlaggedContent = async () => {
    try {
      setLoading(true);
      let typeParam = 'posts';
      if (activeTab === 'chains') typeParam = 'chains';
      if (activeTab === 'entries') typeParam = 'entries';
      const statusParam = statusFilter !== 'all' ? statusFilter : 'all';

      const res = await fetch(
        `/api/admin/chronicles/flagged-content?type=${typeParam}&status=${statusParam}`
      );

      if (!res.ok) throw new Error('Failed to fetch flagged content');

      const json = await res.json();

      if (activeTab === 'posts') {
        setFlaggedPosts(json.flagged_posts || []);
      } else if (activeTab === 'chains') {
        setFlaggedChains(json.flagged_chains || []);
      } else {
        setFlaggedEntries(json.flagged_entries || []);
      }

      setStats(json.stats);
    } catch (e) {
      console.error('Error fetching flagged content:', e);
      toast({
        title: 'Error',
        description: 'Failed to load flagged content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedContent();
  }, [activeTab, statusFilter]);

  const handleStatusUpdate = async () => {
    if (!selectedContent || !newStatus) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoadingDetail(true);

      const res = await fetch('/api/admin/chronicles/flagged-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flag_id: selectedContent.id,
          status: newStatus,
          resolution_reason: resolutionReason,
          action_taken: actionTaken,
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast({
        title: 'Success',
        description: `Flag status updated to ${newStatus}`,
      });

      setShowDetailModal(false);
      setNewStatus('');
      setResolutionReason('');
      setActionTaken('');
      await fetchFlaggedContent();
    } catch (e) {
      console.error('Error updating status:', e);
      toast({
        title: 'Error',
        description: 'Failed to update flag status',
        variant: 'destructive',
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const renderContentItem = (content: FlaggedContent) => {
    const itemData = content.post || content.chain_entry;
    const contentId = content.post_id || content.chain_entry_post_id || 'unknown';

    return (
      <div key={content.id} className="p-4 bg-white dark:bg-black rounded-lg shadow border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{itemData?.title || 'Unknown'}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              By {itemData?.creator?.pen_name || 'Unknown'}
            </p>

            <div className="space-y-2 mb-3">
              <p className="text-sm">
                <span className="font-medium">Reason:</span>{' '}
                <span className="text-muted-foreground">{reasonLabels[content.reason] || content.reason}</span>
              </p>
              {content.description && (
                <p className="text-sm">
                  <span className="font-medium">Description:</span>
                  <span className="text-muted-foreground ml-2">{content.description}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Flagged: {new Date(content.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded ${statusColors[content.status]}`}>
                {content.status}
              </span>
              {content.action_taken && (
                <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                  Action: {content.action_taken}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedContent(content);
                setNewStatus(content.status);
                setShowDetailModal(true);
              }}
            >
              <Eye className="w-4 h-4 mr-2" /> Review
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const displayContent = activeTab === 'posts' ? flaggedPosts : (activeTab === 'chains' ? flaggedChains : flaggedEntries);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Flagged Content Management</h1>
        <p className="text-muted-foreground">Review and manage flagged posts and entries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-black rounded-lg shadow border">
          <p className="text-sm text-muted-foreground">Total Flagged</p>
          <p className="text-2xl font-bold">{stats.total_flagged}</p>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg shadow border">
          <p className="text-sm text-yellow-800">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg shadow border">
          <p className="text-sm text-blue-800">Under Review</p>
          <p className="text-2xl font-bold text-blue-800">{stats.under_review}</p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg shadow border">
          <p className="text-sm text-green-800">Resolved</p>
          <p className="text-2xl font-bold text-green-800">{stats.resolved}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-lg shadow border">
          <p className="text-sm text-gray-800">Dismissed</p>
          <p className="text-2xl font-bold text-gray-800">{stats.dismissed}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Flagged Posts ({flaggedPosts.length})</TabsTrigger>
          <TabsTrigger value="chains">Flagged Chains ({flaggedChains.length})</TabsTrigger>
          <TabsTrigger value="entries">Flagged Entries ({flaggedEntries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : displayContent.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No flagged posts</p>
          ) : (
            <div className="space-y-3">{displayContent.map(renderContentItem)}</div>
          )}
        </TabsContent>

        <TabsContent value="chains" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : displayContent.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No flagged chains</p>
          ) : (
            <div className="space-y-3">{displayContent.map(renderContentItem)}</div>
          )}
        </TabsContent>

        <TabsContent value="entries" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : displayContent.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No flagged entries</p>
          ) : (
            <div className="space-y-3">{displayContent.map(renderContentItem)}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Flagged Content</DialogTitle>
          </DialogHeader>

          {selectedContent && (
            <div className="space-y-4">
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedContent.post?.title || selectedContent.chain_entry?.title}</p>
                <p className="text-sm text-muted-foreground">
                  By {selectedContent.post?.creator?.pen_name || selectedContent.chain_entry?.creator?.pen_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Reason:</span> {reasonLabels[selectedContent.reason]}
                </p>
                {selectedContent.description && (
                  <p className="text-sm">
                    <span className="font-medium">Description:</span> {selectedContent.description}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Update Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {['resolved', 'dismissed'].includes(newStatus) && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Resolution Reason</label>
                      <select
                        value={resolutionReason}
                        onChange={(e) => setResolutionReason(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="">Select reason...</option>
                        <option value="false_positive">False Positive</option>
                        <option value="content_removed">Content Removed</option>
                        <option value="creator_warned">Creator Warned</option>
                        <option value="creator_suspended">Creator Suspended</option>
                        <option value="requires_more_review">Requires More Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Action Taken</label>
                      <textarea
                        value={actionTaken}
                        onChange={(e) => setActionTaken(e.target.value)}
                        placeholder="Describe the action taken..."
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm min-h-20"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDetailModal(false)}
                  disabled={loadingDetail}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleStatusUpdate}
                  disabled={loadingDetail || !newStatus}
                >
                  {loadingDetail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Update Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
