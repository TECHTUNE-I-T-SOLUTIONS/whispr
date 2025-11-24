'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  AlertCircle,
  Edit,
  Share2,
  Users,
  BookOpen,
  Award,
  Flame,
  Mail,
  MapPin,
  Link as LinkIcon,
} from 'lucide-react';

interface CreatorProfile {
  id: string;
  pen_name: string;
  bio: string;
  profile_image_url?: string;
  cover_image_url?: string;
  email: string;
  location?: string;
  website?: string;
  total_followers: number;
  total_posts: number;
  total_engagement: number;
  current_streak: number;
  badges: string[];
  created_at: string;
  preferred_categories: string[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chronicles/creator/profile');

      if (!response.ok) {
        setError('Failed to load profile');
        setLoading(false);
        return;
      }

      const data = await response.json();
      const creatorData = data.creator || data;
      setProfile(creatorData);
      setIsOwnProfile(true); // Since we're fetching own profile
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 pt-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 pt-20">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{error}</p>
          <Button onClick={fetchProfile} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 pb-12">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-purple-600 to-pink-600">
        {profile.cover_image_url ? (
          <Image
            src={profile.cover_image_url}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600" />
        )}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Edit Button */}
        {isOwnProfile && (
          <Link href="/chronicles/settings" className="absolute top-4 right-4 z-10">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header with Avatar */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 -mt-16 mb-8 relative z-10">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {profile.profile_image_url ? (
                <Image
                  src={profile.profile_image_url}
                  alt={profile.pen_name}
                  width={140}
                  height={140}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl object-cover border-4 border-white dark:border-slate-900 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-white">
                    {profile.pen_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 pt-4 sm:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {profile.pen_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
              {!isOwnProfile && (
                <Button className="gap-2">
                  <Users className="w-4 h-4" />
                  Follow
                </Button>
              )}
            </div>

            {profile.bio && (
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                {profile.bio}
              </p>
            )}

            {/* Contact & Links */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{profile.email}</span>
              </div>
              {profile.location && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-sm">Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Posts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.total_posts}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Followers</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.total_followers.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Engagement</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.total_engagement.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-red-600" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Streak</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.current_streak}
            </p>
          </div>
        </div>

        {/* Categories */}
        {profile.preferred_categories && profile.preferred_categories.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-800 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_categories.map((category) => (
                <span
                  key={category}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Achievements
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {profile.badges.map((badge) => (
                <div
                  key={badge}
                  className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <span className="text-3xl mb-2">🏆</span>
                  <span className="text-xs text-center font-medium text-gray-700 dark:text-gray-300">
                    {badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
