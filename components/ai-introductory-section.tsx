"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Brain, PenTool, Lightbulb, Zap, Target, Play, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ControlSystemDemo } from "@/components/demo/ControlSystemDemo"

const FEATURES = [
  {
    icon: Brain,
    title: "Think Deeper",
    description: "Use AI to explore ideas from different angles. Brainstorm, refine, and discover new perspectives on your creative work.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.3)"
  },
  {
    icon: PenTool,
    title: "Write Better",
    description: "Get real-time suggestions and feedback. Learn writing techniques while AI helps you articulate your thoughts more effectively.",
    color: "from-purple-500 to-pink-500",
    bgColor: "rgba(168, 85, 247, 0.1)",
    borderColor: "rgba(168, 85, 247, 0.3)"
  },
  {
    icon: Sparkles,
    title: "Create With Intent",
    description: "AI as your writing companion, not your replacement. Maintain your authentic voice while improving clarity and impact.",
    color: "from-amber-500 to-orange-500",
    bgColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)"
  },
  {
    icon: Lightbulb,
    title: "Generate Ideas",
    description: "Overcome creative blocks with AI-powered brainstorming. Get unique concepts and directions tailored to your style.",
    color: "from-emerald-500 to-teal-500",
    bgColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)"
  },
  {
    icon: Zap,
    title: "Draft Faster",
    description: "Speed up your workflow without sacrificing quality. AI handles the mechanics while you focus on the creative vision.",
    color: "from-rose-500 to-red-500",
    bgColor: "rgba(244, 63, 94, 0.1)",
    borderColor: "rgba(244, 63, 94, 0.3)"
  },
  {
    icon: Target,
    title: "Publish Proudly",
    description: "Our authenticity checker ensures your content remains truly yours. AI assists, but you always have the final say.",
    color: "from-indigo-500 to-violet-500",
    bgColor: "rgba(99, 102, 241, 0.1)",
    borderColor: "rgba(99, 102, 241, 0.3)"
  }
]

