"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Brain, Cpu, MessageSquareCode, ShieldCheck, Heart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const PILLARS = [
  {
    id: "assist",
    title: "AI May Assist",
    icon: Sparkles,
    color: "from-amber-500 to-primary",
    bgColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
    activeBorderColor: "rgb(245, 158, 11)",
    description: "AI helps with the mechanics of writing—drafting, grammar, and phrasing—speeding up your workflow without replacing your perspective.",
    detail: "Use AI to format lists, summarize long passages, or draft initial outlines. You direct the layout; the system handles the manual lifting."
  },
  {
    id: "explain",
    title: "AI May Explain",
    icon: Brain,
    color: "from-blue-500 to-primary",
    bgColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.3)",
    activeBorderColor: "rgb(59, 130, 246)",
    description: "AI breaks down complex subjects, metaphors, or styles to expand your knowledge base as you write.",
    detail: "Stuck on a historical context or scientific concept? Let the AI explain it in simple terms, allowing you to incorporate rich factual details seamlessly."
  },
  {
    id: "suggest",
    title: "AI May Suggest",
    icon: Cpu,
    color: "from-emerald-500 to-primary",
    bgColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    activeBorderColor: "rgb(16, 185, 129)",
    description: "AI offers stylistic alternatives, vocabulary enhancements, and dynamic plot directions.",
    detail: "Find different ways to describe a scene, rewrite a sentence for flow, or brainstorm character actions. You filter and choose only what fits your taste."
  },
  {
    id: "critique",
    title: "AI May Critique",
    icon: MessageSquareCode,
    color: "from-red-500 to-primary",
    bgColor: "rgba(139, 92, 246, 0.1)",
    borderColor: "rgba(139, 92, 246, 0.3)",
    activeBorderColor: "rgb(139, 92, 246)",
    description: "AI analyzes structural flow, pacing, and tone to help you identify weaknesses in your drafts.",
    detail: "Get constructive feedback on character development, plot holes, or tonal inconsistency before sharing your work with the community."
  }
]

