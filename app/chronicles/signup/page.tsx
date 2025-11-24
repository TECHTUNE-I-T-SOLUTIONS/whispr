'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Loader2, AlertCircle, Upload, X, Check } from 'lucide-react';

export default function ChroniclesSignup() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = auth, 2 = profile, 3 = preferences, 4 = review
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    penName: '',
    displayName: '',
    bio: '',
    contentType: 'both',
    preferredCategories: [] as string[],
    profileVisibility: 'public',
    pushNotifications: true,
    emailDigest: true,
    emailOnEngagement: true,
    socialLinks: {
      twitter: '',
      instagram: '',
      website: 'https://whisprwords.vercel.app',
    },
  });

  const categories = [
    'Fiction',
    'Poetry',
    'Technology',
    'Lifestyle',
    'Personal',
    'Business',
    'Education',
    'Travel',
    'Food',
    'Health',
    'Art & Design',
    'Music',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(category)
        ? prev.preferredCategories.filter((c) => c !== category)
        : [...prev.preferredCategories, category],
    }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.penName || !formData.displayName) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.penName.length < 3) {
      setError('Pen name must be at least 3 characters');
      return;
    }

    if (formData.displayName.length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    setStep(3);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.preferredCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert image file to base64 if provided
      let profileImageBase64: string | null = null;

      if (profileImage) {
        try {
          profileImageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(profileImage);
          });
        } catch (err) {
          console.error('Image reading error:', err);
          // Continue without image
        }
      }

      const signupData = {
        email: formData.email,
        password: formData.password,
        penName: formData.penName,
        displayName: formData.displayName,
        bio: formData.bio,
        profileImage: profileImageBase64,
        contentType: formData.contentType,
        preferredCategories: formData.preferredCategories,
        profileVisibility: formData.profileVisibility,
        pushNotifications: formData.pushNotifications,
        emailDigest: formData.emailDigest,
        emailOnEngagement: formData.emailOnEngagement,
        socialLinks: formData.socialLinks,
      };

      const res = await fetch('/api/chronicles/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Success
      router.push('/chronicles/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Join Chronicles</h1>
          <p className="text-muted-foreground">Share your stories with the world</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-8 shadow-sm">
          {/* Step Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step >= s ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-700'
                }`}
              ></div>
            ))}
          </div>

          {/* Step 1: Authentication */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/chronicles/login" className="text-purple-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Profile Setup */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pen Name *</label>
                  <Input
                    type="text"
                    name="penName"
                    placeholder="Your unique pen name"
                    value={formData.penName}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">How readers will know you</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Display Name *</label>
                  <Input
                    type="text"
                    name="displayName"
                    placeholder="Your full name or brand name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Shown on your profile</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <Textarea
                  name="bio"
                  placeholder="Tell readers about yourself... (optional)"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full min-h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Profile Picture</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-4">
                  {profileImagePreview ? (
                    <div className="relative">
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProfileImage(null);
                          setProfileImagePreview('');
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium">Upload Profile Picture</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Primary Content Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['blog', 'poem', 'both'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, contentType: type }))}
                      className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                        formData.contentType === type
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Preferred Categories * (select at least one)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-2 rounded-lg border-2 transition-colors text-sm ${
                        formData.preferredCategories.includes(category)
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      {formData.preferredCategories.includes(category) && (
                        <Check className="w-3 h-3 inline mr-1" />
                      )}
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Profile Visibility</label>
                <div className="grid grid-cols-2 gap-3">
                  {['public', 'private'].map((visibility) => (
                    <button
                      key={visibility}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, profileVisibility: visibility }))}
                      className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                        formData.profileVisibility === visibility
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      {visibility}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Review & Settings */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Notification Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="pushNotifications"
                      checked={formData.pushNotifications}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Push notifications</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="emailDigest"
                      checked={formData.emailDigest}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Weekly email digest</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="emailOnEngagement"
                      checked={formData.emailOnEngagement}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Email on engagement (likes, comments)</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Social Links (optional)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">X</label>
                    <Input
                      type="text"
                      placeholder="your_handle"
                      value={formData.socialLinks.twitter}
                      onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Instagram</label>
                    <Input
                      type="text"
                      placeholder="your_handle"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Website</label>
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={formData.socialLinks.website}
                      onChange={(e) => handleSocialChange('website', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(3)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-purple-600 hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-purple-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}
