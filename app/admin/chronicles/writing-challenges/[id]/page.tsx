'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Edit, Eye, Calendar, Clock, Users, BookOpen, PenTool, Flame,
  CheckCircle, XCircle, AlertCircle, TrendingUp, Trophy, Zap, Check, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface WritingPrompt {
  id: string;
  title: string;
  description: string;
  content: string;
  prompt_type: 'blog' | 'poem' | 'story';
  challenge_type: 'daily' | 'weekly' | 'monthly';
  status: 'draft' | 'active' | 'ended' | 'archived';
  starts_at: string;
  ends_at?: string;
  submission_deadline: string;
  entries_count: number;
  max_entries_per_user: number;
  is_ai_generated: boolean;
  ai_generation_model?: string;
  created_at: string;
  evaluation_criteria: Record<string, number>;
  tags: string[];
  prize_description?: string;
}

interface PromptEntry {
  id: string;
  prompt_id: string;
  creator_id: string;
  pen_name: string;
  profile_image_url?: string;
  display_name?: string;
  post_type: string;
  post_id: string;
  entry_type?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'flagged';
  submitted_at: string;
  is_ai_generated: boolean;
  ai_confidence_score?: number;
  creator?: {
    id: string;
    pen_name: string;
    display_name: string;
    profile_image_url?: string;
    avatar_url?: string;
    bio?: string;
  };
  post?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    post_type: string;
    category: string;
    tags: string[];
    status: string;
    published_at: string;
    cover_image_url?: string;
  };
}

