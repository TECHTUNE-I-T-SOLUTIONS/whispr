'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, Upload, X, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export default function NewChallengePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    prompt_type: 'blog' as 'blog' | 'poem' | 'story',
    challenge_type: 'daily' as 'daily' | 'weekly' | 'monthly',
    is_ai_generated: false,
    starts_at: new Date().toISOString().slice(0, 16),
    max_entries_per_user: 1,
    evaluation_criteria: {
      integrity: 30,
      sincerity: 30,
      passion: 20,
      engagement: 20
    },
    tags: [] as string[],
    featured_image_url: '',
    prize_description: ''
  });
  const [tagInput, setTagInput] = useState('');

  const handleAIGenerate = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/admin/chronicles/writing-prompts/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_type: formData.prompt_type,
          challenge_type: formData.challenge_type
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Extract topic from the generated content to create a descriptive title
        const topicMatch = data.content.match(/about\s+(.+?)(?:\s+that|\s+which|\s+exploring|\s+describing|$)/i);
        const topic = topicMatch ? topicMatch[1].trim() : 'various themes';
        
        // Create a descriptive title based on the topic
        const topicWords = topic.split(' ').slice(0, 3); // Take first 3 words
        const descriptiveTitle = `${formData.challenge_type.charAt(0).toUpperCase() + formData.challenge_type.slice(1)} ${formData.prompt_type.charAt(0).toUpperCase() + formData.prompt_type.slice(1)}: ${topicWords.join(' ')}`;
        
        // Create a neutral description without mentioning AI
        const description = `A ${formData.challenge_type} ${formData.prompt_type} writing challenge about ${topic.toLowerCase()}. Participants are encouraged to express their creativity and unique perspective on this theme.`;
        
        setFormData({
          ...formData,
          title: descriptiveTitle,
          description: description,
          content: data.content,
          tags: data.tags || [],
          is_ai_generated: true
        });
        toast({
          title: 'AI Generated',
          description: data.warning || 'Challenge content and tags have been generated. Review and save.',
        });
      } else {
        throw new Error('Failed to generate');
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/chronicles/writing-prompts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: 'Challenge Created',
          description: 'Writing challenge has been created successfully.',
        });
        router.push('/admin/chronicles/writing-challenges');
      } else {
        throw new Error('Failed to create challenge');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to create challenge. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/chronicles/writing-challenges">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Create New Challenge</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Create a new writing challenge for creators
          </p>
        </div>
      </div>

      {/* AI Generation Card - Moved to Top */}
      <Card className="border-2 border-dashed border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-600" />
            AI Generation
          </CardTitle>
          <CardDescription>
            Use AI to generate challenge content automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="ai-generated-toggle" className="text-base font-medium">
                Enable AI Generation
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Toggle on to use AI for generating challenge content
              </p>
            </div>
            <Switch
              id="ai-generated-toggle"
              checked={formData.is_ai_generated}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_ai_generated: checked })
              }
            />
          </div>
          
          {formData.is_ai_generated && (
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleAIGenerate}
                disabled={generatingAI}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {generatingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({ ...formData, is_ai_generated: false })}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Challenge Details</CardTitle>
            <CardDescription>
              Basic information about the writing challenge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Daily Poetry Challenge"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt-type">Content Type *</Label>
                <Select
                  value={formData.prompt_type}
                  onValueChange={(value: 'blog' | 'poem' | 'story') =>
                    setFormData({ ...formData, prompt_type: value })
                  }
                >
                  <SelectTrigger id="prompt-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="poem">Poem</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenge-type">Challenge Type *</Label>
                <Select
                  value={formData.challenge_type}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                    setFormData({ ...formData, challenge_type: value })
                  }
                >
                  <SelectTrigger id="challenge-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (ends at midnight)</SelectItem>
                    <SelectItem value="weekly">Weekly (ends at week end)</SelectItem>
                    <SelectItem value="monthly">Monthly (ends at month end)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="starts-at">Start Date & Time *</Label>
                <Input
                  id="starts-at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the challenge"
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Prompt Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="The actual writing prompt or challenge instructions"
                rows={6}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-entries">Max Entries Per User</Label>
                <Input
                  id="max-entries"
                  type="number"
                  min="1"
                  value={formData.max_entries_per_user}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_entries_per_user: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured-image">Featured Image URL (Optional)</Label>
                <Input
                  id="featured-image"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize">Prize Description (Optional)</Label>
              <Textarea
                id="prize"
                value={formData.prize_description}
                onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
                placeholder="Describe the prize for winners"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluation Criteria</CardTitle>
            <CardDescription>
              Set the scoring weights for evaluating entries (total should be 100)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="integrity">Integrity</Label>
                <Input
                  id="integrity"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.evaluation_criteria.integrity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      evaluation_criteria: {
                        ...formData.evaluation_criteria,
                        integrity: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="sincerity">Sincerity</Label>
                <Input
                  id="sincerity"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.evaluation_criteria.sincerity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      evaluation_criteria: {
                        ...formData.evaluation_criteria,
                        sincerity: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="passion">Passion</Label>
                <Input
                  id="passion"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.evaluation_criteria.passion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      evaluation_criteria: {
                        ...formData.evaluation_criteria,
                        passion: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="engagement">Engagement</Label>
                <Input
                  id="engagement"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.evaluation_criteria.engagement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      evaluation_criteria: {
                        ...formData.evaluation_criteria,
                        engagement: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-end sticky bottom-0 bg-background p-4 border-t">
          <Link href="/admin/chronicles/writing-challenges" className="w-full sm:w-auto">
            <Button variant="outline" type="button" className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Challenge'}
          </Button>
        </div>
      </form>
    </div>
  );
}
