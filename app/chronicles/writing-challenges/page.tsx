'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Target, Calendar, Clock, Users, BookOpen, PenTool, Flame, CheckCircle, 
  AlertCircle, ArrowRight
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
  submission_deadline: string;
  entries_count: number;
  featured_image_url?: string;
  tags: string[];
  prize_description?: string;
  user_entries_count?: number;
  has_user_entered?: boolean;
  max_entries_per_user?: number;
}

export default function WritingChallengesPage() {
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chronicles/writing-prompts');
      if (!response.ok) throw new Error('Failed to fetch prompts');
      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || prompt.prompt_type === typeFilter;
    const isActive = prompt.status === 'active';
    return matchesSearch && matchesType && isActive;
  });

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

  const isChallengeEnded = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    return end.getTime() <= now.getTime();
  };

  const getPromptTypeIcon = (type: string) => {
    switch (type) {
      case 'blog': return <BookOpen className="w-5 h-5" />;
      case 'poem': return <PenTool className="w-5 h-5" />;
      case 'story': return <Flame className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
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
      case 'monthly': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Writing Challenges</h1>
        <p className="text-muted-foreground mt-1">
          Participate in writing challenges and compete with other creators
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search challenges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Types</option>
          <option value="blog">Blog</option>
          <option value="poem">Poem</option>
          <option value="story">Story</option>
        </select>
      </div>

      {filteredPrompts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active challenges found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="overflow-hidden">
              {prompt.featured_image_url && (
                <div className="h-48 bg-gradient-to-br from-red-500 to-pink-500">
                  <img
                    src={prompt.featured_image_url}
                    alt={prompt.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPromptTypeColor(prompt.prompt_type)}>
                        {getPromptTypeIcon(prompt.prompt_type)}
                        <span className="ml-1">{prompt.prompt_type}</span>
                      </Badge>
                      <Badge className={getChallengeTypeColor(prompt.challenge_type)}>
                        {prompt.challenge_type}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{prompt.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {prompt.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {prompt.content}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getTimeRemaining(prompt.submission_deadline)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {prompt.entries_count || 0} entries
                  </div>
                </div>

                {prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {prompt.prize_description && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      🏆 {prompt.prize_description}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {isChallengeEnded(prompt.submission_deadline) ? (
                    <Button variant="outline" className="flex-1" disabled>
                      <Clock className="w-4 h-4 mr-2" />
                      Challenge Ended
                    </Button>
                  ) : prompt.has_user_entered ? (
                    <Button variant="outline" className="flex-1" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Already Entered
                    </Button>
                  ) : (
                    <Link href={`/chronicles/write?prompt=${prompt.id}`} className="flex-1">
                      <Button className="w-full">
                        Enter Challenge
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                  <Link href={`/chronicles/writing-challenges/${prompt.id}`}>
                    <Button variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
