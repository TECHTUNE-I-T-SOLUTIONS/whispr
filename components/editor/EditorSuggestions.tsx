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
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border shadow-lg ml-1 z-50 max-w-md"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(253, 253, 253, 0.95)',
        borderColor: `${accentColor}60`,
        backdropFilter: 'blur(8px)'
      }}
    >
      <Sparkles className="h-3 w-3 flex-shrink-0" style={{ color: accentColor }} />
      <AnimatePresence mode="popLayout">
        {suggestions.slice(0, 5).map((suggestion, idx) => (
          <motion.button
            key={`${suggestion.text}-${idx}`}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onApplySuggestion(suggestion.text)}
            className={`px-2 py-0.5 rounded text-xs transition-colors whitespace-nowrap ${
              idx === selectedIndex
                ? 'bg-primary/10'
                : 'hover:bg-muted/50'
            }`}
          >
            <span className="text-xs font-medium">{suggestion.text}</span>
          </motion.button>
        ))}
      </AnimatePresence>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-muted/50 transition-colors flex-shrink-0"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
    </motion.div>
  )
}
