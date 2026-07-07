"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RotateCcw, Sparkles, AlertTriangle, CheckCircle, X, ChevronRight, Keyboard, MousePointer2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface DemoStep {
  id: string
  title: string
  description: string
  duration: number
}

const DEMO_STEPS: DemoStep[] = [
  { id: "typing", title: "Writing with AI Suggestions", description: "See how AI suggests completions as you type", duration: 5000 },
  { id: "accepting", title: "Accepting Suggestions", description: "Press Tab to accept, Escape to dismiss", duration: 4000 },
  { id: "title", title: "AI Title Suggestions", description: "Get creative title suggestions for your work", duration: 4000 },
  { id: "assistant", title: "Ask the Assistant", description: "Get help with writing questions", duration: 5000 },
  { id: "paste", title: "Paste AI Content", description: "See how the authenticity checker flags AI content", duration: 6000 },
  { id: "edit", title: "Edit to Improve", description: "Follow the guidance to reach 80%+ authenticity", duration: 5000 },
  { id: "correct", title: "User Makes Corrections", description: "Watch as the user edits content based on feedback", duration: 6000 },
  { id: "submit", title: "Submit & Pass", description: "Content passes authenticity check after edits", duration: 4000 },
  { id: "success", title: "You've Improved!", description: "See how the CONTROL system helps you become a better writer", duration: 5000 },
]

