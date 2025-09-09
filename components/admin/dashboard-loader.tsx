"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Loader2, CheckCircle, Sparkles, Heart } from "lucide-react"

interface DashboardLoaderProps {
  onComplete: () => void
}

export function DashboardLoader({ onComplete }: DashboardLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { label: "Authenticating session...", icon: CheckCircle, duration: 800 },
    { label: "Preparing your dashboard...", icon: Sparkles, duration: 1000 },
    { label: "Loading your content...", icon: Heart, duration: 800 },
    { label: "Almost ready...", icon: Loader2, duration: 600 },
  ]

  useEffect(() => {
    let totalDuration = 0
    const stepDurations = steps.map(step => step.duration)
    const cumulativeDurations = stepDurations.reduce((acc, duration, index) => {
      acc.push((acc[index - 1] || 0) + duration)
      return acc
    }, [] as number[])

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2
        const currentStepIndex = cumulativeDurations.findIndex(duration => newProgress <= duration)
        setCurrentStep(currentStepIndex === -1 ? steps.length - 1 : currentStepIndex)

        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500) // Small delay before completing
          return 100
        }
        return newProgress
      })
    }, 50)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-card/95 backdrop-blur-sm border rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <Image
            src="/lightlogo.png"
            alt="Whispr Logo"
            width={80}
            height={80}
            className="dark:hidden"
          />
          <Image
            src="/darklogo.png"
            alt="Whispr Logo"
            width={80}
            height={80}
            className="hidden dark:block"
          />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
        >
          Welcome back! 🎉
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-center mb-8"
        >
          Preparing your creative dashboard...
        </motion.p>

        {/* Current Step */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex items-center justify-center mb-6"
        >
          <motion.div
            animate={{
              rotate: currentStep === steps.length - 1 ? 360 : 0,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity }
            }}
            className="mr-3"
          >
            {React.createElement(steps[currentStep].icon, {
              className: `h-6 w-6 ${
                currentStep === steps.length - 1
                  ? "text-primary animate-spin"
                  : "text-green-500"
              }`
            })}
          </motion.div>
          <span className="text-sm font-medium">{steps[currentStep].label}</span>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* Calming Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground italic">
            "Take a deep breath... your creative space is almost ready ✨"
          </p>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full"
              initial={{
                x: Math.random() * 100 + "%",
                y: "100%",
                opacity: 0
              }}
              animate={{
                y: "-100%",
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
