'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  initials: string;
  rating: number;
  color: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Anderson',
    role: 'Fiction Writer',
    content:
      'Chronicles gave me a platform to share my stories with readers worldwide. The community support is incredible!',
    initials: 'SA',
    rating: 5,
    color: 'from-foreground to-primary',
  },
  {
    id: 2,
    name: 'James Mitchell',
    role: 'Poet',
    content:
      'Finally, a space where poetry is celebrated. My work got the recognition it deserved on Chronicles.',
    initials: 'JM',
    rating: 5,
    color: 'from-foreground to-primary',
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    role: 'Content Creator',
    content:
      'The engagement on Chronicles is unlike anything I\'ve experienced. My audience here is so passionate!',
    initials: 'ER',
    rating: 5,
    color: 'from-foreground to-primary',
  },
  {
    id: 4,
    name: 'David Chen',
    role: 'Author',
    content:
      'Chronicles provided the launching pad my writing career needed. Highly recommended for all creators!',
    initials: 'DC',
    rating: 5,
    color: 'from-foreground to-primary',
  },
];

export function ChroniclesTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay]);

  if (!mounted) return null;

  const currentTestimonial = testimonials[currentIndex];
  const nextTestimonial = testimonials[(currentIndex + 1) % testimonials.length];

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-100/10 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Creators</h2>
          <p className="text-lg text-muted-foreground">
            Hear from writers and creators who are thriving on Chronicles
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main Testimonial Card */}
              <div className="grid md:grid-cols-3 gap-8 items-center">
                {/* Left - Current Testimonial */}
                <motion.div
                  className={`md:col-span-2 bg-gradient-to-br ${currentTestimonial.color} rounded-3xl p-8 md:p-12 text-white shadow-2xl`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2 + i * 0.2, repeat: Infinity }}
                      >
                        <Star className="w-5 h-5 fill-white text-white" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Content */}
                  <motion.p
                    className="text-xl md:text-2xl font-semibold mb-8 leading-relaxed italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    "{currentTestimonial.content}"
                  </motion.p>

                  {/* Author */}
                  <motion.div
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border-2 border-white/30"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {currentTestimonial.initials}
                    </motion.div>
                    <div>
                      <p className="font-bold text-lg">{currentTestimonial.name}</p>
                      <p className="text-white/80">{currentTestimonial.role}</p>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Right - Next Testimonial Preview */}
                <motion.div
                  className={`hidden md:block relative`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div
                    className={`bg-gradient-to-br ${nextTestimonial.color} rounded-2xl p-6 text-white/90 shadow-xl opacity-60 hover:opacity-100 transition-opacity cursor-pointer`}
                    onClick={handleNext}
                  >
                    <p className="text-sm mb-4 italic line-clamp-4">"{nextTestimonial.content}"</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                        {nextTestimonial.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-xs">{nextTestimonial.name}</p>
                        <p className="text-xs opacity-75">{nextTestimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12">
            <div className="flex gap-3">
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    setCurrentIndex(i);
                    setAutoPlay(false);
                  }}
                  className={`rounded-full transition-all ${
                    i === currentIndex
                      ? 'w-10 h-3 bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'w-3 h-3 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </div>

            {/* Arrow Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrev}
                className="p-3 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="p-3 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