export function AIIntroductorySection() {
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [showDemoModal, setShowDemoModal] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const accentColor = "#911A1B"
  const lightAccent = theme === 'dark' ? 'rgba(241, 65, 68, 0.1)' : 'rgba(145, 26, 27, 0.05)'
  const textAccent = theme === 'dark' ? '#F14144' : '#911A1B'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const activeData = FEATURES[activeFeature]
  const ActiveIcon = activeData.icon

  return (
    <section className="relative py-20 md:py-32 overflow-hidden max-w-full">
      {/* Animated background */}
      {hasMounted && (
        <div className="absolute inset-0 -z-10">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(241, 65, 68, 0.2)' : 'rgba(145, 26, 27, 0.1)'
            }}
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.08, 0.15, 0.08]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(168, 85, 247, 0.1)'
            }}
          />
        </div>
      )}

      <div className="container">
        {hasMounted && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-7xl mx-auto"
          >
          {/* Section header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                backgroundColor: lightAccent,
                border: `1px solid ${textAccent}20`
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4" style={{ color: textAccent }} />
              </motion.div>
              <span className="text-sm font-medium" style={{ color: textAccent }}>Whispr AI</span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
              Elevate Your Creativity,{" "}
              <motion.span 
                style={{ color: textAccent }}
                className="inline-block"
                animate={{ 
                  backgroundPosition: ["0%", "100%", "0%"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                Don't Replace It
              </motion.span>
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Curious about using AI to enhance your writing? Learn how to leverage AI as a catalyst for better creativity,
              not a shortcut to mediocrity.
            </p>
          </motion.div>

          {/* Interactive Feature Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            
            {/* Left: Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map((feature, idx) => {
                const Icon = feature.icon
                const isActive = activeFeature === idx
                return (
                  <motion.button
                    key={idx}
                    variants={itemVariants}
                    onClick={() => setActiveFeature(idx)}
                    className={`p-5 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group`}
                    style={{
                      backgroundColor: theme === 'dark' 
                        ? isActive ? 'rgba(15, 15, 15, 0.95)' : 'rgba(15, 15, 15, 0.5)'
                        : isActive ? 'rgba(253, 253, 253, 0.9)' : 'rgba(253, 253, 253, 0.5)',
                      borderColor: isActive ? feature.borderColor : `${feature.borderColor}40`,
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    }}
                    whileHover={{ scale: 1.05, borderColor: feature.borderColor }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Gradient background on hover */}
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                      initial={false}
                      animate={{ opacity: isActive ? 0.15 : 0 }}
                    />
                    
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 relative z-10"
                      style={{ backgroundColor: feature.bgColor }}
                    >
                      <Icon className="w-5 h-5" style={{ color: feature.borderColor.replace('0.3', '1') }} />
                    </div>
                    <h3 className="text-sm font-bold font-serif mb-2 relative z-10">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 relative z-10">{feature.description}</p>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeIndicator"
                        className="absolute top-2 right-2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: feature.borderColor.replace('0.3', '1') }}
                        initial={false}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Right: Active Feature Detail */}
            <motion.div 
              key={activeFeature}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className={`p-8 md:p-10 rounded-2xl border-2 backdrop-blur-sm relative overflow-hidden`}
                style={{
                  backgroundColor: theme === 'dark'
                    ? 'rgba(15, 15, 15, 0.8)'
                    : 'rgba(253, 253, 253, 0.8)',
                  borderColor: activeData.borderColor,
                }}
              >
                {/* Animated gradient background */}
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-br ${activeData.color} opacity-5`}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div className="relative z-10">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: activeData.bgColor }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <ActiveIcon className="w-8 h-8" style={{ color: activeData.borderColor.replace('0.3', '1') }} />
                  </motion.div>
                  
                  <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4">{activeData.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">{activeData.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: activeData.borderColor.replace('0.3', '1') }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeData.borderColor.replace('0.3', '1') }} />
                    <span>AI-Powered Feature</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main CTA Section */}
          <motion.div
            variants={itemVariants}
            className={`p-8 md:p-12 rounded-3xl border-2 backdrop-blur-sm relative overflow-hidden`}
            style={{
              backgroundColor: theme === 'dark'
                ? 'rgba(15, 15, 15, 0.8)'
                : 'rgba(253, 253, 253, 0.8)',
              borderColor: `${textAccent}40`,
            }}
          >
            {/* Animated border gradient */}
            <motion.div 
              className="absolute inset-0 rounded-3xl"
              style={{
                background: `linear-gradient(90deg, transparent, ${textAccent}20, transparent)`,
                backgroundSize: '200% 100%',
              }}
              animate={{ 
                backgroundPosition: ['0% 0%', '200% 0%', '0% 0%']
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-2xl md:text-4xl font-serif font-bold mb-4">
                  Welcome to Whispr AI
                </h3>
                <div className="space-y-4 text-muted-foreground">
                  <p className="text-base md:text-lg">
                    Our brand-new AI assistant is designed specifically for writers who want to grow. Whether you're crafting poems,
                    stories, or chronicles, Whispr AI helps you:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    {[
                      "Generate ideas and overcome creative blocks",
                      "Get intelligent feedback on your writing",
                      "Explore multiple creative directions",
                      "Improve clarity and impact without losing your voice",
                      "Draft faster, edit smarter, publish proudly",
                      "Maintain authenticity with our CONTROL system"
                    ].map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <motion.span 
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: textAccent }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                        />
                        <span className="text-sm">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                  <p className="pt-4 text-base font-medium" style={{ color: textAccent }}>
                    The key difference? Whispr AI asks you questions, offers alternatives, and challenges your thinking —
                    so you become a better writer, not just faster.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t" style={{
                borderColor: `${textAccent}20`
              }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg" 
                    asChild 
                    className="group text-white relative overflow-hidden"
                    style={{ backgroundColor: textAccent }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' 
                        ? 'rgba(241, 65, 68, 0.9)' 
                        : 'rgba(145, 26, 27, 0.9)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = textAccent
                    }}
                  >
                    <Link href="/download" className="inline-flex items-center gap-2">
                      Try Whispr AI Now
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  style={{
                    borderColor: `${textAccent}40`,
                    color: textAccent
                  }}
                >
                  <Link href="/about">Learn More</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowDemoModal(true)}
                  className="gap-2"
                  style={{
                    borderColor: `${textAccent}40`,
                    color: textAccent
                  }}
                >
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Bottom curiosity prompt */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-12 md:mt-16 p-6 rounded-xl relative overflow-hidden"
            style={{
              backgroundColor: lightAccent,
              borderLeft: `4px solid ${textAccent}`
            }}
          >
            <motion.div
              animate={{ 
                backgroundPosition: ['0%', '100%', '0%']
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(90deg, transparent, ${textAccent}20, transparent)`,
                backgroundSize: '200% 100%',
              }}
            />
            <p className="text-lg font-medium relative z-10">
              💡 <span>Are you ready to discover what you can create when AI amplifies your creativity?</span>
            </p>
          </motion.div>
          </motion.div>
        )}
      </div>

      {/* Demo Modal */}
      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold flex items-center gap-2">
              <Play className="h-5 w-5" style={{ color: textAccent }} />
              Whispr CONTROL System Demo
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ControlSystemDemo />
            
            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-bold font-serif">How the CONTROL System Works</h3>
              <div className="space-y-3 text-muted-foreground">
                <p>Our CONTROL system ensures that AI remains a tool for enhancement, not replacement. Here's how it works:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full mt-2 bg-primary/50" />
                    <span><strong>AI May Assist:</strong> Help with drafting, grammar, and formatting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full mt-2 bg-blue-500/50" />
                    <span><strong>AI May Explain:</strong> Break down complex concepts and contexts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full mt-2 bg-emerald-500/50" />
                    <span><strong>AI May Suggest:</strong> Offer stylistic alternatives and vocabulary</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full mt-2 bg-purple-500/50" />
                    <span><strong>AI May Critique:</strong> Provide feedback on structure and flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full mt-2 bg-red-500/50" />
                    <span><strong>Authenticity Check:</strong> Ensure content remains 80%+ human-written</span>
                  </li>
                </ul>
                <p className="pt-2 font-medium" style={{ color: textAccent }}>
                  The author always has the final say. AI suggests, but you decide.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
