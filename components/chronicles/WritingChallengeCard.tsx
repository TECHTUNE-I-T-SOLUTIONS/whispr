'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, PenTool, Clock, Users, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  is_ai_generated: boolean;
}

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

export default function WritingChallengeCard() {
  const [challenge, setChallenge] = useState<WritingPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveChallenge();
  }, []);

  const fetchActiveChallenge = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chronicles/writing-prompts?status=active&limit=1');
      if (!res.ok) {
        throw new Error('Failed to load challenge');
      }
      const data = await res.json();
      const prompts = data.prompts || [];
      if (prompts.length > 0) {
        setChallenge(prompts[0]);
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenge');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading challenge...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !challenge) {
    return null; // Don't show error state, just hide the card
  }

  const timeRemaining = getTimeRemaining(challenge.submission_deadline);

  const challengeTypeColors = {
    daily: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    weekly: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    monthly: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  const promptTypeIcons = {
    blog: PenTool,
    poem: Sparkles,
    story: BookOpen,
  };

  const PromptIcon = promptTypeIcons[challenge.prompt_type];

  return (
    <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={challengeTypeColors[challenge.challenge_type]}>
                {challenge.challenge_type.charAt(0).toUpperCase() + challenge.challenge_type.slice(1)}
              </Badge>
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {challenge.title}
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              {challenge.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Content */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <PromptIcon className="w-4 h-4 text-red-600" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              {challenge.prompt_type} Challenge
            </span>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 line-clamp-3">
            {challenge.content}
          </p>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{challenge.entries_count} entries</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{timeRemaining}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {challenge.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Link href="/chronicles/writing-challenges" className="block">
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
            View Challenge
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
