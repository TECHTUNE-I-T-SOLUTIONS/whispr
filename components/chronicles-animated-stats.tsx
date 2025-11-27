'use client';

import { motion } from 'framer-motion';
import { Users, BookOpen, Heart, Zap } from 'lucide-react';
import React from 'react';

interface ProjectionCardProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

function ProjectionCard({ label, description, icon, delay = 0 }: ProjectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="relative group"
    >
      {/* Holographic border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/20 via-primary/20 to-foreground/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
      
      {/* Card */}
      <div className="relative p-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-background to-background/50 dark:from-slate-900/50 dark:to-slate-900/30 backdrop-blur-sm hover:border-primary/50 transition-all group-hover:shadow-xl group-hover:shadow-primary/20">
        {/* Animated corner accent */}
        <motion.div
          className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/50 rounded-tl-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/50 rounded-br-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        />

        {/* Icon */}
        <motion.div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-foreground to-primary flex items-center justify-center mb-6 shadow-lg"
          animate={{
            y: [0, -8, 0],
            boxShadow: ['0 10px 20px rgba(0,0,0,0.1)', '0 20px 40px rgba(0,132,204,0.3)', '0 10px 20px rgba(0,0,0,0.1)'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {icon}
        </motion.div>

        {/* Content */}
        <h3 className="text-xl font-bold mb-2 text-foreground">{label}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

        {/* Animated line */}
        <motion.div
          className="mt-4 h-1 bg-gradient-to-r from-foreground to-primary rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.3, duration: 1 }}
        />
      </div>
    </motion.div>
  );
}

export function ChroniclesAnimatedStats() {
  const projections = [
    {
      label: 'Platform Ready',
      description: 'Chronicles is in development. Our team is crafting the ultimate writing platform to empower creators worldwide.',
      icon: <Zap className="w-8 h-8 text-white" />,
    },
    {
      label: 'Creator Focused',
      description: 'We\'re building tools designed specifically for writers, poets, and storytellers to share their voice.',
      icon: <Users className="w-8 h-8 text-white" />,
    },
    {
      label: 'Launch Coming',
      description: 'Be among the first to join when we launch. Sign up now to get early access to Chronicles.',
      icon: <BookOpen className="w-8 h-8 text-white" />,
    },
    {
      label: 'Community First',
      description: 'We\'re building a passionate community where every creator\'s voice matters and is celebrated.',
      icon: <Heart className="w-8 h-8 text-white" />,
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-transparent to-foreground/5 dark:to-foreground/10 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,84,204,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,84,204,0.03)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 font-mono text-sm"
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-primary"
            />
            <span className="text-primary font-semibold">Coming Soon</span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            The Future Awaits
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Chronicles is being carefully crafted to revolutionize how creators share their stories. We're building something special for you.
          </p>
        </motion.div>

        {/* Projections Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {projections.map((projection, index) => (
            <ProjectionCard
              key={index}
              label={projection.label}
              description={projection.description}
              icon={projection.icon}
              delay={index * 0.15}
            />
          ))}
        </div>

        {/* Timeline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative p-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-background to-background/50 dark:from-slate-900/50 dark:to-slate-900/30 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3">Ready to Shape the Future?</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Join thousands of creators who are waiting to launch their stories on Chronicles. Sign up today for exclusive early access.
              </p>
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center gap-2 text-primary font-semibold cursor-pointer group"
              >
                <span>Get Early Access</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.div>
            </div>

            {/* Animated graphic */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="w-48 h-48 rounded-full bg-gradient-to-br from-foreground/10 to-primary/20 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl"
              >
                ✨
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 -right-32 w-96 h-96 bg-gradient-to-br from-foreground/10 to-primary/15 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-primary/10 to-foreground/10 rounded-full blur-3xl pointer-events-none"
        />
      </motion.div>
    </section>
  );
}
