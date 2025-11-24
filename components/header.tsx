"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LayoutDashboard, Share2, Twitter, Facebook, Copy, MessageSquare as WhatsAppIcon } from "lucide-react"
import ReactDOM from 'react-dom'
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useToast } from '@/hooks/use-toast'
import { ChroniclesTeaserBanner } from "@/components/chronicles-teaser-banner"

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [chroniclesEnabled, setChroniclesEnabled] = useState(false)
  const { toast } = useToast()
  const [sharePreviewOpen, setSharePreviewOpen] = useState(false)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [includeTracking, setIncludeTracking] = useState(true)

  useEffect(() => setHasMounted(true), [])

  // admin detection
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/session')
        if (!mounted) return
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setIsAdmin(Boolean(data?.authenticated))
      } catch (e) {}
    })()
    return () => { mounted = false }
  }, [])

  // Check if Chronicles feature is enabled
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/chronicles/settings')
        if (!mounted) return
        if (!res.ok) return
        const data = await res.json()
        if (mounted && data?.feature_enabled) {
          setChroniclesEnabled(true)
        }
      } catch (e) {}
    })()
    return () => { mounted = false }
  }, [])

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: "Poems", href: "/poems" },
    { name: "Spoken Words", href: "/media" },
    { name: "About", href: "/about" },
    { name: "whispr Wall", href: "/whispr-wall" },
    ...(chroniclesEnabled ? [{ name: "Chronicles", href: "/chronicles" }] : []),
  ]

  const logoSrc = hasMounted ? (theme === 'dark' ? '/lightlogo.png' : '/darklogo.png') : '/darklogo.png'

  // click outside handler for desktop preview
  useEffect(() => {
    if (!sharePreviewOpen) return
    function onDocClick(e: MouseEvent) {
      try {
        if (!previewRef.current) return
        const target = e.target as Node
        if (!previewRef.current.contains(target)) setSharePreviewOpen(false)
      } catch (e) {}
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setSharePreviewOpen(false) }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey) }
  }, [sharePreviewOpen])

  // helper to build tracked URL
  function buildTrackedUrl(orig: string) {
    try {
      const urlObj = new URL(orig)
      if (includeTracking) {
        const params = new URLSearchParams(urlObj.search)
        params.set('utm_source', 'share')
        params.set('utm_medium', 'referral')
        params.set('utm_campaign', 'whispr_share')
        urlObj.search = params.toString()
      }
      return urlObj.toString()
    } catch (e) { return orig }
  }

  async function recordShare(url: string, source: string) {
    try {
      const res = await fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, source, utm: includeTracking, user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '' }) })
      const json = await res.json()
      if (json?.ok && json?.share?.id) {
        try { toast({ title: 'Share recorded', description: `id: ${json.share.id}`, duration: 3500 }) } catch (e) {}
      }
    } catch (e) {}
    try { navigator.serviceWorker?.controller?.postMessage?.({ type: 'thank-you-share', payload: { message: 'Thanks for sharing Whispr!' } }) } catch (e) {}
  }

  // mobile modal renderer into body
  function MobilePreviewPortal() {
    if (!mobilePreviewOpen || typeof window === 'undefined') return null
    const content = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobilePreviewOpen(false)} />
        <div onClick={(e) => e.stopPropagation()} className="relative z-50 w-full max-w-md bg-background border rounded-lg p-4 mx-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-medium">Share Whispr</div>
            <button onClick={() => setMobilePreviewOpen(false)} className="text-sm text-muted-foreground">Close</button>
          </div>

          <div className="text-sm text-muted-foreground mb-2">Preview and quick-share options. Toggle tracking to add a UTM/ref to the URL.</div>

          <pre className="whitespace-pre-wrap text-sm bg-muted/10 p-2 rounded mb-2 break-words">{`${"Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable."}\n\n${typeof window !== 'undefined' ? window.location.href : ''}`}</pre>

          <div className="flex items-center gap-2 mb-2">
            <a className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/20" target="_blank" rel="noreferrer" href={(() => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); const text = 'Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable.'; return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` })()} onClick={async () => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); await recordShare(url, 'x'); setMobilePreviewOpen(false) }}>
              {/* <Twitter className="w-4 h-4" /> */}
              <span className="text-sm">X</span>
            </a>

            <a className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/20" target="_blank" rel="noreferrer" href={(() => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); const text = 'Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable.'; const wa = `${text}\n\n${url}`; return `https://wa.me/?text=${encodeURIComponent(wa)}` })()} onClick={async () => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); await recordShare(url, 'whatsapp'); setMobilePreviewOpen(false) }}>
              <WhatsAppIcon className="w-4 h-4" />
              <span className="text-sm">WhatsApp</span>
            </a>

            <a className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/20" target="_blank" rel="noreferrer" href={(() => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` })()} onClick={async () => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); await recordShare(url, 'facebook'); setMobilePreviewOpen(false) }}>
              <Facebook className="w-4 h-4" />
              <span className="text-sm">Facebook</span>
            </a>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button size="sm" onClick={async () => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); const composed = `Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable.\n\n${url}`; try { await navigator.clipboard.writeText(composed); toast({ title: 'Copied', description: 'Share message copied to clipboard', duration: 2500 }) } catch (e) { try { toast({ title: 'Copy failed', description: 'Please copy the message manually', duration: 4000 }) } catch (e) {} } try { await recordShare(url, 'copy') } catch (e) {} setMobilePreviewOpen(false) }}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
        </div>
      </div>
    )
    return ReactDOM.createPortal(content, document.body)
  }

  return (
    <>
      <ChroniclesTeaserBanner />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Sponsored posts ticker */}
      <div className="w-full bg-primary/5 border-b">
        <div className="container text-sm py-2 flex items-center justify-between">
          <div className="overflow-hidden whitespace-nowrap w-full pr-4">
            <div className="marquee inline-block animate-marquee">
                <span className="mr-8 text-xs sm:text-xs md:text-sm lg:text-xs">Get in touch to advertise on Whispr!</span>
                <span className="mr-8 text-xs sm:text-xs md:text-sm lg:text-xs">Want to feature your product?</span>
              {/* <a href="mailto:whisprwords@gmail.com" className="underline font-medium">advertise@whisprwords</a> */}
            </div>
          </div>
          <div className="ml-4">
            <a href="mailto:whisprwords@gmail.com" className="inline-flex items-center px-3 py-1 rounded bg-primary text-white text-sm">Advertise</a>
          </div>
        </div>
      </div>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 300 }} className="h-12 w-12 relative md:h-14 md:w-14">
            <Image src={logoSrc} alt="Whispr logo" fill className="rounded-full object-cover" priority />
          </motion.div>
          <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="font-serif text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Whispr</motion.span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className={`text-sm font-medium transition-colors hover:text-primary ${pathname === item.href ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'}`}>{item.name}</Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {hasMounted && isAdmin && (
            <Link href="/admin/dashboard" className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><LayoutDashboard className="h-4 w-4" /><span className="hidden lg:inline">Dashboard</span></Link>
          )}

          <ThemeToggle />

          <div className="relative">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex items-center gap-2" onClick={() => setSharePreviewOpen((v) => !v)}>
              <Share2 className="w-4 h-4" />
              <span className="hidden lg:inline">Share</span>
            </Button>

            {sharePreviewOpen && (
              <div ref={(el) => { previewRef.current = el }} className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-background border rounded shadow-lg p-3 z-50">
                <div className="text-sm text-muted-foreground mb-2">Share message</div>
                <div className="text-xs text-muted-foreground mb-2">Preview and quick-share options. Toggle tracking to add a UTM/ref to the URL.</div>
                <pre className="whitespace-pre-wrap text-sm bg-muted/10 p-2 rounded mb-2 break-words">{`${"Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable."}\n\n${typeof window !== 'undefined' ? window.location.href : ''}`}</pre>

                <div className="flex items-center gap-2 mb-2">
                  <a className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/20" target="_blank" rel="noreferrer" href={(() => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); const text = 'Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable.'; return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` })()} onClick={async () => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); await recordShare(url, 'x') }}>
                    {/* <Twitter className="w-4 h-4" /> */}
                    <span className="text-sm">X</span>
                  </a>

                  <a className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/20" target="_blank" rel="noreferrer" href={(() => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); const text = 'Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable.'; const wa = `${text}\n\n${url}`; return `https://wa.me/?text=${encodeURIComponent(wa)}` })()} onClick={async () => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); await recordShare(url, 'whatsapp') }}>
                    <WhatsAppIcon className="w-4 h-4" />
                    <span className="text-sm">WhatsApp</span>
                  </a>

                  <a className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/20" target="_blank" rel="noreferrer" href={(() => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` })()} onClick={async () => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); await recordShare(url, 'facebook') }}>
                    <Facebook className="w-4 h-4" />
                    <span className="text-sm">Facebook</span>
                  </a>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" onClick={async () => { const url = buildTrackedUrl(typeof window !== 'undefined' ? window.location.href : 'https://whispr.example'); const composed = `Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable.\n\n${url}`; try { await navigator.clipboard.writeText(composed); toast({ title: 'Copied', description: 'Share message copied to clipboard', duration: 2500 }) } catch (e) { try { toast({ title: 'Copy failed', description: 'Please copy the message manually', duration: 4000 }) } catch (e) {} } try { await recordShare(url, 'copy') } catch (e) {} setSharePreviewOpen(false) }}>
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSharePreviewOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container py-4 space-y-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => setMobileMenuOpen(false)}>
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t">
              {isAdmin && (
                <div className="space-y-2">
                  <Link href="/admin/messages" className="block py-2 text-sm font-medium transition-colors hover:text-primary text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Messages</Link>
                  <Link href="/admin/dashboard" className="block py-2 text-sm font-medium transition-colors hover:text-primary text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                </div>
              )}
              <div className="pt-3">
                <button onClick={() => { setMobileMenuOpen(false); setMobilePreviewOpen(true) }} className="w-full text-left py-2 text-sm font-medium flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share Whispr
                </button>
              </div>
            </div>
          </nav>
        </motion.div>
      )}

      {MobilePreviewPortal()}
    </header>
    </>
  )
}
