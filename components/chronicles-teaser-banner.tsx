'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Smartphone, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import styles from './chronicles-teaser-banner.module.css';

export function ChroniclesTeaserBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#911A1B] to-red-700 dark:from-[#6B1415] dark:to-red-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></motion.div>
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></motion.div>
      </div>

      {/* Main banner content */}
      <div className="relative z-10 px-4 py-4 md:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left content */}
            <div className="flex-1 flex items-center gap-3">
              <div
                className={`flex gap-2 transition-all duration-700 ${
                  animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}
              >
                <Smartphone className="w-6 h-6 md:w-7 md:h-7 text-white animate-bounce" />
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white animate-bounce animation-delay-200" />
                <Zap className="w-6 h-6 md:w-7 md:h-7 text-white animate-bounce animation-delay-400" />
              </div>

              <div className="flex-1">
                <h3
                  className={`text-lg md:text-xl font-bold text-white transition-all duration-700 ${
                    animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                  }`}
                >
                  Whispr Mobile App is Here!
                </h3>
                <p
                  className={`text-sm md:text-base text-white/90 transition-all duration-700 delay-200 ${
                    animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                  }`}
                >
                  Write, share, and connect <span className="font-bold">on the go</span>
                </p>
                <p
                  className={`text-sm md:text-base text-white/90 transition-all duration-700 delay-400 ${
                    animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                  }`}
                >
                  Download the Whispr app for iOS and Android. Create chronicles anytime, anywhere.
                </p>
              </div>
            </div>

            {/* Right CTA */}
            <Link
              href="/download"
              className={`flex items-center gap-2 text-white text-sm md:text-base font-semibold cursor-pointer hover:gap-3 transition-all duration-500 group bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg ${
                animate ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <span>Download Now</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Animated progress bar */}
          <div className="mt-3 md:mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full bg-white/80 rounded-full transition-all duration-1000 ${
                animate ? 'w-full' : 'w-0'
              } ${styles.shimmer}`}
            ></div>
          </div>

          {/* Hint text */}
          <p
            className={`text-xs md:text-sm text-white/70 mt-2 transition-all duration-700 delay-300 ${
              animate ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Join our creator community. Start writing your chronicles today!
          </p>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 md:top-4 md:right-4 text-white/70 hover:text-white transition-colors z-20"
        aria-label="Close banner"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
