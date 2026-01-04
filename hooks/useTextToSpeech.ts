'use client'

import { useState, useRef, useCallback } from 'react'
import { ElevenLabsClient } from 'elevenlabs'

type UseTextToSpeechOptions = {
  apiKey?: string
  voiceId?: string // e.g., 'EXAVITQu4vr4xnSDxMaL' for a natural voice
  modelId?: string
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const { apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY, voiceId = 'EXAVITQu4vr4xnSDxMaL', modelId = 'eleven_turbo_v2_5' } = options
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setError('No text to speak')
        return
      }

      try {
        setIsSpeaking(true)
        setError(null)

        // Try ElevenLabs if API key exists
        if (apiKey) {
          try {
            const client = new ElevenLabsClient({ apiKey })

            const audioStream = await client.generate({
              voice: voiceId,
              model_id: modelId,
              text: text,
            })

            // Create blob from stream
            const chunks: Uint8Array[] = []
            for await (const chunk of audioStream) {
              chunks.push(chunk)
            }
            const buffer = new Uint8Array(chunks.reduce((a, b) => a + b.length, 0))
            let pos = 0
            for (const chunk of chunks) {
              buffer.set(chunk, pos)
              pos += chunk.length
            }

            const blob = new Blob([buffer], { type: 'audio/mpeg' })
            const url = URL.createObjectURL(blob)

            // Create and play audio
            if (!audioRef.current) {
              audioRef.current = new Audio()
            }
            currentAudioRef.current = audioRef.current
            currentAudioRef.current.src = url
            currentAudioRef.current.onended = () => setIsSpeaking(false)
            await currentAudioRef.current.play()
            return
          } catch (elevenLabsErr: any) {
            console.log('ElevenLabs unavailable, using browser speech synthesis')
            // Fall through to browser speech synthesis
          }
        }

        // Fallback to browser speech synthesis
        useBrowserSpeechSynthesis(text)
      } catch (err: any) {
        setError(err.message || 'Failed to generate speech')
        setIsSpeaking(false)
      }
    },
    [apiKey, voiceId, modelId]
  )

  const useBrowserSpeechSynthesis = (text: string) => {
    if (typeof window === 'undefined') return

    const synth = window.speechSynthesis

    // Cancel any ongoing speech
    synth.cancel()

    utteranceRef.current = new SpeechSynthesisUtterance(text)
    utteranceRef.current.rate = 1
    utteranceRef.current.pitch = 1
    utteranceRef.current.volume = 1

    utteranceRef.current.onstart = () => setIsSpeaking(true)
    utteranceRef.current.onend = () => setIsSpeaking(false)
    utteranceRef.current.onerror = (event) => {
      setError(`Speech synthesis error: ${event.error}`)
      setIsSpeaking(false)
    }

    synth.speak(utteranceRef.current)
  }

  const stop = useCallback(() => {
    // Stop ElevenLabs audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }
    
    // Stop browser speech synthesis
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }
    
    setIsSpeaking(false)
  }, [])

  return { isSpeaking, error, speak, stop }
}
