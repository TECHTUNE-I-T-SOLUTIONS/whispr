"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, ChevronRight } from "lucide-react"
import { editorSuggestionsService } from "@/lib/services/editor-suggestions"
import { useTheme } from "next-themes"

interface Suggestion {
  text: string;
  type: 'word' | 'phrase' | 'sentence' | 'transition';
  confidence: number;
}

interface EditorSuggestionsProps {
  content: string;
  cursorPosition: number
  onApplySuggestion: (suggestion: string) => void
  onClose: () => void
}

export function EditorSuggestions({ content, cursorPosition, onApplySuggestion, onClose }: EditorSuggestionsProps) {
  const { theme } = useTheme()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const newSuggestions = editorSuggestionsService.getSuggestions(content, cursorPosition)
    setSuggestions(newSuggestions)
    setSelectedIndex(0)
  }, [content, cursorPosition])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Tab' && suggestions.length > 0) {
        e.preventDefault()
        onApplySuggestion(suggestions[selectedIndex].text)
      } else if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault()
        onApplySuggestion(suggestions[selectedIndex].text)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [suggestions, selectedIndex, onApplySuggestion, onClose])

  if (suggestions.length === 0) return null

  const accentColor = theme === 'dark' ? '#F14144' : '#911A1B'

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="inline-flex items-center gap-2 px-2 py-1 rounded border shadow-sm ml-1 z-50"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(253, 253, 253, 0.95)',
        borderColor: `${accentColor}60`
      }}
    >
      <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
      <AnimatePresence mode="popLayout">
        {suggestions.map((suggestion, idx) => (
          <motion.button
            key={`${suggestion.text}-${idx}`}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onApplySuggestion(suggestion.text)}
            className={`px-2 py-0.5 rounded text-xs sm:text-sm transition-colors ${
              idx === selectedIndex
                ? 'bg-primary/10'
                : 'hover:bg-muted/50'
            }`}
          >
            <span className="text-xs sm:text-sm">{suggestion.text}</span>
            <span className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded ml-1" style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor
            }}>
              {suggestion.type}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-muted/50 transition-colors"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
      <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:inline">
        Tab/Enter
      </span>
    </motion.div>
  )
}
