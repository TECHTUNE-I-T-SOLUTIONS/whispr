'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Upload, 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  PartyPopper, 
  Bookmark,
  Calendar,
  Key,
  User,
  Heart,
  Sliders,
  Award,
  Zap,
  Globe,
  Lock,
  Instagram,
  Twitter,
  ArrowLeft
} from 'lucide-react';

export default function ChroniclesWaitlist() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = auth, 2 = profile, 3 = preferences, 4 = review
  const [submitted, setSubmitted] = useState(false);
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
      website: 'https://whisprwords.com',
    },
  });

  const categories = [
    'Fiction', 'Poetry', 'Technology', 'Lifestyle',
    'Personal', 'Business', 'Education', 'Travel',
    'Food', 'Health', 'Art & Design', 'Music'
  ];

  const benefits = [
    {
      icon: Award,
      title: "Exclusive Verified Creator Badge",
      desc: "Get auto-verified with a premium purple launch badge visible on all your initial posts.",
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: Zap,
      title: "Priority Pen Name Reservation",
      desc: "Lock in your absolute unique identity and claim your profile URL before our public launch.",
      color: "from-amber-400 to-orange-500"
    },
    {
      icon: Globe,
      title: "First Wave Beta Access",
      desc: "Be the first to create and write poems, blogs, and multi-chapter stories with our AI helper engines.",
      color: "from-emerald-400 to-teal-500"
    }
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

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
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
        isWaitlist: true,
      };

      const res = await fetch('/api/chronicles/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register waitlist account');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        <div className="max-w-xl w-full bg-slate-900/40 border border-purple-500/20 rounded-[32px] p-8 md:p-12 shadow-2xl backdrop-blur-xl text-center relative z-10">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/45 text-purple-300 mb-6 animate-bounce">
            <PartyPopper className="h-9 w-9" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            Identity Secured!
          </h1>
          <p className="text-slate-300 text-sm md:text-base mb-8 max-w-sm mx-auto leading-relaxed">
            Your unique pen name and creator credentials have been fully reserved. Day-one priority access is now linked to your account.
          </p>

          <div className="bg-slate-950/80 rounded-2xl p-6 border border-white/5 space-y-4 mb-8 text-left shadow-inner">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/5 text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5 tracking-wider">
                <Bookmark className="h-4 w-4 text-purple-400" /> SECURED CREATOR OUTLINE
              </span>
              <span className="font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest text-[9px]">
                Pending Launch
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Pen Name ID</span>
                <span className="font-mono font-bold text-white text-base">@{formData.penName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Display Label</span>
                <span className="font-semibold text-white">{formData.displayName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Content Scope</span>
                <span className="font-semibold text-white capitalize">{formData.contentType} creator</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Email Reserved</span>
                <span className="font-semibold text-white truncate max-w-[150px] block">{formData.email}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2.5 p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-200">
              <Calendar className="h-4 w-4 shrink-0 text-purple-400" />
              <span>Launch alerts will be delivered straight to <strong>{formData.email}</strong>.</span>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 text-white rounded-xl flex-1 max-w-[200px] h-12">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-16 px-4 md:px-8 relative overflow-hidden font-sans">
      {/* Background radial gradient lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Premium Value Props */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-extrabold text-purple-400 bg-purple-900/35 border border-purple-500/30 rounded-full uppercase tracking-widest shadow-lg shadow-purple-900/20">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-purple-400" /> Exclusive Launch Waitlist
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              Reserve Your <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">Whispr Identity</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
              We are opening up the next-generation space for stories, poetry, and blogs. Secure your custom pen name and launch badge today.
            </p>
          </div>

          {/* Stepper overview (Visual Indicator) */}
          <div className="hidden lg:flex flex-col gap-6 py-2 border-l border-white/5 pl-4">
            {[
              { num: 1, title: "Auth Access", desc: "Choose your primary launch key credentials.", icon: Key },
              { num: 2, title: "Identity", desc: "Secure your customized pen name.", icon: User },
              { num: 3, title: "Creative Preferences", desc: "Select your genre directions.", icon: Heart },
              { num: 4, title: "Review & Security", desc: "Finalize notifications.", icon: Sliders },
            ].map((s) => (
              <div key={s.num} className={`flex gap-3.5 transition-all duration-300 ${step === s.num ? 'opacity-100 scale-102 translation-x-1' : 'opacity-40'}`}>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  step === s.num 
                    ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : step > s.num
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-900 border-white/10 text-slate-500'
                }`}>
                  {step > s.num ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-5">{s.title}</h4>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            {benefits.map((b, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 shadow-lg">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${b.color} p-2.5 flex items-center justify-center shrink-0 shadow-inner`}>
                  <b.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white mb-0.5">{b.title}</h5>
                  <p className="text-xs text-slate-400 leading-normal">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Premium Glassmorphic Card Form */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/30 border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            
            {/* Step Indicators for Mobile */}
            <div className="flex lg:hidden gap-3 mb-6 items-center justify-center">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    step === s 
                      ? 'w-8 bg-purple-500' 
                      : step > s 
                        ? 'w-2.5 bg-emerald-500' 
                        : 'w-2.5 bg-white/10'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Authentication */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Let's build your account key</h3>
                  <p className="text-xs text-slate-400 mt-1">First, configure your email credentials to claim waitlist reservation certificates.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address *</label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950/60 border-white/10 focus:border-purple-500 rounded-xl text-sm h-12 text-white placeholder-slate-600 focus:ring-0 focus-visible:ring-0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Create Password *</label>
                    <Input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950/60 border-white/10 focus:border-purple-500 rounded-xl text-sm h-12 text-white placeholder-slate-600 focus:ring-0 focus-visible:ring-0"
                      required
                    />
                    <span className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-2">
                      <Lock className="h-3 w-3 text-purple-400" /> Passwords are encrypted utilizing military-grade hashing.
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl h-12 flex items-center justify-center gap-1.5 font-bold transition-all shadow-lg shadow-purple-900/20">
                  Next: Configure Pen Name <ArrowRight className="w-4 h-4" />
                </Button>

                <p className="text-xs text-center text-slate-400">
                  Already secured an outline?{' '}
                  <Link href="/chronicles/login" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline">
                    Sign in here
                  </Link>
                </p>
              </form>
            )}

            {/* Step 2: Profile Identity */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Choose your Pen Identity</h3>
                  <p className="text-xs text-slate-400 mt-1">This is how you will be searched and read on sitemaps. Claim yours before anyone else does!</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Pen Name *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm font-extrabold">@</span>
                        <Input
                          type="text"
                          name="penName"
                          placeholder="johndoe"
                          value={formData.penName}
                          onChange={handleInputChange}
                          className="w-full bg-slate-950/60 border-white/10 focus:border-purple-500 rounded-xl text-sm h-12 text-white pl-8 placeholder-slate-600 focus:ring-0 focus-visible:ring-0 font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Display Name *</label>
                      <Input
                        type="text"
                        name="displayName"
                        placeholder="John Doe"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950/60 border-white/10 focus:border-purple-500 rounded-xl text-sm h-12 text-white placeholder-slate-600 focus:ring-0 focus-visible:ring-0"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Short Bio</label>
                    <Textarea
                      name="bio"
                      placeholder="Write a brief intro about your writing philosophy..."
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full min-h-20 bg-slate-950/60 border-white/10 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-600 focus:ring-0 font-serif resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Upload Profile Photo</label>
                    <div className="border border-dashed border-white/15 rounded-xl p-4 bg-slate-950/40">
                      {profileImagePreview ? (
                        <div className="relative rounded-lg overflow-hidden group">
                          <img
                            src={profileImagePreview}
                            alt="Profile preview"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProfileImage(null);
                              setProfileImagePreview('');
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 shadow"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex flex-col items-center justify-center py-4 cursor-pointer hover:bg-white/5 rounded-lg transition-all"
                        >
                          <Upload className="w-6 h-6 text-purple-400 mb-1.5" />
                          <span className="text-xs font-bold text-white">Choose profile picture</span>
                          <span className="text-[9px] text-slate-500 mt-0.5">PNG or JPG, max 5MB</span>
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
                </div>

                {error && (
                  <div className="flex gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-slate-300"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold">
                    Next: Preferences
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Creative Preferences */}
            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Fine-tune your writing preferences</h3>
                  <p className="text-xs text-slate-400 mt-1">This configures your customized beta analytics feed and tags on launch.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Primary Content Type *</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['blog', 'poem', 'both'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, contentType: type }))}
                          className={`p-3 rounded-xl border transition-all capitalize text-xs font-bold ${
                            formData.contentType === type
                              ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                              : 'border-white/10 bg-slate-950/40 text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Favorite Categories * (select at least one)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleCategoryToggle(category)}
                          className={`p-2.5 rounded-xl border transition-all text-xs font-medium flex items-center justify-center gap-1.5 ${
                            formData.preferredCategories.includes(category)
                              ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                              : 'border-white/10 bg-slate-950/40 text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          {formData.preferredCategories.includes(category) && (
                            <Check className="w-3.5 h-3.5 shrink-0 text-purple-400 font-black" />
                          )}
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Default Profile Visibility</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['public', 'private'].map((visibility) => (
                        <button
                          key={visibility}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, profileVisibility: visibility }))}
                          className={`p-3 rounded-xl border transition-all capitalize text-xs font-bold ${
                            formData.profileVisibility === visibility
                              ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                              : 'border-white/10 bg-slate-950/40 text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          {visibility}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-slate-300"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold">
                    Next: Final Details
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4: Review & Security */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Launch Day Notifications</h3>
                  <p className="text-xs text-slate-400 mt-1">Control how and when you get beta alerts, ad-free access codes, and profile engagement alerts.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-medium select-none text-slate-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        name="pushNotifications"
                        checked={formData.pushNotifications}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 rounded border-white/10 text-purple-600 focus:ring-purple-500 bg-slate-950"
                      />
                      <span>Launch Day Mobile Push Alerts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-medium select-none text-slate-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        name="emailDigest"
                        checked={formData.emailDigest}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 rounded border-white/10 text-purple-600 focus:ring-purple-500 bg-slate-950"
                      />
                      <span>Weekly Beta Outlines Digest</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-medium select-none text-slate-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        name="emailOnEngagement"
                        checked={formData.emailOnEngagement}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 rounded border-white/10 text-purple-600 focus:ring-purple-500 bg-slate-950"
                      />
                      <span>Notify on VIP partner invites</span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Social Handles (for reservations confirmation)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <Twitter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                          type="text"
                          placeholder="twitter_handle"
                          value={formData.socialLinks.twitter}
                          onChange={(e) => handleSocialChange('twitter', e.target.value)}
                          className="w-full bg-slate-950/60 border-white/10 focus:border-purple-500 rounded-xl text-sm h-11 text-white pl-10 placeholder-slate-600 focus:ring-0 focus-visible:ring-0"
                        />
                      </div>
                      <div className="relative">
                        <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                          type="text"
                          placeholder="instagram_handle"
                          value={formData.socialLinks.instagram}
                          onChange={(e) => handleSocialChange('instagram', e.target.value)}
                          className="w-full bg-slate-950/60 border-white/10 focus:border-purple-500 rounded-xl text-sm h-11 text-white pl-10 placeholder-slate-600 focus:ring-0 focus-visible:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-slate-300"
                    onClick={() => setStep(3)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-extrabold h-12 shadow-lg shadow-purple-900/25" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Securing Outline...
                      </>
                    ) : (
                      <>
                        Join Waitlist <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Legal statement */}
          <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
            By reserving your pen name, you agree to the Whispr{' '}
            <Link href="/terms" className="text-purple-400 hover:underline">
              Terms of Use
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-purple-400 hover:underline">
              Privacy Policy
            </Link>.
          </p>
        </div>

      </div>
    </main>
  );
}
