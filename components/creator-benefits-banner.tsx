'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Heart, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreatorBenefitsBannerProps {
  onOpenModal?: () => void;
  dismissible?: boolean;
}

export function CreatorBenefitsBanner({ onOpenModal, dismissible = true }: CreatorBenefitsBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-r from-primary/90 to-primary/80 dark:from-primary/95 dark:to-primary/90 rounded-2xl border border-primary/20"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-white/10 to-transparent rounded-full"
            />
            <motion.div
              animate={{ x: [0, 30, -30, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl"
            />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    <span className="text-white font-semibold text-sm uppercase tracking-wider">
                      Why Create on Whispr?
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    Your Stories Deserve to Be Heard
                  </h2>

                  <p className="text-white/90 text-base md:text-lg max-w-2xl">
                    Join a community that values creativity. Publish your work, build your audience, and grow as a creator on a platform designed for storytellers.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Heart className="w-4 h-4 text-rose-300" />
                      <span>Engaged Audience</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <TrendingUp className="w-4 h-4 text-emerald-300" />
                      <span>Growth Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <PenTool className="w-4 h-4 text-blue-300" />
                      <span>Creative Freedom</span>
                    </div>
                  </div>
                </div>

                {/* Right CTA */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={onOpenModal}
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
                  >
                    Discover Why <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Accent Line */}
          <motion.div
            animate={{ scaleX: [0, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
