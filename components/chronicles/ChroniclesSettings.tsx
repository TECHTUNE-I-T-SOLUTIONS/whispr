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
  display_name?: string;
  avatar_url?: string;
  location?: string;
  content_type: 'blog' | 'poem' | 'both';
  preferred_categories: string[];
  categories: string[];
  social_links: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    instagram?: string;
    [key: string]: string | undefined;
  };
  profile_visibility: 'public' | 'private';
  push_notifications_enabled: boolean;
  email_digest_enabled: boolean;
  email_on_engagement: boolean;
}

interface FeedPreferences {
  id: string;
  creator_id: string;
  followed_categories: string[];
  followed_creators: string[];
  blocked_creators: string[];
  feed_algorithm: 'trending' | 'chronological' | 'personalized';
  show_adult_content: boolean;
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
    display_name: '',
    location: '',
    content_type: 'blog',
    preferred_categories: [],
    categories: [],
    social_links: {},
    profile_visibility: 'public',
    push_notifications_enabled: false,
    email_digest_enabled: true,
    email_on_engagement: true,
  });

  const [feedPreferences, setFeedPreferences] = useState<FeedPreferences>({
    id: '',
    creator_id: '',
    followed_categories: [],
    followed_creators: [],
    blocked_creators: [],
    feed_algorithm: 'trending',
    show_adult_content: false,
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
      
      // Fetch feed preferences
      const feedRes = await fetch('/api/chronicles/creator/feed-preferences');
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setFeedPreferences(feedData);
      }
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
      // Save profile
      const res = await fetch('/api/chronicles/creator/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      // Save feed preferences
      const feedRes = await fetch('/api/chronicles/creator/feed-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedPreferences),
      });

      if (!feedRes.ok) throw new Error('Failed to save feed preferences');

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
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold">Creator Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-800 overflow-x-auto">
          {['profile', 'notifications', 'privacy', 'feed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'profile' && 'Profile'}
              {tab === 'notifications' && 'Notifications'}
              {tab === 'privacy' && 'Privacy'}
              {tab === 'feed' && 'Feed Preferences'}
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
          <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium mb-3">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
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
                    <span className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer inline-flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50">
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
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input
                  type="text"
                  value={profile.display_name || ''}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="Your full display name"
                />
              </div>

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
                <Input type="email" value={profile.email} disabled className="bg-gray-50 dark:bg-black" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Your location"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-black"
                >
                  <option value="blog">Blog Posts</option>
                  <option value="poem">Poems</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {['fiction', 'technology', 'lifestyle', 'personal', 'business', 'education', 'fantasy', 'romance', 'mystery', 'science'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        const cats = profile.categories.includes(cat)
                          ? profile.categories.filter((c) => c !== cat)
                          : [...profile.categories, cat];
                        setProfile({ ...profile, categories: cats });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        profile.categories.includes(cat)
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 dark:bg-black text-foreground hover:bg-gray-300 dark:hover:bg-slate-700'
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
                  <Input value={url} disabled className="bg-gray-50 dark:bg-black" />
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
                  className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-black flex-shrink-0"
                >
                  <option value="">Select platform</option>
                  <option value="twitter">X</option>
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
          <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-black/50 rounded-lg">
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
                    ? 'bg-gradient-to-r from-red-600 to-pink-600'
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

            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-black/50 rounded-lg">
              <div>
                <p className="font-medium">Email Digest</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive weekly email digest of your activity
                </p>
              </div>
              <button
                onClick={() => setProfile({ ...profile, email_digest_enabled: !profile.email_digest_enabled })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  profile.email_digest_enabled
                    ? 'bg-gradient-to-r from-red-600 to-pink-600'
                    : 'bg-gray-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    profile.email_digest_enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-black/50 rounded-lg">
              <div>
                <p className="font-medium">Email on Engagement</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive email when someone engages with your content
                </p>
              </div>
              <button
                onClick={() => setProfile({ ...profile, email_on_engagement: !profile.email_on_engagement })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  profile.email_on_engagement
                    ? 'bg-gradient-to-r from-red-600 to-pink-600'
                    : 'bg-gray-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    profile.email_on_engagement ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {profile.push_notifications_enabled && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg space-y-3">
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
          <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div>
              <label className="block text-sm font-medium mb-3">Profile Visibility</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-black/50">
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

                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-black/50">
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

        {/* Feed Preferences Tab */}
        {activeTab === 'feed' && (
          <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <div>
              <label className="block text-sm font-medium mb-3">Feed Algorithm</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-black/50">
                  <input
                    type="radio"
                    name="algorithm"
                    checked={feedPreferences?.feed_algorithm === 'trending'}
                    onChange={() => setFeedPreferences({ ...feedPreferences, feed_algorithm: 'trending' })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Trending</p>
                    <p className="text-xs text-muted-foreground">See trending content across the platform</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-black/50">
                  <input
                    type="radio"
                    name="algorithm"
                    checked={feedPreferences?.feed_algorithm === 'chronological'}
                    onChange={() => setFeedPreferences({ ...feedPreferences, feed_algorithm: 'chronological' })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Chronological</p>
                    <p className="text-xs text-muted-foreground">See posts in chronological order</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-black/50">
                  <input
                    type="radio"
                    name="algorithm"
                    checked={feedPreferences?.feed_algorithm === 'personalized'}
                    onChange={() => setFeedPreferences({ ...feedPreferences, feed_algorithm: 'personalized' })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Personalized</p>
                    <p className="text-xs text-muted-foreground">See content based on your interests</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Content Preferences</label>
              <div className="flex items-center justify-between p-4 border border-gray-300 dark:border-slate-700 rounded-lg">
                <div>
                  <p className="font-medium">Show Adult Content</p>
                  <p className="text-xs text-muted-foreground">Display mature content in your feed</p>
                </div>
                <button
                  onClick={() => setFeedPreferences({ ...feedPreferences, show_adult_content: !feedPreferences?.show_adult_content })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    feedPreferences?.show_adult_content
                      ? 'bg-gradient-to-r from-red-600 to-pink-600'
                      : 'bg-gray-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      feedPreferences?.show_adult_content ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Blocked Creators</label>
              <p className="text-sm text-muted-foreground mb-3">
                Block creators to hide their content from your feed
              </p>
              <div className="text-sm text-muted-foreground">
                {feedPreferences?.blocked_creators?.length === 0 ? (
                  <p>No blocked creators</p>
                ) : (
                  <p>{feedPreferences?.blocked_creators?.length || 0} blocked creators</p>
                )}
              </div>
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
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
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
