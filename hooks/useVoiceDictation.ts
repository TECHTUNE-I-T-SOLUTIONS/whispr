'use client'

import { useState, useRef, useCallback } from 'react'

type UseVoiceDictationOptions = {
  language?: string // e.g., 'en-US'
  continuous?: boolean
  interimResults?: boolean
}

export function useVoiceDictation(options: UseVoiceDictationOptions = {}) {
  const { language = 'en-US', continuous = false, interimResults = true } = options
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech Recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = interimResults

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = (e) => setError(`Error: ${e.error}`)

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }
      setTranscript(finalTranscript || interimTranscript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [language, continuous, interimResults])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return { isListening, transcript, error, startListening, stopListening, reset }
}
