'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Edit, Eye, Calendar, Clock, Users, BookOpen, PenTool, Flame,
  CheckCircle, XCircle, AlertCircle, TrendingUp
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
  post_type: string;
  post_id: string;
  entry_type?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'flagged';
  submitted_at: string;
  is_ai_generated: boolean;
  ai_confidence_score?: number;
  creator?: {
    pen_name: string;
    profile_image_url?: string;
  };
  post?: {
    title: string;
    entry_type: string;
  };
}

export default function ChallengeDetailPage() {
  const params = useParams();
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  const [entries, setEntries] = useState<PromptEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promptRes, entriesRes] = await Promise.all([
        fetch(`/api/admin/chronicles/writing-prompts/${params.id}`),
        fetch(`/api/admin/chronicles/writing-prompts/${params.id}/entries`)
      ]);

      if (!promptRes.ok) throw new Error('Failed to fetch prompt');
      if (!entriesRes.ok) throw new Error('Failed to fetch entries');

      const promptData = await promptRes.json();
      const entriesData = await entriesRes.json();

      setPrompt(promptData.prompt || null);
      setEntries(entriesData.entries || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {entry.creator?.profile_image_url && (
                      <img
                        src={entry.creator.profile_image_url}
                        alt={entry.creator.pen_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{entry.creator?.pen_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.post?.title || 'Untitled'} • {entry.entry_type || entry.post_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getEntryStatusColor(entry.status)}>
                      {getEntryStatusIcon(entry.status)}
                      <span className="ml-1 capitalize">{entry.status.replace('_', ' ')}</span>
                    </Badge>
                    {entry.is_ai_generated && (
                      <Badge variant="outline" className="text-orange-500">
                        AI Flagged
                      </Badge>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
