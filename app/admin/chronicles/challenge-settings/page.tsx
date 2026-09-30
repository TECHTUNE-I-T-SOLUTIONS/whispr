'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, RefreshCw, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface PromptSettings {
  id?: string;
  ai_auto_generation_enabled: boolean;
  ai_generation_frequency: 'daily' | 'weekly' | 'monthly';
  ai_generation_schedule_time: string;
  ai_generation_day_of_week?: number;
  ai_generation_day_of_month?: number;
  ai_model_preference: string;
  allow_admin_edit_ai_prompts: boolean;
  default_challenge_type: 'daily' | 'weekly' | 'monthly';
  default_evaluation_criteria: Record<string, number>;
  max_active_challenges: number;
  auto_end_challenges: boolean;
  auto_announce_winners: boolean;
  winner_announcement_delay_hours: number;
}

export default function ChallengeSettingsPage() {
  const [settings, setSettings] = useState<PromptSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/chronicles/challenge-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings || null);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/chronicles/challenge-settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast({
          title: 'Settings saved',
          description: 'Challenge settings have been updated successfully.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!settings) return;

    try {
      const res = await fetch('/api/admin/chronicles/writing-prompts/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_type: 'blog',
          challenge_type: settings.default_challenge_type,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Prompt Generated',
          description: 'AI-generated writing prompt has been created.',
        });
      } else {
        throw new Error('Failed to generate prompt');
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate prompt. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No settings found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Challenge Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure AI auto-generation and challenge management settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePrompt}
            disabled={!settings.ai_auto_generation_enabled}
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate AI Prompt
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Auto-Generation</CardTitle>
          <CardDescription>
            Configure automatic AI prompt generation for writing challenges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ai-enabled">Enable AI Auto-Generation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate writing prompts using AI
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={settings.ai_auto_generation_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, ai_auto_generation_enabled: checked })
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="frequency">Generation Frequency</Label>
              <Select
                value={settings.ai_generation_frequency}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                  setSettings({ ...settings, ai_generation_frequency: value })
                }
              >
                <SelectTrigger id="frequency">
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
              <Label htmlFor="schedule-time">Schedule Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={settings.ai_generation_schedule_time}
                onChange={(e) =>
                  setSettings({ ...settings, ai_generation_schedule_time: e.target.value })
                }
              />
            </div>

            {settings.ai_generation_frequency === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="day-of-week">Day of Week (0-6, 0=Sunday)</Label>
                <Input
                  id="day-of-week"
                  type="number"
                  min="0"
                  max="6"
                  value={settings.ai_generation_day_of_week ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ai_generation_day_of_week: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            )}

            {settings.ai_generation_frequency === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="day-of-month">Day of Month (1-31)</Label>
                <Input
                  id="day-of-month"
                  type="number"
                  min="1"
                  max="31"
                  value={settings.ai_generation_day_of_month ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ai_generation_day_of_month: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ai-model">AI Model Preference</Label>
              <Select
                value={settings.ai_model_preference}
                onValueChange={(value) =>
                  setSettings({ ...settings, ai_model_preference: value })
                }
              >
                <SelectTrigger id="ai-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow-edit">Allow Admin Edit AI Prompts</Label>
              <p className="text-sm text-muted-foreground">
                Allow admins to edit AI-generated prompts before publishing
              </p>
            </div>
            <Switch
              id="allow-edit"
              checked={settings.allow_admin_edit_ai_prompts}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allow_admin_edit_ai_prompts: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Challenge Settings</CardTitle>
          <CardDescription>
            Configure default settings for new challenges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-type">Default Challenge Type</Label>
              <Select
                value={settings.default_challenge_type}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                  setSettings({ ...settings, default_challenge_type: value })
                }
              >
                <SelectTrigger id="default-type">
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
              <Label htmlFor="max-challenges">Max Active Challenges</Label>
              <Input
                id="max-challenges"
                type="number"
                min="1"
                value={settings.max_active_challenges}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_active_challenges: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Evaluation Criteria (weights)</Label>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="integrity">Integrity</Label>
                <Input
                  id="integrity"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.default_evaluation_criteria.integrity}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      default_evaluation_criteria: {
                        ...settings.default_evaluation_criteria,
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
                  value={settings.default_evaluation_criteria.sincerity}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      default_evaluation_criteria: {
                        ...settings.default_evaluation_criteria,
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
                  value={settings.default_evaluation_criteria.passion}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      default_evaluation_criteria: {
                        ...settings.default_evaluation_criteria,
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
                  value={settings.default_evaluation_criteria.engagement}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      default_evaluation_criteria: {
                        ...settings.default_evaluation_criteria,
                        engagement: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
          <CardDescription>
            Configure automatic challenge management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-end">Auto-End Challenges</Label>
              <p className="text-sm text-muted-foreground">
                Automatically end challenges when their deadline is reached
              </p>
            </div>
            <Switch
              id="auto-end"
              checked={settings.auto_end_challenges}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, auto_end_challenges: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-announce">Auto-Announce Winners</Label>
              <p className="text-sm text-muted-foreground">
                Automatically announce winners after evaluation is complete
              </p>
            </div>
            <Switch
              id="auto-announce"
              checked={settings.auto_announce_winners}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, auto_announce_winners: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-delay">Winner Announcement Delay (hours)</Label>
            <Input
              id="announcement-delay"
              type="number"
              min="0"
              value={settings.winner_announcement_delay_hours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  winner_announcement_delay_hours: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
