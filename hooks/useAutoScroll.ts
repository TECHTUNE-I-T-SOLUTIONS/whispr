import { useEffect, useRef, useState, useCallback } from 'react'

type AutoScrollOptions = {
  enabled?: boolean
  speed?: number // pixels per second
  direction?: 'down' | 'up' // scroll direction
}

export function useAutoScroll(containerRef: React.RefObject<HTMLElement>, options: AutoScrollOptions = {}) {
  const { enabled = false, speed = 30, direction = 'up' } = options
  const [isScrolling, setIsScrolling] = useState(false)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    // Ensure we have a valid container
    if (!containerRef.current) {
      return
    }

    if (!enabled) {
      // Clean up when disabled
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      lastTimeRef.current = null
      setIsScrolling(false)
      return
    }

    const container = containerRef.current
    
    // Initialize position - start at bottom for upward scrolling
    if (!isInitializedRef.current) {
      try {
        container.scrollTop = container.scrollHeight - container.clientHeight
        isInitializedRef.current = true
      } catch (e) {
        console.error('Error initializing scroll position:', e)
        return
      }
    }

    setIsScrolling(true)
    lastTimeRef.current = null

    const animate = (now: number) => {
      try {
        if (!containerRef.current) return
        
        if (!lastTimeRef.current) {
          lastTimeRef.current = now
        }

        const elapsed = (now - lastTimeRef.current) / 1000 // seconds
        lastTimeRef.current = now

        const scrollAmount = speed * elapsed // pixels to scroll

        if (direction === 'up') {
          containerRef.current.scrollTop -= scrollAmount

          // Stop when reaching the top
          if (containerRef.current.scrollTop <= 0) {
            containerRef.current.scrollTop = 0
            setIsScrolling(false)
            lastTimeRef.current = null
            isInitializedRef.current = false
            return
          }
        } else {
          containerRef.current.scrollTop += scrollAmount

          // Stop when reaching the bottom
          if (containerRef.current.scrollTop >= containerRef.current.scrollHeight - containerRef.current.clientHeight) {
            setIsScrolling(false)
            lastTimeRef.current = null
            isInitializedRef.current = false
            return
          }
        }

        animationRef.current = requestAnimationFrame(animate)
      } catch (e) {
        console.error('Error during scroll animation:', e)
        setIsScrolling(false)
        lastTimeRef.current = null
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [enabled, speed, direction])

  const toggle = useCallback(() => setIsScrolling(prev => !prev), [])
  const stop = useCallback(() => {
    setIsScrolling(false)
    isInitializedRef.current = false
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])
  
  const start = useCallback(() => setIsScrolling(true), [])
  
  const reset = useCallback(() => {
    try {
      if (containerRef.current) {
        if (direction === 'up') {
          containerRef.current.scrollTop = containerRef.current.scrollHeight - containerRef.current.clientHeight
        } else {
          containerRef.current.scrollTop = 0
        }
      }
      setIsScrolling(false)
      lastTimeRef.current = null
      isInitializedRef.current = false
    } catch (e) {
      console.error('Error resetting scroll:', e)
    }
  }, [direction])

  return { isScrolling, toggle, start, stop, reset }
}
