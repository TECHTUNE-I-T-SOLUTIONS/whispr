'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Clock, Calendar, BookOpen, PenTool, Flame, User, CheckCircle, XCircle, AlertCircle, TrendingUp, Heart, MessageCircle, Share2, Eye as EyeIcon } from 'lucide-react';
import DOMPurify from 'dompurify';

interface Creator {
  id: string;
  pen_name: string;
  display_name: string;
  profile_image_url?: string;
  avatar_url?: string;
  bio?: string;
}

interface Post {
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
}

interface EngagementData {
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  total_reactions: number;
  total_comments: number;
  reactions_by_type: Record<string, number>;
}

interface PromptEntry {
  id: string;
  prompt_id: string;
  creator_id: string;
  post_id: string;
  entry_type: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'flagged';
  submitted_at: string;
  is_ai_generated: boolean;
  ai_confidence_score?: number;
  ai_flagged: boolean;
  ai_flag_reason?: string;
  creator?: Creator;
  post?: Post;
  engagement?: EngagementData;
}

export default function EntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<PromptEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEntry();
  }, [params.id, params.entryId]);

  const loadEntry = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chronicles/writing-prompts/${params.id}/entries/${params.entryId}`);
      if (!res.ok) throw new Error('Failed to load entry');
      const data = await res.json();
      setEntry(data.entry || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'flagged': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'under_review': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'flagged': return <TrendingUp className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'blog': return <BookOpen className="w-5 h-5" />;
      case 'poem': return <PenTool className="w-5 h-5" />;
      case 'story': return <Flame className="w-5 h-5" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">{error || 'Entry not found'}</p>
              <div className="flex justify-center mt-4">
                <Link href={`/admin/chronicles/writing-challenges/${params.id}`}>
                  <Button variant="outline">Go Back</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/chronicles/writing-challenges/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Challenge
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Entry Details</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage this challenge submission
          </p>
        </div>
      </div>

      {/* Entry Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className={getStatusColor(entry.status)}>
              {getStatusIcon(entry.status)}
              <span className="ml-1 capitalize">{entry.status.replace('_', ' ')}</span>
            </Badge>
            {entry.is_ai_generated && (
              <Badge variant="outline" className="text-orange-500">
                AI Generated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Entry ID</p>
              <p className="font-mono text-sm">{entry.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted At</p>
              <p className="font-medium">{new Date(entry.submitted_at).toLocaleString()}</p>
            </div>
            {entry.ai_confidence_score && (
              <div>
                <p className="text-sm text-muted-foreground">AI Confidence Score</p>
                <p className="font-medium">{entry.ai_confidence_score}%</p>
              </div>
            )}
            {entry.ai_flagged && (
              <div>
                <p className="text-sm text-muted-foreground">AI Flag Reason</p>
                <p className="font-medium text-orange-600">{entry.ai_flag_reason || 'Unknown'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Creator Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Creator Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {entry.creator?.profile_image_url || entry.creator?.avatar_url ? (
              <img
                src={entry.creator?.profile_image_url || entry.creator?.avatar_url}
                alt={entry.creator?.pen_name || 'Unknown'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                {entry.creator?.pen_name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold">
                {entry.creator?.display_name || entry.creator?.pen_name || 'Unknown Creator'}
              </h3>
              <p className="text-muted-foreground">@{entry.creator?.pen_name || 'unknown'}</p>
              {entry.creator?.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{entry.creator.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Post Content */}
      {entry.post && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPostTypeIcon(entry.post.post_type)}
              <span className="capitalize">{entry.post.post_type} Post</span>
            </CardTitle>
            <CardDescription>
              {entry.post.status === 'published' ? (
                <Link href={`/chronicles/${entry.post.slug}`} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                  View Live Post →
                </Link>
              ) : (
                <span>Draft</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {entry.post.cover_image_url && (
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <img
                  src={entry.post.cover_image_url}
                  alt={entry.post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-2">{entry.post.title}</h2>
              <p className="text-muted-foreground mb-4">{entry.post.excerpt}</p>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.post.content) }} />
            </div>
            {entry.post.tags && entry.post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {entry.post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">#{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Engagement Metrics */}
      {entry.engagement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Engagement Metrics
            </CardTitle>
            <CardDescription>
              Performance data for this entry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-muted-foreground">Likes</span>
                </div>
                <p className="text-2xl font-bold">{entry.engagement.likes_count}</p>
                <p className="text-xs text-muted-foreground">{entry.engagement.total_reactions} total reactions</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Comments</span>
                </div>
                <p className="text-2xl font-bold">{entry.engagement.comments_count}</p>
                <p className="text-xs text-muted-foreground">{entry.engagement.total_comments} total</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Shares</span>
                </div>
                <p className="text-2xl font-bold">{entry.engagement.shares_count}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <EyeIcon className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Views</span>
                </div>
                <p className="text-2xl font-bold">{entry.engagement.views_count}</p>
              </div>
            </div>
            {Object.keys(entry.engagement.reactions_by_type).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Reactions by Type:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(entry.engagement.reactions_by_type).map(([type, count]) => (
                    <Badge key={type} variant="outline">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {entry.post && entry.post.status === 'published' && (
            <Link href={`/chronicles/${entry.post.slug}`} target="_blank" rel="noopener noreferrer">
              <Button>
                <Eye className="w-4 h-4 mr-2" />
                View Live Post
              </Button>
            </Link>
          )}
          <Button variant="outline">
            Approve Entry
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700">
            Reject Entry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}