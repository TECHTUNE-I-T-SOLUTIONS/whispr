"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, FileText, MessageCircle, Music, Video, BookOpen } from "lucide-react"
// lightweight: avoid framer-motion typing issues in this component
import ShareButton from "@/components/share-button"

type Preview = {
  title?: string
  excerpt?: string
  url?: string
}

type Props = {
  featuredPoem?: Preview
  latestChronicle?: Preview
}

export default function WelcomeHero({ featuredPoem, latestChronicle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight * 0.7)

    const particles = Array.from({ length: Math.min(120, Math.floor(w / 8)) }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 6 + 2,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      hue: Math.floor(190 + Math.random() * 80),
    }))

    let raf = 0
    function draw() {
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.dx
        p.y += p.dy
        if (p.x < -20) p.x = w + 20
        if (p.x > w + 20) p.x = -20
        if (p.y < -20) p.y = h + 20
        if (p.y > h + 20) p.y = -20

        // organic blob using radial gradient
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6)
        g.addColorStop(0, `hsla(${p.hue},70%,60%,0.95)`)
        g.addColorStop(0.4, `hsla(${p.hue},70%,55%,0.5)`)
        g.addColorStop(1, `hsla(${p.hue},70%,30%,0.06)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.r * 6, p.r * 4 + Math.sin(p.x * 0.01) * 2, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // connecting translucent lines
      ctx.lineWidth = 0.6
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2},60%,50%,${0.25 - dist / 600})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.quadraticCurveTo((a.x + b.x) / 2 + 10, (a.y + b.y) / 2 - 10, b.x, b.y)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight * 0.7
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 w-full h-[70vh]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              Whispr — From silence to whispers, from whispers to words
            </h1>
            <p className="mt-6 text-lg text-slate-200 max-w-xl">
              Discover poems, chronicles, audio & video whisprs, and a lively wall of short expressions.
              Share a whisper, listen to someone else's, or dive into thoughtful longform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/chronicles">
                <Button className="flex items-center gap-2">
                  <BookOpen size={16} /> Chronicles
                </Button>
              </Link>
              <Link href="/poems">
                <Button className="flex items-center gap-2">
                  <FileText size={16} /> Poems
                </Button>
              </Link>
              <Link href="/blog">
                <Button className="flex items-center gap-2">
                  <Sparkles size={16} /> Blog
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex gap-3 flex-wrap">
              <Link href="/whispr-wall">
                <Button className="flex items-center gap-2">
                  <MessageCircle size={16} /> Whispr Wall
                </Button>
              </Link>
              <Link href="/media?type=audio">
                <Button className="flex items-center gap-2">
                  <Music size={16} /> Audio
                </Button>
              </Link>
              <Link href="/media?type=video">
                <Button className="flex items-center gap-2">
                  <Video size={16} /> Video
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-tr from-gray-500 to-primary rounded-3xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                  <Sparkles />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">A quick preview</h3>
                  <p className="mt-2 text-sm opacity-90">Read a poem, listen to an audio whispr, and explore a featured chronicle — all in one place.</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <a href={featuredPoem?.url || '/poems'} className="bg-white/6 p-4 rounded-lg block hover:shadow-md transition">
                  <h4 className="font-medium">Featured Poem</h4>
                  <p className="mt-1 text-sm opacity-90 line-clamp-3">{featuredPoem?.excerpt || 'A tender, short poem to begin your day.'}</p>
                </a>
                <a href={latestChronicle?.url || '/chronicles'} className="bg-white/6 p-4 rounded-lg block hover:shadow-md transition">
                  <h4 className="font-medium">Latest Chronicle</h4>
                  <p className="mt-1 text-sm opacity-90 line-clamp-3">{latestChronicle?.excerpt || 'A deep dive into technique, life, and craft.'}</p>
                </a>
                <a href="/whispr-wall" className="bg-white/6 p-4 rounded-lg block hover:shadow-md transition">
                  <h4 className="font-medium">Whispr Wall Snapshot</h4>
                  <p className="mt-1 text-sm opacity-90">Short, human voices — immediate and real.</p>
                </a>
                <div className="mt-2 flex gap-2">
                  <ShareButton shareUrl="/welcome.html" title="Welcome to Whispr" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
