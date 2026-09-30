'use client';

import { useState, useEffect } from 'react';
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
import { Save, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

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
  max_entries_per_user: number;
  evaluation_criteria: Record<string, number>;
  tags: string[];
  prize_description?: string;
  featured_image_url?: string;
  is_ai_generated?: boolean;
}

export default function EditChallengePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<WritingPrompt | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadPrompt();
  }, [params.id]);

  const loadPrompt = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/chronicles/writing-prompts/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch prompt');
      const data = await response.json();
      setFormData(data.prompt || null);
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to load challenge',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/chronicles/writing-prompts/${params.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: 'Challenge Updated',
          description: 'Writing challenge has been updated successfully.',
        });
        router.push(`/admin/chronicles/writing-challenges/${params.id}`);
      } else {
        throw new Error('Failed to update challenge');
      }
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to update challenge. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (!formData || tagInput.trim()) return;
    if (formData.tags.includes(tagInput.trim())) return;

    setFormData({
      ...formData,
      tags: [...formData.tags, tagInput.trim()]
    });
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!formData) {
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
      <div className="flex items-center gap-4">
        <Link href={`/admin/chronicles/writing-challenges/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Challenge</h1>
          <p className="text-muted-foreground mt-1">
            Update the writing challenge details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
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
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'active' | 'ended' | 'archived') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="starts-at">Start Date & Time *</Label>
                <Input
                  id="starts-at"
                  type="datetime-local"
                  value={formData.starts_at.slice(0, 16)}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends-at">End Date & Time</Label>
                <Input
                  id="ends-at"
                  type="datetime-local"
                  value={formData.ends_at ? formData.ends_at.slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission-deadline">Submission Deadline</Label>
                <Input
                  id="submission-deadline"
                  type="datetime-local"
                  value={formData.submission_deadline ? formData.submission_deadline.slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                />
              </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize">Prize Description (Optional)</Label>
              <Textarea
                id="prize"
                value={formData.prize_description || ''}
                onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="featured-image">Featured Image URL (Optional)</Label>
              <Input
                id="featured-image"
                value={formData.featured_image_url || ''}
                onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
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

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ai-generated">AI Generated</Label>
                <p className="text-sm text-muted-foreground">
                  Mark if this prompt was generated by AI
                </p>
              </div>
              <Switch
                id="ai-generated"
                checked={formData.is_ai_generated}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_ai_generated: checked })
                }
              />
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
            <div className="grid gap-4 md:grid-cols-4">
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

        <div className="flex gap-4 justify-end">
          <Link href={`/admin/chronicles/writing-challenges/${params.id}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
