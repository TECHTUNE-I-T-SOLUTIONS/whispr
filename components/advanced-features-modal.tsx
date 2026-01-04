'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Settings, Volume2, Mic, Zap } from 'lucide-react'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { useVoiceDictation } from '@/hooks/useVoiceDictation'

type AdvancedFeaturesModalProps = {
  text: string
  contentRef: React.RefObject<HTMLElement>
  onAutoScrollChange?: (enabled: boolean) => void
}

export default function AdvancedFeaturesModal({ text, contentRef, onAutoScrollChange }: AdvancedFeaturesModalProps) {
  const [open, setOpen] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(80)
  const [showScrollControls, setShowScrollControls] = useState(false)
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(false)

  const { isScrolling, stop: stopScroll, reset: resetScroll } = useAutoScroll(contentRef, { 
    enabled: isAutoScrollActive, 
    speed: scrollSpeed,
    direction: 'up'
  })
  const { isSpeaking, error: ttsError, speak, stop: stopSpeak } = useTextToSpeech({
    voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
  })
  const { isListening, transcript, error: dictationError, startListening, stopListening, reset: resetDictation } = useVoiceDictation()

  // Auto-start voice when auto-scroll is enabled
  useEffect(() => {
    if (isAutoScrollActive && !isSpeaking) {
      speak(text)
    }
  }, [isAutoScrollActive])

  const handleAutoScrollToggle = () => {
    const newState = !isAutoScrollActive
    setIsAutoScrollActive(newState)
    onAutoScrollChange?.(newState)
    
    if (newState) {
      // Start reading when auto-scroll is enabled
      setTimeout(() => speak(text), 100)
    } else {
      // Stop both scroll and speech
      stopScroll()
      stopSpeak()
    }
  }

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopSpeak()
    } else {
      await speak(text)
    }
  }

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings size={16} /> Advanced
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Advanced Features</DialogTitle>
          <DialogDescription>Enhance your reading experience with accessibility tools</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-Scroll Feature */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap size={16} /> Auto-Scroll
              </h3>
              <Button size="sm" variant={isAutoScrollActive ? 'default' : 'outline'} onClick={handleAutoScrollToggle}>
                {isAutoScrollActive ? 'Stop' : 'Start'}
              </Button>
            </div>
            {showScrollControls && (
              <div className="mt-3 space-y-2">
                <label className="text-sm text-slate-600 dark:text-slate-400">Speed: {scrollSpeed} px/s</label>
                <Slider
                  value={[scrollSpeed]}
                  onValueChange={(val) => setScrollSpeed(val[0])}
                  min={20}
                  max={200}
                  step={10}
                  className="w-full"
                />
                <Button size="sm" variant="outline" onClick={resetScroll} className="w-full">
                  Reset Position
                </Button>
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowScrollControls(!showScrollControls)}
              className="w-full mt-2"
            >
              {showScrollControls ? 'Hide' : 'Show'} Controls
            </Button>
          </div>

          {/* Text-to-Speech Feature */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Volume2 size={16} /> Text-to-Speech
              </h3>
              <Button size="sm" variant={isSpeaking ? 'default' : 'outline'} onClick={handleSpeak}>
                {isSpeaking ? 'Stop' : 'Read'}
              </Button>
            </div>
            {ttsError && <p className="text-xs text-red-500 mt-2">{ttsError}</p>}
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Powered by ElevenLabs — high-quality, natural voice synthesis</p>
          </div>

          {/* Voice Dictation Feature */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Mic size={16} /> Voice Dictation
              </h3>
              <Button size="sm" variant={isListening ? 'default' : 'outline'} onClick={handleVoiceInput}>
                {isListening ? 'Stop' : 'Listen'}
              </Button>
            </div>
            {dictationError && <p className="text-xs text-red-500 mt-2">{dictationError}</p>}
            {transcript && <p className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded mt-2">{transcript}</p>}
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Speak your thoughts or commands using your device's microphone</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
