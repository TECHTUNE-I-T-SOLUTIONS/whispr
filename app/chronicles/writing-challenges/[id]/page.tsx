'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Calendar, Clock, Users, BookOpen, PenTool, Flame, 
  CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

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
  tags: string[];
  prize_description?: string;
  user_entries_count?: number;
  has_user_entered?: boolean;
}

export default function WritingChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPrompt();
  }, [params.id]);

  const loadPrompt = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chronicles/writing-prompts?status=active`);
      if (!res.ok) throw new Error('Failed to load challenge');
      const data = await res.json();
      const prompts = data.prompts || [];
      const found = prompts.find((p: WritingPrompt) => p.id === params.id);
      if (found) {
        setPrompt(found);
      } else {
        setError('Challenge not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const getPromptTypeIcon = (type: string) => {
    switch (type) {
      case 'blog': return <BookOpen className="w-5 h-5" />;
      case 'poem': return <PenTool className="w-5 h-5" />;
      case 'story': return <Flame className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getPromptTypeColor = (type: string) => {
    switch (type) {
      case 'blog': return 'bg-orange-500';
      case 'poem': return 'bg-indigo-500';
      case 'story': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-500';
      case 'weekly': return 'bg-red-500';
      case 'monthly': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 pt-20">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{error || 'Challenge not found'}</p>
          <Button onClick={() => router.push('/chronicles/writing-challenges')} variant="outline">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/chronicles/writing-challenges" className="inline-block mb-8">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Button>
        </Link>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getChallengeTypeColor(prompt.challenge_type)}>
                  {prompt.challenge_type.charAt(0).toUpperCase() + prompt.challenge_type.slice(1)}
                </Badge>
                <Badge className={getPromptTypeColor(prompt.prompt_type)}>
                  {prompt.prompt_type.charAt(0).toUpperCase() + prompt.prompt_type.slice(1)}
                </Badge>
                <Badge variant={prompt.status === 'active' ? 'default' : 'secondary'}>
                  {prompt.status.charAt(0).toUpperCase() + prompt.status.slice(1)}
                </Badge>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">{prompt.title}</CardTitle>
            <CardDescription className="text-base">{prompt.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Content */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                {getPromptTypeIcon(prompt.prompt_type)}
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  {prompt.prompt_type} Challenge
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                {prompt.content}
              </p>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-5 h-5" />
                <span>{prompt.entries_count} entries</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-5 h-5" />
                <span>{getTimeRemaining(prompt.submission_deadline)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-5 h-5" />
                <span>Max {prompt.max_entries_per_user} entry per user</span>
              </div>
              {prompt.prize_description && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>{prompt.prize_description}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action Button */}
            {prompt.status === 'active' && !prompt.has_user_entered && (
              <Link href="/chronicles/write" className="block">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Participate in Challenge
                </Button>
              </Link>
            )}

            {prompt.has_user_entered && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">You have entered this challenge</span>
              </div>
            )}

            {prompt.status !== 'active' && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-5 h-5" />
                <span>This challenge has ended</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard Link */}
        <div className="mt-6">
          <Link href="/chronicles/challenge-leaderboard" className="block">
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