export function ControlSystemDemo() {
  const { theme } = useTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [typingText, setTypingText] = useState("")
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [suggestionText, setSuggestionText] = useState("")
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [assistantMessage, setAssistantMessage] = useState("")
  const [showAuthenticityCheck, setShowAuthenticityCheck] = useState(false)
  const [authenticityScore, setAuthenticityScore] = useState(0)
  const [flaggedSections, setFlaggedSections] = useState<string[]>([])
  const [keyPresses, setKeyPresses] = useState<string[]>([])

  const accentColor = theme === 'dark' ? '#F14144' : '#911A1B'
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetDemo = () => {
    setCurrentStep(0)
    setProgress(0)
    setTypingText("")
    setShowSuggestion(false)
    setSuggestionText("")
    setShowTitleSuggestions(false)
    setShowAssistant(false)
    setAssistantMessage("")
    setShowAuthenticityCheck(false)
    setAuthenticityScore(0)
    setFlaggedSections([])
    setKeyPresses([])
    setIsPaused(false)
  }

  const startDemo = () => {
    setIsPlaying(true)
    resetDemo()
  }

  const pauseDemo = () => {
    setIsPaused(!isPaused)
  }

  useEffect(() => {
    if (!isPlaying || isPaused) return

    const currentStepData = DEMO_STEPS[currentStep] || DEMO_STEPS[0]
    const stepDuration = currentStepData.duration
    const interval = 100
    const increment = (interval / stepDuration) * 100

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentStep < DEMO_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
            return 0
          } else {
            setIsPlaying(false)
            return 100
          }
        }
        return prev + increment
      })
    }, interval)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, isPaused, currentStep])

  // Demo step animations
  useEffect(() => {
    if (!isPlaying || isPaused) return

    switch (currentStep) {
      case 0: // Typing with suggestions
        simulateTyping()
        break
      case 1: // Accepting suggestions
        simulateAcceptance()
        break
      case 2: // Title suggestions
        simulateTitleSuggestions()
        break
      case 3: // Assistant
        simulateAssistant()
        break
      case 4: // Paste AI content
        simulatePaste()
        break
      case 5: // Edit to improve
        simulateEdit()
        break
      case 6: // User makes corrections
        simulateCorrections()
        break
      case 7: // Submit and pass
        simulateSubmit()
        break
      case 8: // Success message
        simulateSuccess()
        break
    }
  }, [currentStep, isPlaying, isPaused])

  const simulateTyping = () => {
    const text = "The ancient forest whispered secrets"
    let index = 0
    setTypingText("")
    setShowSuggestion(false)

    typingIntervalRef.current = setInterval(() => {
      if (index < text.length) {
        setTypingText(prev => prev + text[index])
        index++
        
        // Show suggestion after typing a few words
        if (index === 15) {
          setSuggestionText(" to those who listened carefully")
          setShowSuggestion(true)
        }
      } else {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
      }
    }, 150)
  }

  const simulateAcceptance = () => {
    setTimeout(() => {
      setKeyPresses(["Tab"])
      setTimeout(() => {
        setTypingText(prev => prev + suggestionText)
        setShowSuggestion(false)
        setKeyPresses([])
      }, 500)
    }, 1000)
  }

  const simulateTitleSuggestions = () => {
    setTimeout(() => {
      setShowTitleSuggestions(true)
    }, 1000)
  }

  const simulateAssistant = () => {
    setTimeout(() => {
      setShowAssistant(true)
      const message = "How can I improve the pacing of this story?"
      let index = 0
      const interval = setInterval(() => {
        if (index < message.length) {
          setAssistantMessage(prev => prev + message[index])
          index++
        } else {
          clearInterval(interval)
        }
      }, 50)
    }, 1000)
  }

  const simulatePaste = () => {
    setTimeout(() => {
      setTypingText("In the vast expanse of the digital realm, where algorithms dance and data flows like rivers of knowledge, we find ourselves at the precipice of a new era. The convergence of artificial intelligence and human creativity has birthed unprecedented possibilities, transforming the landscape of innovation in ways previously unimaginable.")
      setShowAuthenticityCheck(true)
      setAuthenticityScore(45)
      setFlaggedSections(["lines 1-2", "lines 3-4"])
    }, 1000)
  }

  const simulateEdit = () => {
    setTimeout(() => {
      setAuthenticityScore(65)
      setFlaggedSections(["line 3"])
    }, 2000)
    setTimeout(() => {
      setAuthenticityScore(82)
      setFlaggedSections([])
    }, 4000)
  }

  const simulateCorrections = () => {
    const originalText = "In the vast expanse of the digital realm, where algorithms dance and data flows like rivers of knowledge, we find ourselves at the precipice of a new era."
    const correctedText = "In the vast digital world, where algorithms work and data flows like rivers, we stand at the edge of a new era."
    
    setTimeout(() => {
      setTypingText(originalText)
      setShowAuthenticityCheck(true)
      setAuthenticityScore(45)
      setFlaggedSections(["lines 1-2"])
    }, 1000)
    
    setTimeout(() => {
      // Show user making corrections
      setTypingText(correctedText)
      setAuthenticityScore(72)
      setFlaggedSections(["line 1"])
    }, 3000)
    
    setTimeout(() => {
      setTypingText("In our digital world, where algorithms work and data flows like rivers, we stand at the edge of a new era. I remember when I first saw this technology—it changed how I think about innovation.")
      setAuthenticityScore(85)
      setFlaggedSections([])
    }, 5000)
  }

  const simulateSubmit = () => {
    setTimeout(() => {
      setKeyPresses(["Enter"])
      setTimeout(() => {
        setAuthenticityScore(88)
        setShowAuthenticityCheck(true)
      }, 500)
    }, 1000)
    
    setTimeout(() => {
      setKeyPresses([])
    }, 2000)
  }

  const simulateSuccess = () => {
    setTimeout(() => {
      setShowAuthenticityCheck(false)
      setTypingText("✅ Content published successfully!")
    }, 1000)
    
    setTimeout(() => {
      setTypingText("✅ Content published successfully!\n\nYour authenticity score: 88%\n\nYou've learned to:\n• Add personal voice and anecdotes\n• Use concrete details\n• Vary sentence structure\n• Avoid AI clichés")
    }, 2000)
  }

  const step = DEMO_STEPS[currentStep] || DEMO_STEPS[0]

  return (
    <div className="space-y-6">
      {/* Demo Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={isPlaying ? pauseDemo : startDemo}
            className="gap-2"
            style={{ backgroundColor: accentColor }}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? (isPaused ? "Resume" : "Pause") : "Start Demo"}
          </Button>
          <Button size="sm" variant="outline" onClick={resetDemo} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {DEMO_STEPS.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: accentColor }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Demo Stage */}
      <div className="relative rounded-xl border-2 overflow-hidden" style={{
        backgroundColor: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(253, 253, 253, 0.95)',
        borderColor: `${accentColor}40`,
        minHeight: '300px'
      }}>
        {/* Step Info */}
        <div className="p-3 sm:p-4 border-b" style={{ borderColor: `${accentColor}20` }}>
          <h3 className="text-base sm:text-lg font-bold font-serif mb-1">{step.title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
        </div>

        {/* Editor Simulation */}
        <div className="p-3 sm:p-6 relative">
          {/* Editor Toolbar */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b" style={{ borderColor: `${accentColor}20` }}>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 text-center text-[10px] sm:text-xs text-muted-foreground">
              Whispr Editor
            </div>
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: accentColor }} />
          </div>

          {/* Editor Content */}
          <div className="relative min-h-[150px] sm:min-h-[200px] p-3 sm:p-4 rounded-lg border" style={{
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
            borderColor: `${accentColor}30`
          }}>
            <div className="font-serif text-sm sm:text-lg leading-relaxed whitespace-pre-wrap break-words">
              {typingText}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-block w-0.5 h-4 sm:h-5 ml-1"
                style={{ backgroundColor: accentColor }}
              />
            </div>

            {/* AI Suggestion Popup - In-line */}
            <AnimatePresence>
              {showSuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="inline-flex items-center gap-2 px-2 py-1 rounded border shadow-sm ml-1"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(253, 253, 253, 0.95)',
                    borderColor: `${accentColor}60`
                  }}
                >
                  <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
                  <span className="text-xs sm:text-sm text-muted-foreground italic">{suggestionText}</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded" style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor
                  }}>
                    Tab
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title Suggestions - In-line */}
            <AnimatePresence>
              {showTitleSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="inline-flex flex-wrap items-center gap-2 mt-2 px-2 py-1.5 rounded-lg border shadow-sm"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(253, 253, 253, 0.95)',
                    borderColor: `${accentColor}60`
                  }}
                >
                  <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
                  <span className="text-[10px] sm:text-xs font-semibold" style={{ color: accentColor }}>Titles:</span>
                  {["Whispers of the Ancient Forest", "The Forest's Secret", "Echoes in the Woods"].map((title, idx) => (
                    <motion.button
                      key={title}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className="text-[10px] sm:text-xs px-2 py-1 rounded hover:bg-muted/50 transition-colors"
                    >
                      {title}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Assistant Panel - Compact */}
            <AnimatePresence>
              {showAssistant && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="mt-3 p-2 sm:p-3 rounded-lg border shadow-sm"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(253, 253, 253, 0.95)',
                    borderColor: `${accentColor}60`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
                    <span className="text-[10px] sm:text-xs font-semibold" style={{ color: accentColor }}>AI Assistant</span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2">
                    {assistantMessage}
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}10` }}>
                    <p className="text-[10px] sm:text-xs">Consider varying sentence lengths and adding sensory details to improve pacing.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Authenticity Check - Compact */}
            <AnimatePresence>
              {showAuthenticityCheck && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-3 p-2 sm:p-4 rounded-lg border backdrop-blur-sm"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: authenticityScore >= 80 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
                  }}
                >
                  <div className={`p-2 sm:p-4 rounded-lg mb-2 sm:mb-4 ${
                    authenticityScore >= 80
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm font-semibold">
                        Authenticity: {authenticityScore}%
                      </span>
                      {authenticityScore >= 80 ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {authenticityScore >= 80
                        ? "Content appears to be original and human-written."
                        : "Content does not meet our authenticity threshold (80%+ required)."}
                    </p>
                  </div>

                  {flaggedSections.length > 0 && (
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground">AI-Flagged Sections:</p>
                      {flaggedSections.map((section, idx) => (
                        <motion.div
                          key={section}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.2 }}
                          className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        >
                          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                          <span className="text-[10px] sm:text-xs">{section}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Key Press Indicator - Compact */}
            <AnimatePresence>
              {keyPresses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    borderColor: `${accentColor}60`
                  }}
                >
                  <Keyboard className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: accentColor }} />
                  <span className="text-xs sm:text-sm font-mono" style={{ color: accentColor }}>{keyPresses[0]}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="p-3 sm:p-4 border-t flex items-center justify-between" style={{ borderColor: `${accentColor}20` }}>
          <div className="flex gap-1">
            {DEMO_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentStep(idx)
                  setProgress(0)
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
                style={{ backgroundColor: idx === currentStep ? accentColor : undefined }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MousePointer2 className="h-3 w-3" />
            <span>Interactive demo simulation</span>
          </div>
        </div>
      </div>
    </div>
  )
}
