"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Volume2, VolumeX, Shuffle } from "lucide-react"

type Poem = {
  title: string
  category: string
  content: string
}

// Fallback poems (used if JSON fails to load)

function getDailyPoem(list: Poem[], today = new Date()): Poem {
  const start = new Date(today.getFullYear(), 0, 0)
  const diff = today.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)
  const index = dayOfYear % list.length
  return list[index]
}

export default function DailyPoemModal() {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState("")
  const [done, setDone] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0) // rotation within the day
  const [ambientOn, setAmbientOn] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [bgMode, setBgMode] = useState<"river" | "beach" | "waves" | "night" | "lake" | "none">("river")
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // For vivid backgrounds per request, ignore reduced motion for background layers
  const bgAnimEnabled = true

  // Load poems from a single JSON file in public folder
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch("/data/daiy-poems.json", { cache: "no-store" })
        if (res.ok) {
          const list = (await res.json()) as Poem[]
          if (active && Array.isArray(list) && list.length > 0) {
            setPoems(list)
          }
        }
      } catch {
        // If JSON fails, show error but don't use fallback
        console.error("Failed to load poems from JSON")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const poem = useMemo(() => {
    if (poems.length === 0) return null
    // Weighted categories by weekday
    const day = new Date().getDay() // 0=Sun
    const weights: Record<number, string[]> = {
      0: ["Healing", "Positivity", "Life", "Faith"],
      1: ["Positivity", "School", "Life", "People"],
      2: ["Problems", "Work", "Relationships", "Life"],
      3: ["People", "Relationships", "Friendship", "Life"],
      4: ["Regrets", "Healing", "Life", "Positivity"],
      5: ["Love", "Relationships", "People", "Life"],
      6: ["Life", "People", "Love", "Everyday"],
    }
    const preferred = weights[day] || []
    const list = preferred.length
      ? poems.filter(p => preferred.includes(p.category))
      : poems
    const base = getDailyPoem(list.length ? list : poems, new Date())
    // Find index in chosen list to allow rotation
    const chosen = list.length ? list : poems
    const startIdx = chosen.findIndex(p => p.title === base.title && p.category === base.category)
    const idx = startIdx >= 0 ? (startIdx + offset) % chosen.length : (offset % chosen.length)
    return chosen[idx]
  }, [poems, offset])
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const storageKey = `dailyPoemDismissed-${todayKey}`
  const offsetKey = `dailyPoemIdxOffset-${todayKey}`
  const bgKey = `dailyPoemBgMode`

  // Decide whether to open on first load
  useEffect(() => {
    if (loading) return
    try {
      const suppressed = localStorage.getItem(storageKey)
      if (!suppressed && poem) setOpen(true)
      const savedOffset = localStorage.getItem(offsetKey)
      if (savedOffset) setOffset(parseInt(savedOffset, 10) || 0)
      const savedBg = localStorage.getItem(bgKey) as typeof bgMode | null
      if (savedBg === "river" || savedBg === "beach" || savedBg === "waves" || savedBg === "night" || savedBg === "lake" || savedBg === "none") setBgMode(savedBg)
    } catch {}
  }, [storageKey, offsetKey, loading, poem])

  // Typewriter effect with gentle pacing and auto-scroll; respect prefers-reduced-motion
  useEffect(() => {
    if (!open || !poem) return
    setTyped("")
    setDone(false)
    const text = poem!.content
    let i = 0
    let cancelled = false
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      setTyped(text)
      setDone(true)
      // Ensure scrolled to bottom once
      requestAnimationFrame(() => {
        const root = scrollAreaRef.current
        const viewport = root?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null
        if (viewport) viewport.scrollTop = viewport.scrollHeight
      })
      return
    }

    function step() {
      if (cancelled) return
      if (i >= text.length) {
        setDone(true)
        return
      }
      setTyped((prev) => prev + text[i])
      i += 1

      // pacing: base speed + pauses on punctuation and line breaks
      const ch = text[i - 1]
      let delay = 28 // ms per char
      if (ch === "\n") delay = 220
      else if (",.;".includes(ch)) delay = 60
      else if ("!?".includes(ch)) delay = 140

      // auto-scroll to bottom
      requestAnimationFrame(() => {
        const root = scrollAreaRef.current
        const viewport = root?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null
        if (viewport) viewport.scrollTop = viewport.scrollHeight
      })

      setTimeout(step, delay)
    }

    const t = setTimeout(step, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [open, poem?.content])

  const dontShowAgainToday = () => {
    try {
      localStorage.setItem(storageKey, "1")
    } catch {}
    setOpen(false)
  }

  const seeAnother = () => {
    setOffset(prev => {
      const next = prev + 1
      try { localStorage.setItem(offsetKey, String(next)) } catch {}
      return next
    });
  }

  const changeBg = (mode: typeof bgMode) => {
    setBgMode(mode)
    try { localStorage.setItem(bgKey, mode) } catch {}
  }

  // No per-particle inline styles; use CSS-only overlays per theme to satisfy lint rules

  // Ambient audio management
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.loop = true
      audioRef.current.volume = 0.25
    }
    const audio = audioRef.current
    if (open && ambientOn) {
      // pick one ambient track randomly (user will add files named "ambient 1", "ambient 2", ...)
  const idx = Math.floor(Math.random() * 15) + 1 // try up to 15 by default
      audio.src = `/ambient ${idx}.mp3`
      audio.play().catch(() => {/* ignore autoplay restrictions */})
    } else {
      audio.pause()
      audio.currentTime = 0
    }
    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [open, ambientOn])

  // Don't render modal if still loading or no poem available
  if (loading || !poem) {
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-[90vw] md:max-w-2xl md:w-auto p-3 md:p-4 overflow-hidden border-0 bg-secondary/30 shadow-2xl">
          <div className="relative rounded-lg overflow-hidden">
            {/* Water background layer */}
            <div aria-hidden className={`absolute inset-0 ${bgMode === 'none' ? '' : 'opacity-95'}`}>
                <div className="absolute inset-x-0 bottom-0 h-1/2 [background:radial-gradient(6px_3px_at_10%_20%,#ffffff_60%,transparent_41%),radial-gradient(7px_3px_at_40%_15%,#ffffff_60%,transparent_41%),radial-gradient(5px_3px_at_70%_25%,#ffffff_60%,transparent_41%)] opacity-90 animate-[foam-drift-layer_10s_ease-in-out_infinite]" />
                <div className="absolute inset-x-0 bottom-8 h-1/2 [background:radial-gradient(4px_2px_at_20%_30%,#ffffff_50%,transparent_41%),radial-gradient(4px_2px_at_55%_20%,#ffffff_50%,transparent_41%),radial-gradient(3px_2px_at_80%_35%,#ffffff_50%,transparent_41%)] opacity-80 animate-[foam-drift-layer_16s_ease-in-out_infinite_reverse]" />
              </div>
            {bgAnimEnabled && bgMode === 'waves' && (
              <div aria-hidden className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-60 [background:radial-gradient(3px_3px_at_15%_30%,#7dd3fc_80%,transparent_61%),radial-gradient(3px_3px_at_55%_70%,#38bdf8_70%,transparent_61%),radial-gradient(4px_4px_at_85%_50%,#22d3ee_70%,transparent_61%)] animate-[mote-drift-layer_20s_linear_infinite]" />
              </div>
            )}
            {bgAnimEnabled && bgMode === 'night' && (
              <div aria-hidden className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 [background:radial-gradient(2px_2px_at_10%_20%,#ffffff_90%,transparent_61%),radial-gradient(2.5px_2.5px_at_30%_40%,#ffffff_90%,transparent_61%),radial-gradient(2px_2px_at_60%_25%,#ffffff_90%,transparent_61%),radial-gradient(2.5px_2.5px_at_80%_60%,#ffffff_90%,transparent_61%),radial-gradient(2px_2px_at_45%_75%,#ffffff_90%,transparent_61%)] animate-[star-twinkle-layer_4s_ease-in-out_infinite] opacity-100" />
                <div className="absolute inset-0 [background:radial-gradient(2px_2px_at_20%_30%,#ffffff_80%,transparent_61%),radial-gradient(2px_2px_at_40%_55%,#ffffff_80%,transparent_61%),radial-gradient(2px_2px_at_65%_35%,#ffffff_80%,transparent_61%),radial-gradient(2px_2px_at_85%_65%,#ffffff_80%,transparent_61%)] animate-[star-twinkle-layer_6s_ease-in-out_infinite_reverse] opacity-80" />
              </div>
            )}
            {bgAnimEnabled && bgMode === 'lake' && (
              <div aria-hidden className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-80 [background:radial-gradient(3px_3px_at_15%_40%,#bae6fd_80%,transparent_61%),radial-gradient(3px_3px_at_35%_65%,#a5f3fc_80%,transparent_61%),radial-gradient(3px_3px_at_70%_55%,#7dd3fc_80%,transparent_61%)] animate-[mote-drift-layer_22s_linear_infinite]" />
              </div>
            )}
          </div>

          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-lg pointer-events-none">
            <div className="absolute -inset-[1px] rounded-lg bg-[conic-gradient(var(--tw-gradient-stops))] from-fuchsia-500 via-sky-500 to-violet-600 opacity-25 blur-[6px] animate-[spin_14s_linear_infinite]" />
          </div>

          <div className="relative p-4 md:p-8 bg-transparent backdrop-blur-sm">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] md:text-xs uppercase tracking-wider">
                  Today’s Whisper
                </Badge>
                <Badge variant="secondary" className="text-[10px] md:text-xs">{poem!.category}</Badge>
              </div>
              <DialogTitle className="text-xl md:text-3xl font-serif leading-tight">
                {poem!.title}
              </DialogTitle>
              <DialogDescription className="sr-only">A daily poem to inspire reflection.</DialogDescription>
            </DialogHeader>

            <div className="mt-3 md:mt-4">
              <ScrollArea ref={scrollAreaRef} className="h-48 md:h-80 rounded-md border bg-background/60">
                <div className="p-3 md:p-6 font-mono text-[0.85rem] md:text-[0.95rem] leading-6 md:leading-7 whitespace-pre-wrap">
                  {typed}
                  <span className="ml-0.5 inline-block h-5 align-[-2px] w-[2px] bg-foreground animate-[blink_1s_steps(2,start)_infinite]" />
                </div>
              </ScrollArea>
            </div>

            <div className="mt-4 md:mt-6 flex flex-col gap-2 w-full">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2 order-2 sm:order-1 w-full">
                <Button variant={ambientOn ? "default" : "outline"} onClick={() => setAmbientOn(v => !v)} className="w-full sm:w-auto">
                  {ambientOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}sound
                </Button>
                <Button variant="outline" onClick={seeAnother} className="w-full sm:w-auto">
                  <Shuffle className="h-4 w-4 mr-2" /> See another
                </Button>
                {/* Background mode selectors */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1 w-full">
                  {/* <Button variant={bgMode === 'river' ? 'default' : 'outline'} onClick={() => changeBg('river')} className="w-full sm:w-auto text-sm px-3 py-2">River</Button>
                  <Button variant={bgMode === 'beach' ? 'default' : 'outline'} onClick={() => changeBg('beach')} className="w-full sm:w-auto text-sm px-3 py-2">Beach</Button>
                  <Button variant={bgMode === 'waves' ? 'default' : 'outline'} onClick={() => changeBg('waves')} className="w-full sm:w-auto text-sm px-3 py-2">Waves</Button>
                  <Button variant={bgMode === 'night' ? 'default' : 'outline'} onClick={() => changeBg('night')} className="w-full sm:w-auto text-sm px-3 py-2">Night Sea</Button>
                  <Button variant={bgMode === 'lake' ? 'default' : 'outline'} onClick={() => changeBg('lake')} className="w-full sm:w-auto text-sm px-3 py-2">Misty Lake</Button>
                  <Button variant={bgMode === 'none' ? 'default' : 'outline'} onClick={() => changeBg('none')} className="w-full sm:w-auto text-sm px-3 py-2">None</Button> */}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 order-1 sm:order-2 w-full">
              <Button variant="ghost" onClick={() => setOpen(false)} className="w-full text-sm px-3 py-2">
                Close
              </Button>
              <Button onClick={dontShowAgainToday} className="w-full text-sm px-3 py-2">
                Don’t show again today
              </Button>
              </div>
            </div>
          </div>
        </DialogContent>
        {/* Cursor blink keyframes */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <style jsx global>{`
          @keyframes blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
          @keyframes flow1 { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-6px) } }
          @keyframes flow2 { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
          @keyframes flow3 { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-14px) } }
          @keyframes wave1 { 0%,100% { transform: translateX(0px) } 50% { transform: translateX(-10px) } }
          @keyframes wave2 { 0%,100% { transform: translateX(0px) } 50% { transform: translateX(8px) } }
          @keyframes wave3 { 0%,100% { transform: translateX(0px) } 50% { transform: translateX(-6px) } }
          @keyframes drift { 0% { transform: translate3d(0,0,0) } 50% { transform: translate3d(10px,-8px,0) } 100% { transform: translate3d(0,0,0) } }
          @keyframes mist { 0% { transform: translateX(-10%) } 50% { transform: translateX(10%) } 100% { transform: translateX(-10%) } }
          @keyframes ripple { 0% { opacity: 0.6; transform: scale(1) } 50% { opacity: 0.25; transform: scale(1.2) } 100% { opacity: 0.6; transform: scale(1) } }
          @keyframes bubble-rise { 0% { transform: translateY(20%); opacity: 0 } 10% { opacity: 0.7 } 100% { transform: translateY(-90%); opacity: 0 } }
          @keyframes foam-drift { 0% { transform: translateX(0) } 50% { transform: translateX(20px) } 100% { transform: translateX(-10px) } }
          @keyframes star-twinkle { 0%,100% { opacity: 0.2 } 50% { opacity: 0.9 } }
          @keyframes mote-drift { 0% { transform: translate3d(0,0,0) } 50% { transform: translate3d(-12px,-8px,0) } 100% { transform: translate3d(0,0,0) } }
          /* Layered animation variants for CSS-only particle overlays */
          @keyframes bubble-rise-layer { 0% { transform: translateY(10%); opacity: .3 } 20% { opacity: .95 } 100% { transform: translateY(-90%); opacity: 0 } }
          @keyframes foam-drift-layer { 0% { transform: translateX(0) } 50% { transform: translateX(25px) } 100% { transform: translateX(-20px) } }
          @keyframes mote-drift-layer { 0% { transform: translate3d(0,0,0) } 50% { transform: translate3d(-24px,-16px,0) } 100% { transform: translate3d(0,0,0) } }
          @keyframes star-twinkle-layer { 0% { opacity: .6 } 50% { opacity: 1 } 100% { opacity: .6 } }
        `}</style>
      </Dialog>
    </>
  )
}
