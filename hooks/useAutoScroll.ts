import { useEffect, useRef, useState } from 'react'

type AutoScrollOptions = {
  enabled?: boolean
  speed?: number // pixels per second
  direction?: 'down' | 'up' // scroll direction
}

export function useAutoScroll(containerRef: React.RefObject<HTMLElement>, options: AutoScrollOptions = {}) {
  const { enabled = false, speed = 30, direction = 'down' } = options
  const [isScrolling, setIsScrolling] = useState(false)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      setIsScrolling(false)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      lastTimeRef.current = null
      return
    }

    const container = containerRef.current
    
    // Reset to bottom for upward scrolling
    if (direction === 'up') {
      container.scrollTop = container.scrollHeight - container.clientHeight
    } else {
      container.scrollTop = 0
    }
    
    setIsScrolling(true)
    lastTimeRef.current = null

    function scroll(now: number) {
      if (!lastTimeRef.current) lastTimeRef.current = now
      const elapsed = (now - lastTimeRef.current) / 1000 // seconds
      lastTimeRef.current = now

      const scrollAmount = (speed * elapsed) * 2 // Increase multiplier for more visible scrolling

      if (direction === 'up') {
        container.scrollTop -= scrollAmount
        
        if (container.scrollTop <= 0) {
          container.scrollTop = 0
          setIsScrolling(false)
          lastTimeRef.current = null
          return
        }
      } else {
        container.scrollTop += scrollAmount
        
        if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
          setIsScrolling(false)
          lastTimeRef.current = null
          return
        }
      }

      animationRef.current = requestAnimationFrame(scroll)
    }

    animationRef.current = requestAnimationFrame(scroll)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      lastTimeRef.current = null
    }
  }, [enabled, speed, containerRef, direction])

  const toggle = () => setIsScrolling(!isScrolling)
  const stop = () => setIsScrolling(false)
  const start = () => setIsScrolling(true)
  const reset = () => {
    if (containerRef.current) {
      if (direction === 'up') {
        containerRef.current.scrollTop = containerRef.current.scrollHeight - containerRef.current.clientHeight
      } else {
        containerRef.current.scrollTop = 0
      }
    }
    setIsScrolling(false)
  }

  return { isScrolling, toggle, start, stop, reset }
}
