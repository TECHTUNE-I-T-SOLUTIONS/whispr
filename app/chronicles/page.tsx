'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, BookOpen, Zap, Users, TrendingUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChroniclesLanding() {
  const [isClient, setIsClient] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if chronicles is enabled
    checkFeatureStatus();
  }, []);

  const checkFeatureStatus = async () => {
    try {
      const res = await fetch('/api/chronicles/settings');
      if (res.ok) {
        const data = await res.json();
        setFeatureEnabled(data?.featureEnabled === true);
      }
    } catch (e) {
      console.error('Failed to check feature status:', e);
    }
  };

  if (!isClient) return null;

  if (!featureEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Lock className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Coming Soon</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Whispr Chronicles is coming soon! Check back for exciting updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="flex justify-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <Sparkles className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              Welcome to Whispr Chronicles
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your personal publishing platform. Write, share, and grow with our vibrant creator community. No algorithms limiting your reach—just pure, authentic storytelling.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chronicles/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Start Writing <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/chronicles/feed">
                <Button size="lg" variant="outline">
                  Explore Stories
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {/* Feature 1 */}
            <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/30 hover:shadow-lg transition">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit mb-4">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">Your Own Space</h3>
              <p className="text-muted-foreground">
                No algorithms. No limits. Publish your stories exactly how you envision them. Full control over your content and presentation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-900/30 hover:shadow-lg transition">
              <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg w-fit mb-4">
                <Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">Engaged Community</h3>
              <p className="text-muted-foreground">
                Connect with fellow creators. Receive genuine feedback through comments, likes, and shares from readers who care about your work.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/30 hover:shadow-lg transition">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">Grow & Earn</h3>
              <p className="text-muted-foreground">
                Build your audience with streak tracking, achievements, and rewards. Top creators gain exclusive opportunities and recognition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Chronicles Section */}
      <section className="py-12 md:py-20 px-4 bg-white dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Whispr Chronicles?</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-bold mb-2">Personalization Like Never Before</h3>
                <p className="text-muted-foreground">
                  Unlike Medium, you have complete creative control. Customize your profile, writing style, and how your content is presented.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <span className="text-pink-600 dark:text-pink-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-bold mb-2">Part of a Larger Ecosystem</h3>
                <p className="text-muted-foreground">
                  Your audience can explore poetry, spoken word, and other content on Whispr. Your writing drives traffic while you build your platform.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-bold mb-2">Community Recognition & Rewards</h3>
                <p className="text-muted-foreground">
                  Earn badges, climb the leaderboard, and unlock rewards. The best creators become Sub-Admins with opportunities to shape the platform.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 font-bold">4</span>
              </div>
              <div>
                <h3 className="font-bold mb-2">Monetization Opportunities</h3>
                <p className="text-muted-foreground">
                  Built-in ad network means your writing generates revenue. The more engaged your audience, the more you can earn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Writing?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join creators from around the world. Share your stories, build your audience, and grow with Whispr Chronicles.
          </p>
          <Link href="/chronicles/signup">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              Create Your Creator Account
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