export default function ChallengeDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  const [entries, setEntries] = useState<PromptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<any[]>([]);
  const [isRanking, setIsRanking] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [promptVersions, setPromptVersions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promptRes, entriesRes, versionsRes] = await Promise.all([
        fetch(`/api/admin/chronicles/writing-prompts/${params.id}`),
        fetch(`/api/admin/chronicles/writing-prompts/${params.id}/entries`), // Remove status filter
        fetch(`/api/admin/chronicles/writing-prompts/${params.id}/versions`),
      ]);

      if (!promptRes.ok) throw new Error('Failed to fetch prompt');
      if (!entriesRes.ok) throw new Error('Failed to fetch entries');

      const promptData = await promptRes.json();
      const entriesData = await entriesRes.json();
      const versionsData = versionsRes.ok ? await versionsRes.json() : { versions: [] };

      setPrompt(promptData.prompt || null);
      setEntries(entriesData.entries || []);
      setPromptVersions(versionsData.versions || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRank = async () => {
    setIsRanking(true);
    try {
      const res = await fetch(`/api/admin/chronicles/writing-prompts/${params.id}/rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_ai_check: true,
          rank_approved_only: false,
        }),
      });

      if (!res.ok) throw new Error('Failed to rank entries');

      const data = await res.json();
      setRanking(data.ranked_entries || []);
      setShowRanking(true);
      
      toast({
        title: 'Ranking completed',
        description: `${data.ranked_count} entries have been ranked.`,
      });
    } catch (error) {
      console.error('Error ranking entries:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to rank entries',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsRanking(false);
    }
  };

  const handleSaveRanking = async () => {
    setIsSaving(true);
    try {
      // Auto-approve entries that are not already approved
      const entriesToApprove = ranking.filter(e => e.status !== 'approved');
      
      for (const entry of entriesToApprove) {
        const res = await fetch(`/api/admin/chronicles/writing-prompts/${params.id}/entries/${entry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'approved',
            review_notes: 'Auto-approved via ranking algorithm'
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to approve entry');
        }
      }

      // Save top 3 to chronicles_challenge_winners
      const top3 = ranking.slice(0, 3);
      
      for (const entry of top3) {
        const res = await fetch('/api/admin/chronicles/writing-prompts/winners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt_id: params.id,
            entry_id: entry.id,
            creator_id: entry.creator_id,
            rank: entry.rank,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to save winner');
        }
      }

      toast({
        title: 'Ranking saved successfully',
        description: `${entriesToApprove.length} entries auto-approved. Top 3 winners selected.`,
      });
      
      setShowRanking(false);
      loadData(); // Reload to show updated statuses
    } catch (error) {
      console.error('Error saving ranking:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save ranking',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveEntry = async (entryId: string) => {
    try {
      const res = await fetch(`/api/admin/chronicles/writing-prompts/${params.id}/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'approved',
          review_notes: 'Manually approved by admin'
        }),
      });

      if (!res.ok) throw new Error('Failed to approve entry');
      
      toast({
        title: 'Entry approved',
        description: 'The entry has been approved successfully.',
      });
      
      loadData(); // Reload to show updated status
    } catch (error) {
      console.error('Error approving entry:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to approve entry',
        description: 'An error occurred while approving the entry.',
      });
    }
  };

  const handleRejectEntry = async (entryId: string) => {
    try {
      const res = await fetch(`/api/admin/chronicles/writing-prompts/${params.id}/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'rejected',
          review_notes: 'Manually rejected by admin'
        }),
      });

      if (!res.ok) throw new Error('Failed to reject entry');
      
      toast({
        title: 'Entry rejected',
        description: 'The entry has been rejected.',
      });
      
      loadData(); // Reload to show updated status
    } catch (error) {
      console.error('Error rejecting entry:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to reject entry',
        description: 'An error occurred while rejecting the entry.',
      });
    }
  };

  const getPromptTypeIcon = (type: string) => {
    switch (type) {
      case 'blog': return <BookOpen className="w-5 h-5" />;
      case 'poem': return <PenTool className="w-5 h-5" />;
      case 'story': return <Flame className="w-5 h-5" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'ended': return 'bg-gray-500';
      case 'archived': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEntryStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'under_review': return 'bg-yellow-500';
      case 'flagged': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getEntryStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'under_review': return <AlertCircle className="w-4 h-4" />;
      case 'flagged': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Challenge not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/chronicles/writing-challenges">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{prompt.title}</h1>
            <p className="text-muted-foreground mt-1">
              {prompt.description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/chronicles/writing-challenges/${prompt.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge className={getStatusColor(prompt.status)}>
              {prompt.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{prompt.status}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
            {getPromptTypeIcon(prompt.prompt_type)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{prompt.prompt_type}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Challenge Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Challenge Type</p>
              <p className="font-medium capitalize">{prompt.challenge_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Entries Per User</p>
              <p className="font-medium">{prompt.max_entries_per_user}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{new Date(prompt.starts_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{prompt.ends_at ? new Date(prompt.ends_at).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submission Deadline</p>
              <p className="font-medium">{new Date(prompt.submission_deadline).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Generated</p>
              <p className="font-medium">{prompt.is_ai_generated ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {prompt.tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {prompt.prize_description && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                🏆 Prize: {prompt.prize_description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{prompt.content}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entries ({entries.length})</CardTitle>
          <CardDescription>
            View and manage submissions for this challenge
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No entries yet</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Creator Avatar */}
                      <div className="flex-shrink-0">
                        {entry.creator?.profile_image_url || entry.creator?.avatar_url ? (
                          <img
                            src={entry.creator?.profile_image_url || entry.creator?.avatar_url}
                            alt={entry.creator?.pen_name || 'Unknown'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {entry.creator?.pen_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Entry Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {entry.creator?.display_name || entry.creator?.pen_name || 'Unknown Creator'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {entry.creator?.bio || 'Chronicles Creator'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {entry.rank && (
                              <Badge className={`${
                                entry.rank === 1 ? 'bg-yellow-500' :
                                entry.rank === 2 ? 'bg-gray-400' :
                                entry.rank === 3 ? 'bg-orange-500' :
                                'bg-blue-500'
                              }`}>
                                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '#' + entry.rank}
                              </Badge>
                            )}
                            <Badge className={getEntryStatusColor(entry.status)}>
                              {getEntryStatusIcon(entry.status)}
                              <span className="ml-1 capitalize">{entry.status.replace('_', ' ')}</span>
                            </Badge>
                            {entry.is_ai_generated && (
                              <Badge variant="outline" className="text-orange-500">
                                AI Flagged
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Post Preview */}
                        {entry.post && (
                          <div className="mb-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                {entry.post.post_type}
                              </span>
                              <span className="text-xs text-gray-500">
                                • {new Date(entry.post.published_at).toLocaleDateString()}
                              </span>
                            </div>
                            <Link href={`/chronicles/${entry.post.slug}`} target="_blank" rel="noopener noreferrer">
                              <h5 className="font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors mb-1">
                                {entry.post.title}
                              </h5>
                            </Link>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {entry.post.excerpt}
                            </p>
                            {entry.post.tags && entry.post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.post.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-slate-800 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Submitted: {new Date(entry.submitted_at).toLocaleString()}</span>
                          {entry.ai_confidence_score && (
                            <span>AI Score: {entry.ai_confidence_score}%</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {entry.post && (
                          <Link href={`/chronicles/${entry.post.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View Post
                            </Button>
                          </Link>
                        )}
                        <Link href={`/admin/chronicles/writing-challenges/${params.id}/entries/${entry.id}`}>
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </Link>
                        {entry.status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleApproveEntry(entry.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        )}
                        {entry.status !== 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRejectEntry(entry.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Ranking Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Auto-Rank Entries
          </CardTitle>
          <CardDescription>
            Automatically rank entries based on engagement metrics and AI content quality checks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleAutoRank} disabled={isRanking || entries.length === 0}>
              {isRanking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ranking...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Auto-Rank All Entries
                </>
              )}
            </Button>
            {showRanking && (
              <>
                <Button onClick={handleSaveRanking} variant="outline" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Ranking
                    </>
                  )}
                </Button>
                <Button onClick={() => setShowRanking(false)} variant="ghost" disabled={isSaving}>
                  Cancel
                </Button>
              </>
            )}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold mb-2">Ranking Rules:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Algorithm weights: Likes (30%), Comments (25%), Shares (25%), Views (20%)</li>
              <li>• AI check for pending entries to detect AI-generated content</li>
              <li>• Only approved entries are considered for final ranking</li>
              <li>• Top 3 entries are saved to the leaderboard</li>
            </ul>
          </div>

          {showRanking && ranking.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Ranked Results:</h4>
              {ranking.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-slate-900'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{entry.creator?.display_name || entry.creator?.pen_name || 'Unknown'}</p>
                      {entry.post && (
                        <span className="text-sm text-muted-foreground">
                          • {entry.post.title}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Score: {entry.calculated_score}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span>Likes: {entry.engagement?.likes_count || 0}</span>
                      <span>Comments: {entry.engagement?.comments_count || 0}</span>
                      <span>Shares: {entry.engagement?.shares_count || 0}</span>
                      <span>Views: {entry.engagement?.views_count || 0}</span>
                    </div>
                  </div>
                  {entry.post?.cover_image_url && (
                    <img
                      src={entry.post.cover_image_url}
                      alt={entry.post.title}
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prompt Versions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Prompt Versions
          </CardTitle>
          <CardDescription>
            Version history of this writing prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promptVersions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No versions available</p>
          ) : (
            <div className="space-y-3">
              {promptVersions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 rounded-lg border ${
                    version.is_active ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{version.version}</span>
                      {version.is_active && (
                        <Badge className="bg-green-500">Active</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {version.content}
                  </p>
                  {version.metadata && (
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      <span>Status: {version.metadata.status || 'N/A'}</span>
                      {version.metadata.ai_generation_model && (
                        <span className="ml-4">AI: {version.metadata.ai_generation_model}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
