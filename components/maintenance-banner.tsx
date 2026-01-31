"use client"

import React, { useEffect, useState, useRef, useLayoutEffect } from "react"
import { X } from 'lucide-react'

const DISMISS_KEY = 'maintenance_banner_dismiss_until'
const DISMISS_HOURS = 6 // dismiss duration in hours

export default function MaintenanceBanner() {
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [marquee, setMarquee] = useState(false)
  const [marqueeDuration, setMarqueeDuration] = useState(10)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const messageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // check dismissal state
    try {
      const raw = localStorage.getItem(DISMISS_KEY)
      if (raw) {
        const ts = Number(raw)
        if (!Number.isNaN(ts) && Date.now() < ts) setDismissed(true)
        else localStorage.removeItem(DISMISS_KEY)
      }
    } catch (e) {}

    let mounted = true
    let timer: number | undefined

    async function fetchState() {
      try {
        const res = await fetch('/api/chronicles/maintenance')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        setEnabled(Boolean(data?.maintenance_mode))
        setMessage(data?.maintenance_message ?? null)
      } catch (e) {
        // silent
      }
    }

    fetchState()
    timer = window.setInterval(fetchState, 3000)

    return () => {
      mounted = false
      if (timer) clearInterval(timer)
    }
  }, [])

  useLayoutEffect(() => {
    // compute marquee if message overflows and set banner height for header offset
    const mEl = messageRef.current
    const container = containerRef.current
    if (!mEl || !container) return

    const GAP = 48 // px gap between duplicated messages for smooth loop

    const check = () => {
      const cw = container.clientWidth
      const mw = mEl.scrollWidth
      // distance is total scroll distance for smooth continuous loop (message width + gap)
      const totalDistance = mw + GAP

      if (mw > cw) {
        setMarquee(true)
        const pixelsPerSecond = 60
        const duration = Math.max(8, Math.ceil(totalDistance / pixelsPerSecond))
        setMarqueeDuration(duration)
        // set CSS vars for animation
        mEl.style.setProperty('--marquee-distance', '-' + totalDistance + 'px')
        mEl.style.setProperty('--marquee-duration', String(duration) + 's')
        mEl.style.setProperty('--marquee-gap', GAP + 'px')
      } else {
        setMarquee(false)
        mEl.style.removeProperty('--marquee-distance')
        mEl.style.removeProperty('--marquee-duration')
        mEl.style.removeProperty('--marquee-gap')
      }

      // set CSS var for banner height to push header down when header is sticky
      const height = container.getBoundingClientRect().height
      try { document.documentElement.style.setProperty('--maintenance-banner-height', Math.ceil(height) + 'px') } catch (e) {}
    }

    check()
    const t = window.setTimeout(check, 120)
    window.addEventListener('resize', check)

    return () => {
      window.removeEventListener('resize', check)
      try { document.documentElement.style.setProperty('--maintenance-banner-height', '0px') } catch (e) {}
      clearTimeout(t)
    }
  }, [message])

  const dismiss = () => {
    try {
      const until = Date.now() + DISMISS_HOURS * 60 * 60 * 1000
      localStorage.setItem(DISMISS_KEY, String(until))
      setDismissed(true)
    } catch (e) {}
  }

  if (!enabled || dismissed) return null

  return (
    <div role="region" aria-label="Site maintenance notice" className="w-full">
      <div ref={containerRef} className="w-full bg-gradient-to-r from-[#fff7f6] via-[#fff2f0] to-[#feecea] text-foreground dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 dark:text-white border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center gap-4">
          <div className="flex-shrink-0 w-8 h-8">
            <img src="/lightlogo.png" alt="Whispr" className="dark:hidden w-full h-full object-contain" />
            <img src="/darklogo.png" alt="Whispr" className="hidden dark:block w-full h-full object-contain" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="overflow-hidden">
              <div className={`relative w-full` }>
                <div
                  ref={messageRef}
                  className={`inline-block whitespace-nowrap text-sm sm:text-base font-semibold ${marquee ? 'marquee-track' : ''}`}>
                  {/* duplicated content for smooth marquee loop */}
                  <span className="mr-3">Maintenance mode is active.</span>
                  <span className="font-normal text-muted-foreground">{message ?? 'We are performing scheduled maintenance. Some features may be unavailable; we expect to be back shortly.'}</span>
                  {marquee && <span className="marquee-gap" />}
                  {marquee && (
                    <>
                      <span className="mr-3">Maintenance mode is active.</span>
                      <span className="font-normal text-muted-foreground">{message ?? 'We are performing scheduled maintenance. Some features may be unavailable; we expect to be back shortly.'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 ml-2">
            <button aria-label="Dismiss maintenance banner" onClick={dismiss} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
