'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Home, ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

const NotFound: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
    },
  };

  const quickLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/whispr-wall', label: 'Whispr Wall', icon: Search },
    { href: '/blog', label: 'Blog', icon: Compass },
  ];

  // Predefined positions for decorative elements to avoid hydration mismatch
  const decorativeElements = [
    { x: '16.7%', y: '4.9%', delay: 0 },
    { x: '21.9%', y: '70.2%', delay: 0.5 },
    { x: '38.6%', y: '68.5%', delay: 1 },
    { x: '59.4%', y: '13.9%', delay: 1.5 },
    { x: '91.4%', y: '79.9%', delay: 2 },
    { x: '28.9%', y: '20.0%', delay: 2.5 },
    { x: '84.4%', y: '11.5%', delay: 3 },
    { x: '85.0%', y: '25.9%', delay: 3.5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        className="max-w-2xl w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-8"
        >
          <motion.div
            variants={floatingVariants}
            animate="animate"
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative w-[100px] h-[100px]"
          >
            {/* Light theme logo */}
            <Image
              src="/lightlogo.png"
              alt="Whispr Logo"
              width={100}
              height={100}
              className="dark:hidden w-full h-full object-contain"
            />
            {/* Dark theme logo */}
            <Image
              src="/darklogo.png"
              alt="Whispr Logo"
              width={100}
              height={100}
              className="hidden dark:block w-full h-full object-contain"
            />
          </motion.div>
        </motion.div>

        {/* 404 Number */}
        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <motion.h1
            className="text-8xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            404
          </motion.h1>
          <motion.div
            className="w-24 h-1 bg-primary mx-auto rounded-full"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
        </motion.div>

        {/* Title and Description */}
        <motion.h2
          variants={itemVariants}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-3xl font-bold mb-4"
        >
          Page Not Found
        </motion.h2>

        <motion.p
          variants={itemVariants}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-lg text-muted-foreground mb-8 max-w-md mx-auto"
        >
          The page you're looking for seems to have wandered off into the digital wilderness.😉
          Let's get you back on track!
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Button asChild size="lg" className="min-w-[140px]">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="min-w-[140px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
            {quickLinks.map((link, index) => (
              <motion.div
                key={link.href}
                variants={itemVariants}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={link.href}
                  className="block p-4 bg-card/50 hover:bg-card border rounded-lg transition-colors group"
                >
                  <link.icon className="w-6 h-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Fun Message */}
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground italic">
            "Not all who wander are lost... but this page definitely is! 😊"
          </p>
        </motion.div>

        {/* Decorative Elements - Only render on client to avoid hydration mismatch */}
        {isClient && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {decorativeElements.map((element, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/10 rounded-full"
                initial={{
                  x: element.x,
                  y: element.y,
                  opacity: 0
                }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  delay: element.delay,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 4
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NotFound;
