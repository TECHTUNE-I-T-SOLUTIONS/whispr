'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  PenTool, 
  BookOpen, 
  TrendingUp, 
  Heart, 
  Zap, 
  Users, 
  Lightbulb,
  ArrowRight,
  ChevronDown,
  Globe,
  Mic,
  Shield,
  Loader2,
  ExternalLink,
  MessageSquare,
  Edit3,
  Newspaper,
  Home,
  Target
} from 'lucide-react';
import Image from 'next/image';

interface TrendingTopic {
  id: string;
  topic: string;
  frequency: number;
  uniqueSources: number;
  trendScore: number;
  sampleArticles?: Array<{
    title: string;
    url: string;
  }>;
}

export default function WelcomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fetch trending topics from RSS
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/rss/trending?limit=6');
        if (response.ok) {
          const data = await response.json();
          setTrendingTopics(data.topics || []);
        }
      } catch (error) {
        console.error('Failed to fetch trending topics:', error);
      } finally {
        setLoadingTrending(false);
      }
    };

    fetchTrending();
  }, []);

  const sections = [
    {
      icon: <Globe className="w-12 h-12" />,
      title: "Know the World",
      description: "Stay connected with global events, trending topics, and stories that matter. From a single platform, access curated news and insights from trusted sources worldwide.",
      gradient: "from-primary to-primary/70"
    },
    {
      icon: <PenTool className="w-12 h-12" />,
      title: "Write Your Truth",
      description: "Express yourself through poems, chronicles, and stories. Your voice matters, and here it finds its home. Every word you write is yours alone.",
      gradient: "from-primary to-primary/60"
    },
    {
      icon: <Lightbulb className="w-12 h-12" />,
      title: "AI as Your Companion",
      description: "Not a replacement, but a whisper in your ear. Our AI assistants help when you're stuck, suggest improvements, and guide you without taking over your creativity.",
      gradient: "from-primary to-primary/50"
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Your Work, Your Legacy",
      description: "No one claims your creativity. A whispr cannot exist without the person who creates it. You own every word, every idea, every masterpiece.",
      gradient: "from-primary to-primary/40"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/10 to-primary/5 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-full blur-xl opacity-50" />
                <Image src="/lightlogo.png" alt="Whispr" width={80} height={80} className="w-40 h-40 text-primary relative z-10" />
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
            >
              Whispr
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl md:text-3xl text-slate-700 dark:text-slate-300 mb-8 max-w-3xl mx-auto"
            >
              Where we help you find your voice
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <a href="/chronicles/new" className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center">
                Start Writing
              </a>
              <a href="/chronicles" className="px-8 py-4 border-2 border-border rounded-full font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-300 text-center">
                Explore Stories
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-8 h-8 text-muted-foreground animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* AI Philosophy Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              Whispr as Your Creative Partner
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Not a replacement for your creativity, but a companion that helps you become a better writer
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  When You're Stuck
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Staring at a blank page? Our AI detects when you need inspiration and suggests ideas, 
                improvements, and directions. It doesn't write for you — it helps you find what you want to say.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Real-Time Guidance
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                As you write, our assistant provides gentle suggestions on structure, vocabulary, and expression. 
                Like a thoughtful editor who knows when to speak and when to let you shine.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  We Check On You
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                When you've been silent for too long, our assistant reaches out. Not to nag, but to ask if 
                everything is okay. Voice your concerns, and we'll help you overcome challenges — like a friend would.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Your Work, Your Legacy
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                No one claims your creativity. A whispr cannot exist without the person who creates it. 
                You own every word, every idea, every masterpiece. We're here to help, not to take over.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Topics Section */}
      <section className="py-24 px-6 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full text-primary text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" />
              Live from RSS Feeds
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              What's Trending Now
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Real-time topics from trusted sources worldwide
            </p>
          </motion.div>

          {loadingTrending ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : trendingTopics.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingTopics.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        #{index + 1}
                      </span>
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{topic.uniqueSources} sources</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white capitalize">
                    {topic.topic.length > 20 ? topic.topic.substring(0, 20) + '...' : topic.topic}
                  </h3>
                  {topic.sampleArticles && topic.sampleArticles.length > 0 && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                      {topic.sampleArticles[0]?.title || ''}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>{topic.frequency} mentions</span>
                    <span className="text-primary font-medium">
                      {Math.round(topic.trendScore * 100)}% trend
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <p>No trending topics available at the moment</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mt-8"
          >
            <a href="/api/rss/trending" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all">
              View All Trends
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-24 px-6 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              What Whispr Offers
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className={`p-4 bg-gradient-to-r ${section.gradient} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                    <div className="text-white text-center justify-center flex items-center">
                      {section.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    {section.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-12 text-primary-foreground"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              No One is Alone Here
            </h2>
            <div className="space-y-4 text-lg leading-relaxed opacity-90">
              <p>
                AI is good, and yes, overreliance on it can be bad. But what if Whispr's AI is by your side to whisper 
                and help you get better? Instead of asking AI to give you the contents, how about you try 
                to be smart too and attempt writing for real?
              </p>
              <p>
                If you aren't too confident, we have tools in place to help you. When you get too silent over 
                some time, our assistants check up on you and ask what the problem could be. You can voice your 
                concern, and even if they can't completely replace humans, they help you overcome whatever 
                challenges there are, just like a friend would.
              </p>
              <p>
                Here on Whispr, no one is alone. No one CAN'T be alone. As long as you have even a tiny amount 
                of will, you can be better. And yes, even with the help of AI, we won't let you rely too much 
                on it. You'll have to write every word, at least some words.
              </p>
              <p className="font-semibold">
                If you're lost for words? Relax, we're here. We won't take over, but we'll help you with some 
                of the missing pieces, ones you need to find your way to the rest of the puzzle.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Writer Types Section */}
      <section className="py-24 px-6 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              What Kind of Writer Are You?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Whispr is for everyone who wants to express themselves
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <BookOpen className="w-8 h-8" />, title: "Storyteller", desc: "Craft narratives that captivate and inspire" },
              { icon: <Mic className="w-8 h-8" />, title: "Poet", desc: "Express emotions through verse and rhythm" },
              { icon: <PenTool className="w-8 h-8" />, title: "Blogger", desc: "Share your thoughts with the world" },
              { icon: <TrendingUp className="w-8 h-8" />, title: "Journalist", desc: "Report on what matters in your world" },
              { icon: <Edit3 className="w-8 h-8" />, title: "Creative Writer", desc: "Explore fiction and imaginative worlds" },
              { icon: <Users className="w-8 h-8" />, title: "Community Voice", desc: "Connect with others through shared stories" },
            ].map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center cursor-pointer hover:shadow-2xl transition-all"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-to-r from-primary to-primary/70 rounded-xl text-primary-foreground">
                    {type.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                  {type.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {type.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Vision */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full text-primary text-sm font-medium mb-6">
              <Target className="w-4 h-4" />
              Coming Soon
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              The Future of Whispr
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Soon, Whispr will be a home and a workplace where you work and earn from it too. 
              We're building a platform where your creativity isn't just expressed, it's valued.
            </p>
            <a href="/chronicles" className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2">
              Join the Journey
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto max-w-4xl text-center text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Find Your Voice?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Start your journey today. Your first whispr is waiting to be written.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/chronicles/waitlist" className="px-8 py-4 bg-background text-foreground rounded-full font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center">
                Create Free Account
              </a>
              <a href="/chronicles" className="px-8 py-4 border-2 border-primary-foreground rounded-full font-semibold hover:bg-primary-foreground/10 transition-all duration-300 text-center">
                Explore Whisprs
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
