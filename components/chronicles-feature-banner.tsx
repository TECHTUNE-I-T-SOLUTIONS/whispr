'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen, Users, Zap, ArrowRight, Rocket, PenTool, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ChroniclesFeatureBannerProps {
  onOpenModal?: () => void;
  dismissible?: boolean;
}

export function ChroniclesFeatureBanner({ onOpenModal, dismissible = true }: ChroniclesFeatureBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !isVisible) return null;

  const features = [
    {
      title: 'Share Your Stories',
      description: 'Create and publish your content with an audience ready to listen',
      icon: PenTool,
      color: 'from-foreground to-primary',
    },
    {
      title: 'Build Community',
      description: 'Connect with readers and creators who love your work',
      icon: Users,
      color: 'from-foreground to-primary',
    },
    {
      title: 'Grow Your Reach',
      description: 'Gain recognition and build your platform as a creator',
      icon: TrendingUp,
      color: 'from-foreground to-primary',
    },
  ];

  const currentFeature = features[activeFeature];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-r from-foreground to-primary dark:from-gray-600 dark:to-primary"
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
            <motion.div
              animate={{ x: [0, -40, 40, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"
            />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left Content */}
                <motion.div
                  key={`content-${activeFeature}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    {/* <Sparkles className="w-5 h-5 text-white animate-pulse" /> */}
                    <span className="text-white font-semibold text-sm uppercase tracking-wider">
                      Chronicles Launch
                    </span>
                  </div>

                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    {currentFeature.title}
                  </h2>

                  <p className="text-white/90 text-lg mb-8">
                    {currentFeature.description}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      asChild
                      size="lg"
                      className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
                    >
                      <Link href="/auth/signup" className="flex items-center gap-2">
                        Join Now
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      onClick={onOpenModal}
                      className="bg-white/20 text-white border border-white/30 hover:bg-white/30 font-semibold"
                    >
                      Learn More
                    </Button>
                  </div>
                </motion.div>

                {/* Right Illustration */}
                <motion.div
                  key={`illustration-${activeFeature}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center justify-center"
                >
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className={`p-12 rounded-full bg-gradient-to-br ${currentFeature.color} shadow-2xl flex items-center justify-center`}
                  >
                    <currentFeature.icon className="w-20 h-20 text-white" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Feature Indicators */}
              <div className="flex justify-between items-center mt-12">
                <div className="flex gap-3">
                  {features.map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setActiveFeature(i)}
                      className={`rounded-full transition-all ${
                        i === activeFeature
                          ? 'w-10 h-3 bg-white'
                          : 'w-3 h-3 bg-white/40 hover:bg-white/60'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                    />
                  ))}
                </div>

                {dismissible && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsVisible(false)}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Accent Line */}
          <motion.div
            animate={{ scaleX: [0, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            className="h-1 bg-gradient-to-r from-transparent via-white to-transparent origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
