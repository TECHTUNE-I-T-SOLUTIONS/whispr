'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Bell,
  Lock,
  Eye,
  Link as LinkIcon,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
} from 'lucide-react';

interface CreatorProfile {
  id: string;
  pen_name: string;
  bio: string;
  profile_image_url?: string;
  email: string;
  content_type: 'blog' | 'poem' | 'both';
  preferred_categories: string[];
  social_links: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  profile_visibility: 'public' | 'private';
  push_notifications_enabled: boolean;
}

export default function CreatorSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [profile, setProfile] = useState<CreatorProfile>({
    id: '',
    pen_name: '',
    bio: '',
    email: '',
    content_type: 'blog',
    preferred_categories: [],
    social_links: {},
    profile_visibility: 'public',
    push_notifications_enabled: false,
  });

  const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/chronicles/creator/profile');
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/chronicles/creator/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/chronicles/creator/upload-profile-picture', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setProfile({ ...profile, profile_image_url: data.url });
      setSuccess('Profile picture updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddSocialLink = () => {
    if (newSocialLink.platform && newSocialLink.url) {
      setProfile({
        ...profile,
        social_links: {
          ...profile.social_links,
          [newSocialLink.platform]: newSocialLink.url,
        },
      });
      setNewSocialLink({ platform: '', url: '' });
    }
  };

  const handleRemoveSocialLink = (platform: string) => {
    const { [platform]: _, ...rest } = profile.social_links;
    setProfile({ ...profile, social_links: rest });
  };

  const handleTogglePushNotifications = async () => {
    setSaving(true);
    setError('');

    try {
      if (!profile.push_notifications_enabled) {
        // Request notification permission
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            setError('Notification permission denied');
            setSaving(false);
            return;
          }
        }

        // Register service worker and subscribe to push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });

            // Send subscription to server
            await fetch('/api/chronicles/creator/push-subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription),
            });

            console.log('Push subscription successful:', subscription);
          } catch (pushError) {
            console.error('Push subscription error:', pushError);
            setError('Failed to enable push notifications');
            setSaving(false);
            return;
          }
        }
      }

      const newStatus = !profile.push_notifications_enabled;
      setProfile({ ...profile, push_notifications_enabled: newStatus });

      // Save to database
      const res = await fetch('/api/chronicles/creator/push-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update notification settings');

      setSuccess(`Push notifications ${newStatus ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      setProfile({ ...profile, push_notifications_enabled: !profile.push_notifications_enabled });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Creator Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-800">
          {['profile', 'notifications', 'privacy'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'profile' && 'Profile'}
              {tab === 'notifications' && 'Notifications'}
              {tab === 'privacy' && 'Privacy'}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg mb-6">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium mb-3">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {profile.profile_image_url ? (
                    <Image
                      src={profile.profile_image_url}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.pen_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <span className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer inline-flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50">
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadingImage ? 'Uploading...' : 'Upload'}
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF • Max 5MB</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4 border-t border-gray-200 dark:border-slate-800 pt-6">
              <div>
                <label className="block text-sm font-medium mb-2">Pen Name</label>
                <Input
                  type="text"
                  value={profile.pen_name}
                  onChange={(e) => setProfile({ ...profile, pen_name: e.target.value })}
                  placeholder="Your creative pen name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input type="email" value={profile.email} disabled className="bg-gray-50 dark:bg-slate-800" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="min-h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <select
                  value={profile.content_type}
                  onChange={(e) => setProfile({ ...profile, content_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="blog">Blog Posts</option>
                  <option value="poem">Poems</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {['fiction', 'technology', 'lifestyle', 'personal', 'business', 'education'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        const cats = profile.preferred_categories.includes(cat)
                          ? profile.preferred_categories.filter((c) => c !== cat)
                          : [...profile.preferred_categories, cat];
                        setProfile({ ...profile, preferred_categories: cats });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        profile.preferred_categories.includes(cat)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-slate-800 text-foreground hover:bg-gray-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
              <label className="block text-sm font-medium mb-3">Social Links</label>

              {Object.entries(profile.social_links).map(([platform, url]) => (
                <div key={platform} className="flex items-center gap-2 mb-2">
                  <Input value={url} disabled className="bg-gray-50 dark:bg-slate-800" />
                  <button
                    onClick={() => handleRemoveSocialLink(platform)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 mt-4">
                <select
                  value={newSocialLink.platform}
                  onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 flex-shrink-0"
                >
                  <option value="">Select platform</option>
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="website">Website</option>
                  <option value="instagram">Instagram</option>
                </select>
                <Input
                  type="text"
                  value={newSocialLink.url}
                  onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleAddSocialLink}
                  disabled={!newSocialLink.platform || !newSocialLink.url}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <p className="font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Push Notifications
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive notifications when creators engage with your content
                </p>
              </div>
              <button
                onClick={handleTogglePushNotifications}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  profile.push_notifications_enabled
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    profile.push_notifications_enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {profile.push_notifications_enabled && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30 rounded-lg space-y-3">
                <p className="text-sm font-medium">Notification Preferences</p>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-sm">New likes on your posts</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-sm">New comments on your posts</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-sm">New followers</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-sm">Posts from followed creators</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div>
              <label className="block text-sm font-medium mb-3">Profile Visibility</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <input
                    type="radio"
                    name="visibility"
                    checked={profile.profile_visibility === 'public'}
                    onChange={() => setProfile({ ...profile, profile_visibility: 'public' })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Public
                    </p>
                    <p className="text-xs text-muted-foreground">Your profile is visible to everyone</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <input
                    type="radio"
                    name="visibility"
                    checked={profile.profile_visibility === 'private'}
                    onChange={() => setProfile({ ...profile, profile_visibility: 'private' })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Private
                    </p>
                    <p className="text-xs text-muted-foreground">Your profile is only visible to followers</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
              <h3 className="font-medium mb-4">Account Management</h3>
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </div>
          </div>
        )}

        {/* Save Button */}
        {activeTab !== 'notifications' && (
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => fetchProfile()}>
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
        )}
      </div>
    </main>
  );
}
