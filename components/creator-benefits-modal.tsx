'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle, Users, Globe, Zap, Heart, BookOpen, Shield, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CreatorBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatorBenefitsModal({ isOpen, onClose }: CreatorBenefitsModalProps) {
  const [activeBenefit, setActiveBenefit] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const benefits = [
    {
      id: 'audience',
      title: 'Built-in Audience',
      subtitle: 'Readers who want to discover you',
      description: 'Whispr brings together readers actively looking for new stories and creators. Your work gets discovered by people who appreciate quality content.',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      highlights: [
        'Active reader community',
        'Content discovery algorithms',
        'Genre-based matching',
        'Recommendation features'
      ],
      detailedReason: "Unlike posting on social media where your content gets lost in the noise, Whispr is purpose-built for readers to find and follow creators they love."
    },
    {
      id: 'ownership',
      title: 'You Own Your Work',
      subtitle: 'Full creative control & ownership',
      description: 'Maintain complete ownership of your content. We provide the platform, but your stories remain yours. No restrictive contracts or hidden clauses.',
      icon: Shield,
      color: 'from-emerald-500 to-teal-500',
      highlights: [
        'Retain all rights',
        'No exclusive contracts',
        'Delete anytime',
        'Export your content'
      ],
      detailedReason: "Your creative work belongs to you. We believe creators should have full control over their stories, not locked into restrictive platforms."
    },
    {
      id: 'engagement',
      title: 'Genuine Engagement',
      subtitle: 'Connect with readers who care',
      description: 'Build meaningful relationships with your audience through comments, likes, and follows. Get feedback that helps you grow as a writer.',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      highlights: [
        'Thoughtful comments',
        'Reader feedback',
        'Community support',
        'Direct connection'
      ],
      detailedReason: "Engagement on Whispr is about quality, not quantity. Connect with readers who genuinely appreciate your work and want to see you succeed."
    },
    {
      id: 'growth',
      title: 'Grow Your Platform',
      subtitle: 'Analytics and insights included',
      description: 'Track your performance with detailed analytics. Understand what resonates with your audience and make data-driven decisions to grow your reach.',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-500',
      highlights: [
        'Readership analytics',
        'Engagement metrics',
        'Growth tracking',
        'Performance insights'
      ],
      detailedReason: "Understanding your audience is key to growth. Our analytics help you see what works, so you can focus on creating content that resonates."
    },
    {
      id: 'tools',
      title: 'Creator-First Tools',
      subtitle: 'Everything you need to succeed',
      description: 'Write, edit, and publish with intuitive tools designed for creators. From drafting to distribution, we streamline your creative process.',
      icon: Zap,
      color: 'from-red-500 to-violet-500',
      highlights: [
        'Easy publishing',
        'Rich text editor',
        'Media support',
        'Mobile-friendly'
      ],
      detailedReason: "Great tools shouldn't get in the way of creativity. Our platform is designed to be intuitive so you can focus on what matters—your stories."
    },
    {
      id: 'community',
      title: 'Supportive Community',
      subtitle: 'You\'re never creating alone',
      description: 'Join a network of fellow writers and creators. Share experiences, get advice, and grow together in an environment that values creativity.',
      icon: Globe,
      color: 'from-indigo-500 to-blue-500',
      highlights: [
        'Creator forums',
        'Networking opportunities',
        'Collaboration features',
        'Mentorship programs'
      ],
      detailedReason: "The journey of a creator can be lonely, but it doesn't have to be. Our community is built to support, encourage, and celebrate each other's success."
    }
  ];

  const currentBenefit = benefits[activeBenefit];
  const Icon = currentBenefit.icon;

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Main Content Container */}
            <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl">
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-200/20 to-pink-200/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

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
                  key={`header-${activeBenefit}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className={`p-3 rounded-full bg-gradient-to-br ${currentBenefit.color} text-white`}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>
                    <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Creator Benefits
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">{currentBenefit.title}</h2>
                  <p className="text-lg text-muted-foreground">{currentBenefit.subtitle}</p>
                </motion.div>

                {/* Description */}
                <motion.p
                  key={`desc-${activeBenefit}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-base md:text-lg text-foreground mb-6"
                >
                  {currentBenefit.description}
                </motion.p>

                {/* Detailed Reason */}
                <motion.div
                  key={`detailed-${activeBenefit}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-primary/5 border border-primary/10 rounded-xl p-6 mb-8"
                >
                  <p className="text-sm md:text-base text-foreground italic">
                    "{currentBenefit.detailedReason}"
                  </p>
                </motion.div>

                {/* Highlights */}
                <motion.div
                  key={`highlights-${activeBenefit}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    What You Get
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentBenefit.highlights.map((highlight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-sm font-medium">{highlight}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Feature Navigation */}
                <div className="flex items-center justify-between mb-8">
                  <motion.button
                    onClick={() => setActiveBenefit((activeBenefit - 1 + benefits.length) % benefits.length)}
                    whileHover={{ scale: 1.1, x: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full bg-gradient-to-r from-foreground to-primary text-white hover:shadow-lg transition-shadow"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>

                  <div className="flex gap-2">
                    {benefits.map((_, i) => (
                      <motion.button
                        key={i}
                        onClick={() => setActiveBenefit(i)}
                        className={`rounded-full transition-all ${
                          i === activeBenefit
                            ? `w-8 h-8 bg-gradient-to-r ${currentBenefit.color}`
                            : 'w-3 h-3 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                      />
                    ))}
                  </div>

                  <motion.button
                    onClick={() => setActiveBenefit((activeBenefit + 1) % benefits.length)}
                    whileHover={{ scale: 1.1, x: 4 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full bg-gradient-to-r from-foreground to-primary text-white hover:shadow-lg transition-shadow"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-foreground to-primary text-white hover:opacity-90 font-semibold flex-1"
                  >
                    <Link href="/chronicles/signup" className="flex items-center justify-center gap-2">
                      Start Creating Today <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Maybe Later
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
