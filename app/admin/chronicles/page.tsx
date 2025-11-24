'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Sliders,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  BookOpen,
  TrendingUp,
  Bell,
} from 'lucide-react';

interface ChroniclesSettings {
  feature_enabled: boolean;
  registration_open: boolean;
  max_posts_per_day: number;
  min_content_length: number;
  require_email_verification: boolean;
  allow_anonymous_comments: boolean;
  auto_publish_delay_seconds: number;
}

interface ChroniclesStats {
  total_creators: number;
  total_posts: number;
  total_engagement: number;
  active_creators_today: number;
  top_creator: { name: string; posts: number } | null;
}

export default function AdminChroniclesControl() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<ChroniclesStats | null>(null);

  const [settings, setSettings] = useState<ChroniclesSettings>({
    feature_enabled: true,
    registration_open: true,
    max_posts_per_day: 5,
    min_content_length: 100,
    require_email_verification: true,
    allow_anonymous_comments: false,
    auto_publish_delay_seconds: 0,
  });

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chronicles/settings', {
        cache: 'no-store', // Ensure fresh data
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load settings: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Fetched settings:', data);
      
      // Ensure all required fields are present with proper types
      const cleanedSettings: ChroniclesSettings = {
        feature_enabled: data.feature_enabled === true || data.feature_enabled === 'true' ? true : false,
        registration_open: data.registration_open === true || data.registration_open === 'true' ? true : false,
        max_posts_per_day: parseInt(data.max_posts_per_day || '5') || 5,
        min_content_length: parseInt(data.min_content_length || '100') || 100,
        require_email_verification: data.require_email_verification === true || data.require_email_verification === 'true' ? true : false,
        allow_anonymous_comments: data.allow_anonymous_comments === true || data.allow_anonymous_comments === 'true' ? true : false,
        auto_publish_delay_seconds: parseInt(data.auto_publish_delay_seconds || '0') || 0,
      };
      
      console.log('Cleaned settings:', cleanedSettings);
      setSettings(cleanedSettings);
      setError('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load settings';
      console.error('Error fetching settings:', errorMsg);
      setError(errorMsg);
      // Keep default settings on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/chronicles/admin/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/chronicles/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const result = await res.json();
      console.log('Settings saved:', result);

      setSuccess('Settings updated successfully');
      // Refetch settings to confirm
      await fetchSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold">Chronicles Control Panel</h1>
          </div>
          <p className="text-muted-foreground">Manage the Chronicles platform settings and monitor activity</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Creators"
              value={stats.total_creators}
              color="bg-gradient-to-br from-purple-600 to-purple-700"
            />
            <StatCard
              icon={BookOpen}
              label="Total Posts"
              value={stats.total_posts}
              color="bg-gradient-to-br from-pink-600 to-pink-700"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Engagement"
              value={stats.total_engagement}
              color="bg-gradient-to-br from-blue-600 to-blue-700"
            />
            <StatCard
              icon={Bell}
              label="Active Today"
              value={stats.active_creators_today}
              color="bg-gradient-to-br from-green-600 to-green-700"
            />
          </div>
        )}

        {/* Main Settings Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
          {/* Alerts */}
          {error && (
            <div className="border-b border-gray-200 dark:border-slate-800 flex gap-3 p-4 bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="border-b border-gray-200 dark:border-slate-800 flex gap-3 p-4 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Feature Toggles */}
          <div className="border-b border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Sliders className="w-5 h-5" /> Feature Toggles
            </h2>

            <div className="space-y-4">
              {/* Feature Enabled */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium">Enable Chronicles Feature</p>
                  <p className="text-sm text-muted-foreground">Allow users to access the Chronicles platform</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, feature_enabled: !settings.feature_enabled })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.feature_enabled
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'bg-gray-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.feature_enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Registration Open */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium">Open Creator Registration</p>
                  <p className="text-sm text-muted-foreground">Allow new creators to sign up</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, registration_open: !settings.registration_open })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.registration_open
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'bg-gray-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.registration_open ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Email Verification */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium">Require Email Verification</p>
                  <p className="text-sm text-muted-foreground">Creators must verify email before posting</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, require_email_verification: !settings.require_email_verification })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.require_email_verification
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'bg-gray-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.require_email_verification ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Anonymous Comments */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium">Allow Anonymous Comments</p>
                  <p className="text-sm text-muted-foreground">Permit anonymous users to comment on posts</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, allow_anonymous_comments: !settings.allow_anonymous_comments })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.allow_anonymous_comments
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'bg-gray-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.allow_anonymous_comments ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Numeric Settings */}
          <div className="border-b border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold mb-6">Content Policies</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Max Posts Per Day</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.max_posts_per_day}
                  onChange={(e) => setSettings({ ...settings, max_posts_per_day: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Minimum Content Length (chars)</label>
                <Input
                  type="number"
                  min="0"
                  max="10000"
                  value={settings.min_content_length}
                  onChange={(e) => setSettings({ ...settings, min_content_length: parseInt(e.target.value) })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Auto-Publish Delay (seconds)</label>
                <Input
                  type="number"
                  min="0"
                  max="3600"
                  value={settings.auto_publish_delay_seconds}
                  onChange={(e) => setSettings({ ...settings, auto_publish_delay_seconds: parseInt(e.target.value) })}
                  placeholder="0 for immediate publishing"
                />
                <p className="text-xs text-muted-foreground mt-1">Delay before posts are visible to other users</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="p-6 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => fetchSettings()}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Quick Access Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/admin/chronicles/notifications')}
            className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-purple-500 transition-colors text-left"
          >
            <Bell className="w-6 h-6 text-purple-600 mb-3" />
            <p className="font-semibold">Notifications</p>
            <p className="text-sm text-muted-foreground">View admin alerts and actions</p>
          </button>

          <button
            onClick={() => router.push('/admin/chronicles/comments')}
            className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-blue-500 transition-colors text-left"
          >
            <BookOpen className="w-6 h-6 text-blue-600 mb-3" />
            <p className="font-semibold">Comments</p>
            <p className="text-sm text-muted-foreground">Moderate and manage comments</p>
          </button>

          <button
            onClick={() => router.push('/admin/chronicles/leaderboard')}
            className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-yellow-500 transition-colors text-left"
          >
            <TrendingUp className="w-6 h-6 text-yellow-600 mb-3" />
            <p className="font-semibold">Leaderboard</p>
            <p className="text-sm text-muted-foreground">View rankings and recalculate</p>
          </button>

          <button
            onClick={() => router.push('/admin/chronicles/monetization')}
            className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-green-500 transition-colors text-left"
          >
            <div className="text-2xl mb-3">💰</div>
            <p className="font-semibold">Monetization</p>
            <p className="text-sm text-muted-foreground">Track earnings and payouts</p>
          </button>

          <button
            onClick={() => router.push('/admin/chronicles/creators')}
            className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-pink-500 transition-colors text-left"
          >
            <Users className="w-6 h-6 text-pink-600 mb-3" />
            <p className="font-semibold">Creators</p>
            <p className="text-sm text-muted-foreground">Manage creator accounts</p>
          </button>

          <button
            onClick={() => router.push('/admin/chronicles/analytics')}
            className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-indigo-500 transition-colors text-left"
          >
            <div className="text-2xl mb-3">📊</div>
            <p className="font-semibold">Analytics</p>
            <p className="text-sm text-muted-foreground">View platform metrics</p>
          </button>

          <button
            onClick={() => router.push('/admin/chronicles/settings')}
            className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-cyan-500 transition-colors text-left"
          >
            <div className="text-2xl mb-3">⚙️</div>
            <p className="font-semibold">Settings</p>
            <p className="text-sm text-muted-foreground">Configure platform options</p>
          </button>

          <button
            onClick={() => router.push('/admin/chronicles/reports')}
            className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:border-amber-500 transition-colors text-left"
          >
            <div className="text-2xl mb-3">📈</div>
            <p className="font-semibold">Reports</p>
            <p className="text-sm text-muted-foreground">Generate and manage reports</p>
          </button>
        </div>
      </div>
    </main>
  );
}
