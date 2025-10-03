"use client"

import Image from "next/image"
import { Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function PoemsHero() {
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
    <section className="container py-16 md:py-24">
      <div className="text-center space-y-6 animate-fade-in">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-40 w-40 relative mx-auto mb-6 shadow-lg shadow-primary/20 rounded-full overflow-hidden">
            <Image
              src={logoSrc}
              alt="Whispr Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
        </motion.div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <motion.h1
            className="text-4xl md:text-6xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Poetry Collection
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground font-serif italic"
            style={{ animationDelay: "0.2s" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            "In every whisper lies a poem waiting to be heard, in every silence, a verse yearning to be born."
          </motion.p>

          <motion.p
            className="text-base text-muted-foreground"
            style={{ animationDelay: "0.3s" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            — Prayce's collection of verses that dance between heartbeats and breathe life into quiet moments
          </motion.p>
        </div>

        <motion.div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          style={{ animationDelay: "0.4s" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>...words become whispers, and whispers become poetry</span>
          <Sparkles className="h-4 w-4 text-primary" />
        </motion.div>
      </div>
    </section>
  )
}
