"use client"

import { Quote, PenTool, Briefcase, TrendingUp } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function AboutHero() {
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const logoSrc = hasMounted
    ? theme === "dark"
      ? "/lightlogo.png"
      : "/darklogo.png"
    : "/darklogo.png"

  return (
    <section className="w-full py-16 md:py-24 px-4">
      <div className="max-w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <motion.div
                className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="h-4 w-4 rounded-full bg-primary/60"></div>
                <span className="text-sm font-medium text-primary">The Voice of Creators</span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Whispr: Where Your Voice Becomes Your Strength
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-muted-foreground max-w-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                A revolutionary platform that empowers writers, poets, artists, and creators to share their authentic voice, build their personal brand, and earn rewards for their passion.
              </motion.p>
            </div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Quote className="absolute -top-2 -left-2 h-6 w-6 text-primary/30" />
              <blockquote className="font-serif text-lg italic text-muted-foreground pl-6 border-l-4 border-primary/30">
                "From silence to whispers, from whispers to words—turning your unique perspective into your most valuable asset."
              </blockquote>
            </motion.div>

            <motion.div
              className="flex flex-wrap gap-6 pt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div 
                className="flex items-center gap-3 text-sm"
                whileHover={{ scale: 1.05, x: 5 }}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <PenTool className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Write & Create</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 text-sm"
                whileHover={{ scale: 1.05, x: 5 }}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Build Your Portfolio</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 text-sm"
                whileHover={{ scale: 1.05, x: 5 }}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Earn & Grow</span>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className="animate-slide-up"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl transform rotate-3"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-primary/10 to-transparent rounded-3xl -rotate-2"></div>
              <div className="relative bg-card/80 backdrop-blur p-8 rounded-3xl border border-border/50 shadow-2xl">
                <div className="flex items-center justify-center h-64 w-64 mx-auto rounded-2xl overflow-hidden mb-6 shadow-lg ring-4 ring-primary/10 bg-gradient-to-br from-background to-background/50">
                  <Image
                    src={logoSrc}
                    alt="Whispr Logo"
                    width={256}
                    height={256}
                    className="object-cover transition-all duration-300"
                    priority
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-serif text-3xl font-bold mb-3">Whispr</h3>
                  <p className="text-lg text-primary font-semibold mb-2">"Your Voice, Your Way"</p>
                  <p className="text-muted-foreground text-sm">
                    Empower your creativity. Build your community. Own your success.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