export function ControlSystemSection() {
  const [activePillar, setActivePillar] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) return null

  // Angle step for positioning the 4 satellite nodes in a semi-circle or circle
  const getPosition = (index: number) => {
    const total = PILLARS.length
    const angle = (index * (360 / total) * Math.PI) / 180
    const radius = 130 // px
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    return { x, y }
  }

  const activeData = PILLARS[activePillar]
  const ActiveIcon = activeData.icon

  return (
    <section className="relative py-24 overflow-hidden w-full max-w-none">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none -z-10" />

      <div className="px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-none">
        <div className="max-w-6xl mx-auto space-y-16">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary border border-primary/20 uppercase tracking-wider"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Anti-AI Content Control
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-serif font-bold tracking-tight"
            >
              The <span className="bg-gradient-to-r from-primary via-red-500 to-primary bg-clip-text text-transparent">CONTROL</span> System
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg"
            >
              A framework designed to ensure technology amplifies human voices without overriding authorship or authenticity.
            </motion.p>
          </div>

          {/* Interactive Showcase Grid */}
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Visualizer (Satellite Nodes + Pulse Core) */}
            <div className="lg:col-span-6 flex items-center justify-center p-4 min-h-[360px] md:min-h-[420px] relative">
              <div className="relative w-80 h-80 flex items-center justify-center">
                
                {/* Central Human Core */}
                <motion.div 
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-red-600 to-primary/95 text-white flex flex-col items-center justify-center z-20 shadow-2xl relative cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(145, 26, 27, 0.4)",
                      "0 0 40px rgba(145, 26, 27, 0.7)",
                      "0 0 20px rgba(145, 26, 27, 0.4)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  onClick={() => {
                    // Quick reset or pulse effect
                  }}
                >
                  <User className="w-8 h-8" />
                  <span className="text-[10px] uppercase font-bold tracking-widest mt-1">Creator</span>
                </motion.div>

                {/* Pulsing Core Rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div 
                    animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
                    className="w-24 h-24 rounded-full border-2 border-primary/20 absolute"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1 }}
                    className="w-24 h-24 rounded-full border-2 border-primary/30 absolute"
                  />
                </div>

                {/* Satellite Nodes */}
                {PILLARS.map((pillar, idx) => {
                  const { x, y } = getPosition(idx)
                  const Icon = pillar.icon
                  const isActive = activePillar === idx

                  return (
                    <div key={pillar.id} className="absolute inset-0 flex items-center justify-center">
                      
                      {/* Connection Line */}
                      <svg className="absolute w-full h-full pointer-events-none z-10">
                        <motion.line
                          x1="50%"
                          y1="50%"
                          x2={`calc(50% + ${x}px)`}
                          y2={`calc(50% + ${y}px)`}
                          stroke={isActive ? "url(#active-line-grad)" : "rgba(145, 26, 27, 0.15)"}
                          strokeWidth={isActive ? "2" : "1"}
                          strokeDasharray={isActive ? "4,4" : "none"}
                          animate={isActive ? { strokeDashoffset: [0, -20] } : {}}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      </svg>

                      {/* Satellite Circle */}
                      <motion.button
                        style={{
                          x,
                          y,
                          backgroundColor: pillar.bgColor,
                          borderColor: isActive ? pillar.activeBorderColor : pillar.borderColor
                        }}
                        whileHover={{ scale: 1.15 }}
                        onClick={() => setActivePillar(idx)}
                        className="w-14 h-14 rounded-full border-2 flex items-center justify-center z-20 cursor-pointer shadow-md transition-colors"
                        title={pillar.title}
                      >
                        <Icon className="w-6 h-6" style={{ color: isActive ? pillar.activeBorderColor : "rgba(145, 26, 27, 0.7)" }} />
                      </motion.button>
                    </div>
                  )
                })}

                {/* Gradient Definitions for SVG Connections */}
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="active-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="#911A1B" />
                    </linearGradient>
                  </defs>
                </svg>

              </div>
            </div>

            {/* Right Column: Statement & Explanations */}
            <div className="lg:col-span-6 space-y-8 flex flex-col justify-center">
              
              {/* Manifesto Box */}
              <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-lg backdrop-blur">
                <blockquote className="space-y-4 font-serif text-lg md:text-xl text-foreground italic leading-relaxed">
                  <p className="font-bold not-italic text-primary border-b border-primary/10 pb-2 mb-4">The Manifesto</p>
                  <p className="opacity-90">“The human is always in control.</p>
                  <p className="opacity-90 pl-4 border-l-2 border-primary/30 text-base md:text-lg">AI may assist.</p>
                  <p className="opacity-90 pl-4 border-l-2 border-primary/30 text-base md:text-lg">AI may explain.</p>
                  <p className="opacity-90 pl-4 border-l-2 border-primary/30 text-base md:text-lg">AI may suggest.</p>
                  <p className="opacity-90 pl-4 border-l-2 border-primary/30 text-base md:text-lg">AI may critique.</p>
                  <p className="font-semibold text-primary not-italic">But your voice, your structure, your reasoning, and your creativity must remain yours.”</p>
                </blockquote>
              </div>

              {/* Dynamic Pillar Details */}
              <div className="min-h-[140px] space-y-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePillar}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                        <ActiveIcon className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="text-xl font-bold font-serif">{activeData.title}</h4>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      {activeData.description}
                    </p>
                    <p className="text-xs text-primary/80 font-medium">
                      {activeData.detail}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Quick Tab Selectors (for Accessibility & alternative navigation) */}
              <div className="flex flex-wrap gap-2">
                {PILLARS.map((pillar, idx) => (
                  <button
                    key={pillar.id}
                    onClick={() => setActivePillar(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      activePillar === idx
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/35 text-muted-foreground border-border hover:bg-muted/60"
                    }`}
                  >
                    {pillar.title.replace("AI May ", "")}
                  </button>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
