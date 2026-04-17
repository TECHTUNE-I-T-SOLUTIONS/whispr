'use client';

import { motion } from 'framer-motion';
import { BookOpen, Users, TrendingUp, Zap, Share2, Award, Shield, Lightbulb, PenTool, MessageSquare, Rocket, Target } from 'lucide-react';

interface CircularFeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

function CircularFeatureCard({ title, description, icon, color, delay = 0 }: CircularFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="flex flex-col items-center text-center group cursor-pointer"
    >
      {/* Circular Background */}
      <motion.div
        className={`relative w-40 h-40 rounded-full bg-gradient-to-br ${color} shadow-xl mb-6 flex items-center justify-center overflow-hidden group-hover:shadow-2xl transition-shadow`}
        whileHover={{
          boxShadow: `0 20px 40px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Animated Background Elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />

        {/* Pulsing Ring */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-2 rounded-full border-2 border-white/20"
        />

        {/* Icon or Emoji */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10"
        >
          {icon}
        </motion.div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      </motion.div>
    </motion.div>
  );
}

export function ChroniclesCircularFeatures() {
  const features = [
    {
      title: 'Create & Share',
      description: 'Publish your stories, poems, and thoughts instantly',
      icon: <PenTool className="w-8 h-8 text-white" />,
      color: 'from-foreground to-primary',
    },
    {
      title: 'Engage',
      description: 'Like, comment, and connect with other creators',
      icon: <MessageSquare className="w-8 h-8 text-white" />,
      color: 'from-foreground to-primary',
    },
    {
      title: 'Grow',
      description: 'Track analytics and build your audience',
      icon: <TrendingUp className="w-8 h-8 text-white" />,
      color: 'from-foreground to-primary',
    },
    {
      title: 'Inspire',
      description: 'Share your voice and inspire millions',
      icon: <Lightbulb className="w-8 h-8 text-white" />,
      color: 'from-foreground to-primary',
    },
    {
      title: 'Collaborate',
      description: 'Team up with other writers and creators',
      icon: <Share2 className="w-8 h-8 text-white" />,
      color: 'from-foreground to-primary',
    },
    {
      title: 'Achieve',
      description: 'Get recognized for your unique voice',
      icon: <Award className="w-8 h-8 text-white" />,
      color: 'from-foreground to-primary',
    },
  ];

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-full mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Chronicles Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to become a successful creator and build your audience
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
          {features.map((feature, index) => (
            <CircularFeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
              delay={index * 0.1}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
