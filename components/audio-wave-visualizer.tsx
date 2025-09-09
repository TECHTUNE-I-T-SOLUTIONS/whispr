"use client"

import { useEffect, useRef, useState } from "react"

interface AudioWaveVisualizerProps {
  isRecording: boolean
  isPlaying: boolean
  audioRef: React.RefObject<HTMLAudioElement | null>
  className?: string
}

export function AudioWaveVisualizer({
  isRecording,
  isPlaying,
  audioRef,
  className = ""
}: AudioWaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const [bars, setBars] = useState<number[]>(Array(50).fill(0))

  // Persistent refs for AudioContext and MediaElementSource management
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  // Cleanup function to disconnect previous MediaElementSource
  const cleanupAudioSource = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect()
      } catch (e) {
        // Source might already be disconnected
      }
      sourceRef.current = null
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch (e) {
        // Analyser might already be disconnected
      }
      analyserRef.current = null
    }
  }

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = canvas.width / bars.length
      const centerY = canvas.height / 2

      bars.forEach((height, index) => {
        const x = index * barWidth
        const barHeight = height * canvas.height * 0.8

        // Create gradient for the bars
        const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2)
        if (isRecording) {
          gradient.addColorStop(0, "#ef4444") // Red for recording
          gradient.addColorStop(1, "#dc2626")
        } else if (isPlaying) {
          gradient.addColorStop(0, "#22c55e") // Green for playing
          gradient.addColorStop(1, "#16a34a")
        } else {
          gradient.addColorStop(0, "#6b7280") // Gray for inactive
          gradient.addColorStop(1, "#4b5563")
        }

        ctx.fillStyle = gradient
        ctx.fillRect(x + 1, centerY - barHeight / 2, barWidth - 2, barHeight)
      })

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [bars, isRecording, isPlaying])

  useEffect(() => {
    if (isRecording) {
      // Analyze actual audio input during recording
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const analyser = audioContext.createAnalyser()
            const microphone = audioContext.createMediaStreamSource(stream)
            const dataArray = new Uint8Array(analyser.frequencyBinCount)

            analyser.fftSize = 256
            microphone.connect(analyser)

            const updateBars = () => {
              analyser.getByteFrequencyData(dataArray)

              // Convert frequency data to bar heights with better sensitivity
              const newBars = Array.from({ length: 50 }, (_, i) => {
                const start = Math.floor((i / 50) * dataArray.length)
                const end = Math.floor(((i + 1) / 50) * dataArray.length)
                const sum = dataArray.slice(start, end).reduce((a, b) => a + b, 0)
                const average = sum / (end - start)
                // Normalize and add some minimum height for visual appeal
                return Math.max(0.05, Math.min(1, average / 128))
              })

              setBars(newBars)
              requestAnimationFrame(updateBars)
            }

            updateBars()

            return () => {
              stream.getTracks().forEach(track => track.stop())
              audioContext.close()
            }
          })
          .catch(err => {
            console.error('Error accessing microphone:', err)
            // Fallback to simulated waves
            const interval = setInterval(() => {
              setBars(prev => prev.map(() => Math.random() * 0.3 + 0.1))
            }, 100)
            return () => clearInterval(interval)
          })
      }
    } else if (isPlaying && audioRef.current && audioRef.current.src) {
      // Analyze actual audio data during playback
      const audio = audioRef.current

      try {
        // Initialize or reuse AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        // Clean up previous connections
        cleanupAudioSource()

        // Create new analyser and source
        analyserRef.current = audioContextRef.current.createAnalyser()
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio)
        const bufferLength = analyserRef.current.frequencyBinCount
        const arrayBuffer = new ArrayBuffer(bufferLength)
        dataArrayRef.current = new Uint8Array(arrayBuffer)

        analyserRef.current.fftSize = 256
        if (sourceRef.current) {
          sourceRef.current.connect(analyserRef.current)
        }
        analyserRef.current.connect(audioContextRef.current.destination)

        const updateBars = () => {
          if (!analyserRef.current || !dataArrayRef.current) return

          analyserRef.current.getByteFrequencyData(dataArrayRef.current as any)

          // Convert frequency data to bar heights
          const dataArray = dataArrayRef.current
          const newBars = Array.from({ length: 50 }, (_, i) => {
            const start = Math.floor((i / 50) * dataArray.length)
            const end = Math.floor(((i + 1) / 50) * dataArray.length)
            const sum = dataArray.slice(start, end).reduce((a, b) => a + b, 0)
            const average = sum / (end - start)
            return Math.max(0.05, average / 255)
          })

          setBars(newBars)
          requestAnimationFrame(updateBars)
        }

        updateBars()

        return () => {
          // Don't close AudioContext here, keep it for reuse
          // Just stop the animation
        }
      } catch (error) {
        console.error('Error creating audio source:', error)
        // Fallback to simulated waves when MediaElementSource fails
        const interval = setInterval(() => {
          setBars(prev => prev.map(() => Math.random() * 0.3 + 0.1))
        }, 100)
        return () => clearInterval(interval)
      }
    } else if (isPlaying) {
      // Fallback to simulated waves when no audio source is available
      const interval = setInterval(() => {
        setBars(prev => prev.map(() => Math.random() * 0.3 + 0.1))
      }, 100)
      return () => clearInterval(interval)
    } else {
      // Clean up when not playing
      cleanupAudioSource()
      // Reset bars when not recording or playing
      setBars(Array(50).fill(0.05))
    }
  }, [isRecording, isPlaying, audioRef])

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      cleanupAudioSource()
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {
          // AudioContext might already be closed
        }
        audioContextRef.current = null
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className={`w-full h-15 bg-muted/20 rounded ${className}`}
    />
  )
}
