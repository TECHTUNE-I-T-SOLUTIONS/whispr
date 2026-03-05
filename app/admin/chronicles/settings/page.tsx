'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, AlertCircle, CheckCircle, Settings } from 'lucide-react';

interface SystemSettings {
  feature_enabled: boolean;
  registration_open: boolean;
  max_posts_per_day: number;
  min_content_length: number;
  allow_anonymous_comments: boolean;
  require_email_verification: boolean;
  maintenance_mode?: boolean;
  maintenance_message?: string | null;
}

interface MonetizationSettings {
  ad_revenue_share_percentage: number;
  payout_threshold: number;
  enable_tipping: boolean;
  enable_subscriptions: boolean;
}

interface ContentPolicy {
  id: string;
  policy_name: string;
  description: string;
  enforcement_level: string;
}

interface CategorySettings {
  id: string;
  category_name: string;
  description: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [monetizationSettings, setMonetizationSettings] = useState<MonetizationSettings | null>(null);
  const [contentPolicies, setContentPolicies] = useState<ContentPolicy[]>([]);
  const [categories, setCategories] = useState<CategorySettings[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const systemRes = await fetch('/api/chronicles/admin/settings?type=system');
      const monetizationRes = await fetch('/api/chronicles/admin/settings?type=monetization');
      const policiesRes = await fetch('/api/chronicles/admin/settings?type=content_policies');
      const categoriesRes = await fetch('/api/chronicles/admin/settings?type=categories');

      if (!systemRes.ok || !monetizationRes.ok || !policiesRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to load settings');
      }

      const systemData = await systemRes.json();
      const monetizationData = await monetizationRes.json();
      const policiesData = await policiesRes.json();
      const categoriesData = await categoriesRes.json();

      setSystemSettings(systemData.data);
      setMonetizationSettings(monetizationData.data);
      setContentPolicies(policiesData.data || []);
      setCategories(categoriesData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSystemSettings = async () => {
    if (!systemSettings) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Send the full system object to server; server will split to the proper tables
      const res = await fetch('/api/chronicles/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'system', data: systemSettings }),
      });

      const payload = await res.json();
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.error || 'Failed to save settings');
      }

      setSuccess('System settings updated successfully!');
      // Refresh local settings to ensure we display stored values
      fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const saveMonetizationSettings = async () => {
    if (!monetizationSettings) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/chronicles/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'monetization', data: monetizationSettings }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setSuccess('Monetization settings updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-md font-bold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </h1>
        <p className="text-muted-foreground text-xs mt-1">Manage Chronicles platform settings and configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b text-sm">
        {['system', 'monetization', 'policies', 'categories'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* System Settings */}
      {activeTab === 'system' && systemSettings && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Feature Toggles</CardTitle>
              <CardDescription className="text-xs">Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <div>
                  <p className="font-medium">Enable Chronicles Feature</p>
                  <p className="text-sm text-muted-foreground">Allow access to the platform</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="Enable Chronicles Feature"
                  checked={systemSettings.feature_enabled}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, feature_enabled: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <div>
                  <p className="font-medium">Open Registration</p>
                  <p className="text-sm text-muted-foreground">Allow new creators to register</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="Open Registration"
                  checked={systemSettings.registration_open}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, registration_open: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <div>
                  <p className="font-medium">Require Email Verification</p>
                  <p className="text-sm text-muted-foreground">Verify email on registration</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="Require Email Verification"
                  checked={systemSettings.require_email_verification}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, require_email_verification: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <div>
                  <p className="font-medium">Allow Anonymous Comments</p>
                  <p className="text-sm text-muted-foreground">Users can comment without account</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="Allow Anonymous Comments"
                  checked={systemSettings.allow_anonymous_comments}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, allow_anonymous_comments: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </div>

              <div className="flex flex-col gap-3 mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Show a maintenance banner site-wide</p>
                  </div>
                  <input
                    type="checkbox"
                    aria-label="Maintenance Mode"
                    checked={!!systemSettings.maintenance_mode}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, maintenance_mode: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Maintenance Message (optional)</label>
                  <Textarea
                    aria-label="Maintenance Message"
                    value={systemSettings.maintenance_message ?? ''}
                    onChange={(e) => setSystemSettings({ ...systemSettings, maintenance_message: e.target.value })}
                    placeholder="Optional message shown in the maintenance banner"
                    className="min-h-20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Add a brief message for users when maintenance mode is active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Limits</CardTitle>
              <CardDescription className="text-xs">Set restrictions on content creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-2">Max Posts Per Day</label>
                <Input
                  type="number"
                  value={systemSettings.max_posts_per_day}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      max_posts_per_day: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Minimum Content Length (characters)</label>
                <Input
                  type="number"
                  value={systemSettings.min_content_length}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      min_content_length: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveSystemSettings} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      )}

      {/* Monetization Settings */}
      {activeTab === 'monetization' && monetizationSettings && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Share</CardTitle>
              <CardDescription>Configure creator earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ad Revenue Share %</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={monetizationSettings.ad_revenue_share_percentage}
                  onChange={(e) =>
                    setMonetizationSettings({
                      ...monetizationSettings,
                      ad_revenue_share_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage of ad revenue creators receive
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payout Threshold ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monetizationSettings.payout_threshold}
                  onChange={(e) =>
                    setMonetizationSettings({
                      ...monetizationSettings,
                      payout_threshold: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum earnings required for payout
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Enable or disable monetization features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded">
                <div>
                  <p className="font-medium">Enable Tipping</p>
                  <p className="text-sm text-muted-foreground">Users can tip creators</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="Enable Tipping"
                  checked={monetizationSettings.enable_tipping}
                  onChange={(e) =>
                    setMonetizationSettings({ ...monetizationSettings, enable_tipping: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded">
                <div>
                  <p className="font-medium">Enable Subscriptions</p>
                  <p className="text-sm text-muted-foreground">Creators can offer subscriptions</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="Enable Subscriptions"
                  checked={monetizationSettings.enable_subscriptions}
                  onChange={(e) =>
                    setMonetizationSettings({
                      ...monetizationSettings,
                      enable_subscriptions: e.target.checked,
                    })
                  }
                  className="w-5 h-5"
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveMonetizationSettings} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Monetization Settings
              </>
            )}
          </Button>
        </div>
      )}

      {/* Content Policies */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          {contentPolicies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader>
                <CardTitle>{policy.policy_name}</CardTitle>
                <CardDescription>{policy.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    Enforcement: <strong>{policy.enforcement_level.toUpperCase()}</strong>
                  </span>
                  <Button variant="outline">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.category_name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${category.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <Button variant="outline">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
