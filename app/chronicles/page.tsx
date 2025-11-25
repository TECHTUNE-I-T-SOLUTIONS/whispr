'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { ChroniclesFeatureBanner } from '@/components/chronicles-feature-banner';
import { ChroniclesFeatureModal } from '@/components/chronicles-feature-modal';
import { ChroniclesCircularFeatures } from '@/components/chronicles-circular-features';
import { ChroniclesAnimatedStats } from '@/components/chronicles-animated-stats';
import { ChroniclesTestimonials } from '@/components/chronicles-testimonials';
import { ChroniclesCTA } from '@/components/chronicles-cta';

export default function ChroniclesLanding() {
  const [isClient, setIsClient] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if chronicles is enabled
    checkFeatureStatus();
  }, []);

  const checkFeatureStatus = async () => {
    try {
      const res = await fetch('/api/chronicles/settings', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Chronicles settings:', data);
        // Check for both camelCase and snake_case
        const enabled = data?.feature_enabled === true || data?.feature_enabled === 'true' || data?.featureEnabled === true;
        console.log('Feature enabled:', enabled);
        setFeatureEnabled(enabled);
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
    <main className="bg-white dark:bg-slate-950 overflow-hidden">
      {/* Feature Modal */}
      <ChroniclesFeatureModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Feature Banner */}
      <ChroniclesFeatureBanner onOpenModal={() => setModalOpen(true)} />

      {/* Circular Features Section */}
      <ChroniclesCircularFeatures />

      {/* Animated Stats Section */}
      <ChroniclesAnimatedStats />

      {/* Testimonials Section */}
      <ChroniclesTestimonials />

      {/* CTA Section */}
      <ChroniclesCTA onOpenModal={() => setModalOpen(true)} />

      {/* Footer Info */}
      <section className="py-12 px-4 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto text-center text-muted-foreground">
          <p className="mb-4">
            Ready to join the Chronicles community?
          </p>
          <Link href="/chronicles/feed" className="text-purple-600 hover:underline font-medium">
            Visit the Chronicles Feed →
          </Link>
        </div>
      </section>
    </main>
  );
}
