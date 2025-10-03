"use client"

<<<<<<< HEAD
import { PenTool, BookOpen } from "lucide-react"

export function BlogHero() {
  return (
    <section className="container py-16 md:py-24">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="animate-float">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-6">
            <PenTool className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-slide-up">
            Thoughts & Musings
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Where Prayce shares her insights on writing, creativity, and the beautiful complexity of life through
            thoughtful prose.
          </p>
        </div>

        <div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <BookOpen className="h-4 w-4" />
          <span>Stories that whisper wisdom</span>
        </div>
=======
import Image from "next/image"
import { BookOpen } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function BlogHero() {
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
          <div className="h-40 w-40 relative mx-auto mb-6">
            <Image
              src={logoSrc}
              alt="Whispr logo"
              fill
              className="rounded-full object-cover shadow-md"
              priority
            />
          </div>
        </motion.div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <motion.h1
            className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Thoughts & Musings
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Prayce's insights on writing, creativity, and the beautiful complexity of life through
            thoughtful prose.
          </motion.p>
        </div>

        <motion.div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <BookOpen className="h-4 w-4" />
          <span>Stories that whisper wisdom</span>
        </motion.div>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
      </div>
    </section>
  )
}
