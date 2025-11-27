"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { generateRemixedPoem } from "@/utils/poemRemixer"
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
const fallbackPoems: Poem[] = [
  {
    title: "What We Carry",
    category: "Life",
    content: `We carry mornings we couldn't name
and nights that left their fingerprints on our ribs.
We carry the quiet chores of becoming—
how a small kindness can tilt a whole day,
how grief returns like a tide that knows the shore.

There are rooms we leave the light on for,
conversations we only finish in our heads,
and the simple miracle of breath meeting breath—
someone asking, "How are you?" and waiting for the real answer.

We are not unfinished. We are unfolding.
We are not late. We are learning the clock of our own hearts.
And if today all you carried was yourself
from one moment into the next—
that's still a kind of sun rising.`,
  },
  {
    title: "Between Your Name and Mine",
    category: "Relationships",
    content: `We learned to talk in weather—the warm fronts,
your laughter; the storm warning, my silence.
Some evenings we were windows reflecting windows;
some mornings we were a door that opened.

There is a country between your name and mine
where ordinary things become holy:
the cup you set down, the minute that lingers,
the hand that doesn't forget how to return.

If love is a grammar, we are still syntaxing,
still choosing the gentle conjunctions—
and yet, and also, despite, still.
Come sit with me in the soft grammar of us,
where we keep discovering new ways to say home.`,
  },
  {
    title: "The Ledger",
    category: "Regrets",
    content: `I kept a ledger of almosts:
calls unsaid, doors unknocked, roads unwalked.
It was a heavy book, and I kept it close,
as if shame were a kind of passport.

But one day I counted backwards—
how every almost taught me a tenderness,
how every no saved a soft portion of me
for a truer yes I hadn't met yet.

I do not forgive the past. I befriend it.
We share a bench. We watch the river.
When it asks if I would change anything,
I say: only the distance I kept from my own heart.`,
  },
  {
    title: "Study Break",
    category: "School",
    content: `Some nights the book is heavier than its pages,
and the clock forgets mercy.
You measure your worth in highlighters and margins,
in the slim applause of checkmarks.

Listen: your brain is not a machine—it is a meadow.
It needs sky, and a minute with wind in it,
and a friend who reminds you your name isn't a grade.

Let the problem rest in its own ink.
Let your shoulders remember what ease feels like.
There is a kind of learning that happens
only when you look up and briefly love the world again.`,
  },
  {
    title: "When It Piles Up",
    category: "Problems",
    content: `It doesn't rain for days—it stacks.
Plates in the sink of the soul, emails like hail.
So many small futures asking to be answered.

Start with a square inch of possible:
one breath, a glass of water, a corner cleared.
Call a friend and borrow their horizon.
Let the list forgive you for being human.

Remember: mountains are moved by knees and minutes,
by the humble choreography of now.
You do not have to fix your life.
You only have to love one piece of it long enough to stay.`,
  },
  {
    title: "Practice of Light",
    category: "Positivity",
    content: `This is not denial. This is discipline—
to name the small lamps as they appear:
steam rising from a cup, a bird insisting on morning,
your own pulse counting you worthy.

Hope is not a mood; it's a practice.
Like watering plants that haven't bloomed yet,
like saving a seat for someone you haven't met.
Today, let your faith be ordinary and stubborn—
the way the sun keeps showing up for windows.`,
  },
  {
    title: "People I Have Been",
    category: "People",
    content: `I have been the loud room and the quiet chair,
the last to leave and the first to worry.
I have been both apology and echo,
and I have learned to bless each version.

If you meet me on a day I am small,
know I am saving space for someone else inside me.
If you meet me on a day I am bright,
know you are seeing the light that others handed me.

We are a relay of kindness, a hand-to-hand dawn.
And even when we forget each other,
we keep the sky lit for the next traveler.`,
  },
  {
    title: "After the Storm",
    category: "Healing",
    content: `You don't have to hurry your mending.
Even the shore negotiates with the sea.
Pick up the pieces that know your name,
leave the ones that belonged to the wave.

One day, you will laugh and not flinch at the echo.
One day, tenderness will knock and you will let it in.
Until then, be a harbor to yourself—
deep enough for rest, shallow enough for light.`,
  },
]

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
  const [poems, setPoems] = useState<Poem[]>(fallbackPoems)
  const [offset, setOffset] = useState(0) // rotation within the day
  const [ambientOn, setAmbientOn] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [bgMode, setBgMode] = useState<"river" | "beach" | "waves" | "night" | "lake" | "none">("river")
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // For vivid backgrounds per request, ignore reduced motion for background layers
  const bgAnimEnabled = true
  // Remixed poem state
  const [remixedPoem, setRemixedPoem] = useState<string>("");
  const [showRemix, setShowRemix] = useState(false);
  // Generate a remixed poem on demand
  const handleRemix = async () => {
    const poem = await generateRemixedPoem();
    setRemixedPoem(poem);
    setShowRemix(true);
  };
  const handleCloseRemix = () => {
    setShowRemix(false);
  };

  // Load poems from a single JSON file in public folder
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch("/data/daiy-poems.json", { cache: "force-cache" })
        if (res.ok) {
          const list = (await res.json()) as Poem[]
          if (active && Array.isArray(list) && list.length > 0) setPoems(list)
        }
      } catch {
        // ignore and keep fallback
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const poem = useMemo(() => {
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
    try {
      const suppressed = localStorage.getItem(storageKey)
      if (!suppressed) setOpen(true)
      const savedOffset = localStorage.getItem(offsetKey)
      if (savedOffset) setOffset(parseInt(savedOffset, 10) || 0)
      const savedBg = localStorage.getItem(bgKey) as typeof bgMode | null
      if (savedBg === "river" || savedBg === "beach" || savedBg === "waves" || savedBg === "night" || savedBg === "lake" || savedBg === "none") setBgMode(savedBg)
    } catch {}
  }, [storageKey, offsetKey])

  // Typewriter effect with gentle pacing and auto-scroll; respect prefers-reduced-motion
  useEffect(() => {
    if (!open) return
    setTyped("")
    setDone(false)
    const text = poem.content
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
  }, [open, poem.content])

  const dontShowAgainToday = () => {
    try {
      localStorage.setItem(storageKey, "1")
    } catch {}
    setOpen(false)
  }

  const seeAnother = async () => {
    setOffset(prev => {
      const next = prev + 1
      try { localStorage.setItem(offsetKey, String(next)) } catch {}
      return next
    });
    // Automatically generate a remixed poem when seeing another
    const poem = await generateRemixedPoem();
    setRemixedPoem(poem);
    setShowRemix(true);
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

  return (
    <>
      {/* Remixed Poem Modal */}
      {showRemix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <h2 className="text-lg font-semibold mb-2">AI-Remixed Poem</h2>
            <pre className="mb-4 text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">{remixedPoem}</pre>
            <button
              className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
              onClick={handleCloseRemix}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* ...existing modal code... */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl md:max-w-2xl p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
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

          <div className="relative p-6 md:p-8 bg-background/70 backdrop-blur-xl">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs uppercase tracking-wider">
                  Today’s Whisper
                </Badge>
                <Badge variant="secondary" className="text-xs">{poem.category}</Badge>
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-serif leading-tight">
                {poem.title}
              </DialogTitle>
              <DialogDescription className="sr-only">A daily poem to inspire reflection.</DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <ScrollArea ref={scrollAreaRef} className="h-64 md:h-80 rounded-md border bg-background/30">
                <div className="p-4 md:p-6 font-mono text-[0.95rem] leading-7 whitespace-pre-wrap">
                  {typed}
                  <span className="ml-0.5 inline-block h-5 align-[-2px] w-[2px] bg-foreground animate-[blink_1s_steps(2,start)_infinite]" />
                </div>
              </ScrollArea>
            </div>

            <div className="mt-6 flex flex-col gap-2 w-full">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2 order-2 sm:order-1 w-full">
                <Button variant={ambientOn ? "default" : "outline"} onClick={() => setAmbientOn(v => !v)} className="w-full sm:w-auto">
                  {ambientOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}Ambient sound
                </Button>
                <Button variant="outline" onClick={seeAnother} className="w-full sm:w-auto">
                  <Shuffle className="h-4 w-4 mr-2" /> See another
                </Button>
                {/* Background mode selectors */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1 w-full">
                  <Button variant={bgMode === 'river' ? 'default' : 'outline'} onClick={() => changeBg('river')} className="w-full sm:w-auto text-sm px-3 py-2">River</Button>
                  <Button variant={bgMode === 'beach' ? 'default' : 'outline'} onClick={() => changeBg('beach')} className="w-full sm:w-auto text-sm px-3 py-2">Beach</Button>
                  <Button variant={bgMode === 'waves' ? 'default' : 'outline'} onClick={() => changeBg('waves')} className="w-full sm:w-auto text-sm px-3 py-2">Waves</Button>
                  <Button variant={bgMode === 'night' ? 'default' : 'outline'} onClick={() => changeBg('night')} className="w-full sm:w-auto text-sm px-3 py-2">Night Sea</Button>
                  <Button variant={bgMode === 'lake' ? 'default' : 'outline'} onClick={() => changeBg('lake')} className="w-full sm:w-auto text-sm px-3 py-2">Misty Lake</Button>
                  <Button variant={bgMode === 'none' ? 'default' : 'outline'} onClick={() => changeBg('none')} className="w-full sm:w-auto text-sm px-3 py-2">None</Button>
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
