"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Brain, PenTool } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function AIIntroductorySection() {
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  // Burgundy accent color matching the theme
  const accentColor = "#911A1B"
  const lightAccent = theme === 'dark' ? 'rgba(241, 65, 68, 0.1)' : 'rgba(145, 26, 27, 0.05)'
  const textAccent = theme === 'dark' ? '#F14144' : '#911A1B'

  return (
    <section className="relative py-20 md:py-32 overflow-hidden max-w-full">
      {/* Decorative background elements */}
      {hasMounted && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-0 w-96 h-96 rounded-full blur-3xl opacity-20 -z-10" style={{
            backgroundColor: theme === 'dark' ? 'rgba(241, 65, 68, 0.3)' : 'rgba(145, 26, 27, 0.15)'
          }} />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full blur-3xl opacity-15 -z-10" style={{
            backgroundColor: theme === 'dark' ? 'rgba(241, 65, 68, 0.2)' : 'rgba(145, 26, 27, 0.1)'
          }} />
        </div>
      )}

      <div className="container">
        {hasMounted && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-4xl mx-auto"
          >
          {/* Section header */}
          <motion.div variants={itemVariants} className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{
              backgroundColor: lightAccent,
              border: `1px solid ${textAccent}20`
            }}>
              <Sparkles className="w-4 h-4" style={{ color: textAccent }} />
              <span className="text-sm font-medium" style={{ color: textAccent }}>Whispr AI</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">
              Elevate Your Creativity,{" "}
              <span style={{ color: textAccent }}>Don't Replace It</span>
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Curious about using AI to enhance your writing? Learn how to leverage AI as a catalyst for better creativity,
              not a shortcut to mediocrity.
            </p>
          </motion.div>

          {/* Features grid */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
            {[
              {
                icon: Brain,
                title: "Think Deeper",
                description: "Use AI to explore ideas from different angles. Brainstorm, refine, and discover new perspectives on your creative work."
              },
              {
                icon: PenTool,
                title: "Write Better",
                description: "Get real-time suggestions and feedback. Learn writing techniques while AI helps you articulate your thoughts more effectively."
              },
              {
                icon: Sparkles,
                title: "Create With Intent",
                description: "AI as your writing companion, not your replacement. Maintain your authentic voice while improving clarity and impact."
              }
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className={`p-6 md:p-8 rounded-lg border-2 transition-all duration-300 hover:shadow-lg`}
                  style={{
                    backgroundColor: theme === 'dark' 
                      ? 'rgba(15, 15, 15, 0.95)' 
                      : 'rgba(253, 253, 253, 0.5)',
                    borderColor: `${textAccent}40`,
                  }}
                  whileHover={{ y: -5, borderColor: textAccent }}
                >
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: lightAccent }}
                  >
                    <Icon className="w-6 h-6" style={{ color: textAccent }} />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Main CTA section */}
          <motion.div
            variants={itemVariants}
            className={`p-8 md:p-12 rounded-2xl border-2 backdrop-blur-sm`}
            style={{
              backgroundColor: theme === 'dark'
                ? 'rgba(15, 15, 15, 0.8)'
                : 'rgba(253, 253, 253, 0.8)',
              borderColor: `${textAccent}60`,
            }}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4">
                  Welcome to Whispr AI
                </h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Our brand-new AI assistant is designed specifically for writers who want to grow. Whether you're crafting poems,
                    stories, or chronicles, Whispr AI helps you:
                  </p>
                  <ul className="space-y-3 ml-4">
                    {[
                      "Generate ideas and overcome creative blocks",
                      "Get intelligent feedback on your writing",
                      "Explore multiple creative directions",
                      "Improve clarity and impact without losing your voice",
                      "Draft faster, edit smarter, publish proudly"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span 
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: textAccent }}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="pt-2">
                    <strong>The key difference?</strong> Whispr AI asks you questions, offers alternatives, and challenges your thinking —
                    so you become a better writer, not just faster.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t" style={{
                borderColor: `${textAccent}20`
              }}>
                <Button 
                  size="lg" 
                  asChild 
                  className="group text-white"
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
              </div>
            </div>
          </motion.div>

          {/* Bottom curiosity prompt */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-12 md:mt-16 p-6 rounded-lg"
            style={{
              backgroundColor: lightAccent,
              borderLeft: `4px solid ${textAccent}`
            }}
          >
            <p className="text-lg font-medium">
              💡 <span>Are you ready to discover what you can create when AI amplifies your creativity?</span>
            </p>
          </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
