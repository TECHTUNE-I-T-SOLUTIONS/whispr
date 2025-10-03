"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
<<<<<<< HEAD
import { ArrowRight, Feather, BookOpen } from "lucide-react"

export function HeroSection() {
  return (
    <section className="container py-24 md:py-32">
      <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
        <div className="animate-float">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6">
            <Feather className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-slide-up">
            Welcome to Whispr
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground animate-slide-up" style={{ animationDelay: "0.2s" }}>
            ...From silence to whispers, from whispers to words
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Button asChild size="lg" className="group">
=======
import { ArrowRight, BookOpen } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"

const sparkleVariants: Variants = {
  initial: { opacity: 0, scale: 0 },
  animate: {
    opacity: [0, 1, 0],
    scale: [0, 1, 0],
    transition: {
      duration: 2, // Explicitly define duration
      ease: "easeInOut",
    },
  },
}


type Sparkle = {
  top: string
  left: string
  delay: string
}

const generateSparkles = (count = 20): Sparkle[] =>
  Array.from({ length: count }).map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 4}s`,
  }))

export function HeroSection() {
  const { theme } = useTheme()
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    setSparkles(generateSparkles())
  }, [])

  const logoSrc = hasMounted
    ? theme === "dark"
      ? "/lightlogo.png"
      : "/darklogo.png"
    : "/darklogo.png"

  return (
    <section className="relative container py-24 md:py-32 overflow-hidden">
      {/* Floating sparkles layer */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-32 -left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-20 -z-10 animate-pulse-slow" />
        <div className="absolute top-1/3 right-0 w-60 h-60 bg-pink-400 rounded-full blur-2xl opacity-10 -z-10 animate-pulse-slower" />

        {hasMounted &&
          sparkles.map((s, i) => (
            <motion.div
              key={i}
              variants={sparkleVariants}
              initial="initial"
              animate="animate"
              className="absolute w-1.5 h-1.5 rounded-full bg-primary/70 blur-sm"
              style={{
                top: s.top,
                left: s.left,
                animationDelay: s.delay,
              }}
            />
          ))}
      </div>

      {/* Glow ring behind logo */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/10 blur-3xl -z-10"></div>

      <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
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
              className="rounded-full object-cover shadow-xl ring-2 ring-primary/20"
              priority
            />
          </div>
        </motion.div>

        <div className="space-y-4 max-w-3xl">
          <motion.h1
            className="text-4xl md:text-6xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Welcome to Whispr
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            ...From silence to whispers, from whispers to words
          </motion.p>
        </div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button asChild size="lg" className="group shadow-md">
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
            <Link href="/poems">
              <BookOpen className="mr-2 h-4 w-4" />
              Explore Poems
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
<<<<<<< HEAD
          <Button asChild variant="outline" size="lg" className="bg-background text-foreground">
            <Link href="/blog">Read Blog</Link>
          </Button>
        </div>
=======
          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-background text-foreground shadow-md"
          >
            <Link href="/blog">Read Blog</Link>
          </Button>
        </motion.div>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
      </div>
    </section>
  )
}
