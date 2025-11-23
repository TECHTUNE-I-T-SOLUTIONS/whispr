'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Loader2, AlertCircle, Upload, X } from 'lucide-react';

type SignupStep = 1 | 2 | 3 | 4 | 5;

const CATEGORIES = [
  'fiction', 'technology', 'lifestyle', 'personal',
  'business', 'education', 'poetry', 'other'
];

export default function EnhancedChroniclesSignup() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<SignupStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    penName: '',
    bio: '',
    contentType: 'both' as 'blog' | 'poem' | 'both',
    categories: [] as string[],
    profileImage: null as File | null,
    profileImageUrl: '',
    agreeToTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          profileImage: file,
          profileImageUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    setFormData((prev) => ({ ...prev, profileImage: null, profileImageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.penName.trim()) {
      setError('Pen name is required');
      return false;
    }
    if (formData.penName.length < 3 || formData.penName.length > 50) {
      setError('Pen name must be 3-50 characters');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.bio.trim()) {
      setError('Bio is required');
      return false;
    }
    if (formData.bio.length < 10 || formData.bio.length > 500) {
      setError('Bio must be 10-500 characters');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (formData.categories.length === 0) {
      setError('Select at least one category');
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    if (!formData.agreeToTerms) {
      setError('You must agree to the terms');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;
    if (step < 5) setStep((step + 1) as SignupStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateStep5()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('penName', formData.penName);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('contentType', formData.contentType);
      formDataToSend.append('categories', JSON.stringify(formData.categories));
      if (formData.profileImage) {
        formDataToSend.append('profileImage', formData.profileImage);
      }

      const res = await fetch('/api/chronicles/auth/signup', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      router.push('/chronicles/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Join Whispr Chronicles
          </h1>
          <p className="text-muted-foreground">
            Step {step} of 5 • Create your creator account
          </p>
        </div>

        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                s <= step
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gray-200 dark:bg-slate-800'
              }`}
            ></div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-8 shadow-sm">
          {error && (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address *</label>
                  <Input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password *</label>
                  <Input type="password" name="password" placeholder="Create a strong password" value={formData.password} onChange={handleInputChange} />
                  <p className="text-xs text-muted-foreground mt-1">At least 8 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                  <Input type="password" name="confirmPassword" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleInputChange} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <label className="block text-sm font-medium mb-2">Pen Name *</label>
                <Input type="text" name="penName" placeholder="Your unique pen name" value={formData.penName} onChange={handleInputChange} maxLength={50} />
                <p className="text-xs text-muted-foreground mt-1">How readers will know you</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Bio *</label>
                  <Textarea name="bio" placeholder="Tell us about yourself..." value={formData.bio} onChange={handleInputChange} maxLength={500} className="min-h-24" />
                  <p className="text-xs text-muted-foreground mt-1">{formData.bio.length}/500</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Profile Picture (Optional)</label>
                  {formData.profileImageUrl ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-purple-600 mb-4">
                      <Image src={formData.profileImageUrl} alt="Profile" fill className="object-cover" />
                      <button type="button" onClick={removeProfileImage} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-purple-600">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">Click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfileImageSelect} className="hidden" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">What do you write? *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['blog', 'poem', 'both'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, contentType: type })}
                        className={`p-4 rounded-lg border-2 transition ${
                          formData.contentType === type ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="text-lg font-bold mb-1">{type === 'blog' ? '📝' : type === 'poem' ? '✨' : '🎯'}</div>
                        <div className="text-sm font-medium capitalize">{type}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Your Categories (Select at least 1) *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryToggle(cat)}
                        className={`p-3 rounded-lg border-2 transition text-sm capitalize ${
                          formData.categories.includes(cat)
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-900/50">
                  <h3 className="font-bold mb-3">Your Profile Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Pen Name:</span> <span className="ml-2 font-medium">{formData.penName}</span></div>
                    <div><span className="text-muted-foreground">Content Type:</span> <span className="ml-2 font-medium capitalize">{formData.contentType}</span></div>
                    <div><span className="text-muted-foreground">Categories:</span> <span className="ml-2 font-medium">{formData.categories.join(', ')}</span></div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleInputChange} className="mt-1" />
                  <label className="text-sm">I agree to <Link href="/terms" className="text-purple-600 hover:underline">Terms</Link> and <Link href="/privacy" className="text-purple-600 hover:underline">Privacy</Link></label>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-6 mt-8 border-t border-gray-200 dark:border-slate-800">
              {step > 1 && (
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep((step - 1) as SignupStep)}>
                  Back
                </Button>
              )}
              {step < 5 ? (
                <Button type="button" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white" onClick={handleNextStep}>
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white" disabled={loading}>
                  {loading ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </> : <>
                    Create Account <ArrowRight className="ml-2 w-4 h-4" />
                  </>}
                </Button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link href="/chronicles/login" className="text-purple-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
