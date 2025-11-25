'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles, BookOpen, Users, Zap, PenTool, MessageSquare, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'writers' | 'community' | 'showcase' | 'all';
}

export function ChroniclesFeatureModal({ isOpen, onClose, feature = 'all' }: FeatureModalProps) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      id: 'writers',
      title: 'For Writers & Creators',
      subtitle: 'Share your voice with the world',
      description: 'Create a profile, publish your stories, poems, and articles. Build your audience and establish yourself as a creator.',
      icon: PenTool,
      color: 'from-foreground to-primary',
      highlights: ['Publish instantly', 'Track engagement', 'Build audience'],
    },
    {
      id: 'community',
      title: 'Engage & Connect',
      subtitle: 'Join a thriving community',
      description: 'Like, comment, and share stories with other creators. Discover new voices and perspectives.',
      icon: MessageSquare,
      color: 'from-foreground to-primary',
      highlights: ['Direct feedback', 'Collaboration', 'Network growth'],
    },
    {
      id: 'showcase',
      title: 'Showcase Your Talent',
      subtitle: 'Let your work shine',
      description: 'Gain exposure, build your portfolio, and create opportunities. Your stories deserve to be heard.',
      icon: TrendingUp,
      color: 'from-foreground to-primary',
      highlights: ['Visibility boost', 'Analytics', 'Recognition'],
    },
  ];

  const currentFeature = features[activeFeature];
  const Icon = currentFeature.icon;

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl"
          >
            {/* Main Content Container with organic shape */}
            <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl">
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl -ml-20 -mb-20" />

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 p-8 md:p-12">
                {/* Header */}
                <motion.div
                  key={`header-${activeFeature}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          className={`p-3 rounded-full bg-gradient-to-br ${currentFeature.color} text-white`}
                        >
                          <Icon className="w-6 h-6" />
                        </motion.div>
                        <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold mb-2">{currentFeature.title}</h2>
                      <p className="text-lg text-muted-foreground">{currentFeature.subtitle}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Illustration Circle */}
                <motion.div
                  key={`illustration-${activeFeature}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className={`mb-8 p-8 rounded-full bg-gradient-to-br ${currentFeature.color} shadow-lg inline-block`}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Icon className="w-16 h-16 text-white" />
                  </motion.div>
                </motion.div>

                {/* Description */}
                <motion.p
                  key={`desc-${activeFeature}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-base md:text-lg text-foreground mb-8 max-w-md"
                >
                  {currentFeature.description}
                </motion.p>

                {/* Highlights */}
                <motion.div
                  key={`highlights-${activeFeature}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-3 gap-4 mb-8"
                >
                  {currentFeature.highlights.map((highlight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{highlight}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Feature Navigation Dots and Arrows */}
                <div className="flex items-center justify-between mb-8">
                  <motion.button
                    onClick={() => setActiveFeature((activeFeature - 1 + features.length) % features.length)}
                    whileHover={{ scale: 1.1, x: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full bg-gradient-to-r from-foreground to-primary text-white hover:shadow-lg transition-shadow"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>

                  <div className="flex gap-2">
                    {features.map((_, i) => (
                      <motion.button
                        key={i}
                        onClick={() => setActiveFeature(i)}
                        className={`rounded-full transition-all ${
                          i === activeFeature
                            ? `w-8 h-8 bg-gradient-to-r ${currentFeature.color}`
                            : 'w-3 h-3 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                      />
                    ))}
                  </div>

                  <motion.button
                    onClick={() => setActiveFeature((activeFeature + 1) % features.length)}
                    whileHover={{ scale: 1.1, x: 4 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full bg-gradient-to-r from-foreground to-primary text-white hover:shadow-lg transition-shadow"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>

                  {/* Step Indicator */}
                  <span className="text-sm font-medium text-muted-foreground absolute right-8 -bottom-10">
                    {activeFeature + 1} / {features.length}
                  </span>
                </div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4 mt-12"
                >
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-foreground to-primary text-white hover:shadow-lg transition-shadow"
                  >
                    <Link href="/auth/signup" className="flex items-center gap-2">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="flex-1"
                  >
                    <Link href="/chronicles/feed">
                      Explore Feed
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
