'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ChronicleCTAProps {
  onOpenModal?: () => void;
}

export function ChroniclesCTA({ onOpenModal }: ChronicleCTAProps) {
  const floatingIcons = [BookOpen, BookOpen, Sparkles, Zap, ArrowRight, BookOpen];

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-primary/5 dark:from-foreground/10 dark:via-transparent dark:to-primary/10" />

      {/* Floating Icons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((IconComponent, i) => (
          <motion.div
            key={i}
            className="absolute opacity-10 text-primary"
            initial={{
              x: Math.random() * 100 + '%',
              y: -50,
              rotate: 0,
            }}
            animate={{
              y: '100vh',
              rotate: 360,
            }}
            transition={{
              duration: 10 + i,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.5,
            }}
          >
            <IconComponent className="w-12 h-12" />
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative max-w-4xl mx-auto text-center z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 mb-6"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            Ready to start your journey?
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
        >
          Share Your{' '}
          <motion.span
            className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            Stories
          </motion.span>{' '}
          with the World
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Join thousands of creators building their audience on Chronicles. Publish instantly, engage with readers,
          and grow your following.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-foreground to-primary hover:shadow-xl text-white font-semibold px-8 shadow-lg transition-all"
            >
              <Link href="/auth/signup" className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Start Creating
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onOpenModal}
              size="lg"
              variant="outline"
              className="font-semibold px-8 hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Learn More
            </Button>
          </motion.div>
        </motion.div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="grid sm:grid-cols-3 gap-8 mt-16 pt-16 border-t border-gray-200 dark:border-slate-800"
        >
          {[
            { Icon: BookOpen, text: 'Easy Publishing' },
            { Icon: Sparkles, text: 'Engaged Community' },
            { Icon: ArrowRight, text: 'Growth Analytics' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="flex flex-col items-center"
            >
              <feature.Icon className="w-10 h-10 mb-3 text-primary" />
              <p className="font-semibold">{feature.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Decorative Circles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-foreground/10 to-primary/10 rounded-full blur-3xl -mr-48 pointer-events-none"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-to-tr from-foreground/10 to-primary/10 rounded-full blur-3xl -ml-48 pointer-events-none"
      />
    </section>
  );
}
