"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LayoutDashboard, MessageSquare, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useToast } from '@/hooks/use-toast'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Determine if admin is logged in (server session endpoint)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/session')
        if (!mounted) return
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setIsAdmin(Boolean(data?.authenticated))
      } catch (err) {
        // ignore
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: "Poems", href: "/poems" },
    { name: "Spoken Words", href: "/media" },
    { name: "About", href: "/about" },
    { name: "whispr Wall", href: "/whispr-wall" },
  ]

  const logoSrc = hasMounted
    ? theme === "dark"
      ? "/lightlogo.png"
      : "/darklogo.png"
    : "/darklogo.png" // Default for SSR (safe fallback)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="h-12 w-12 relative md:h-14 md:w-14"
          >
            <Image
              src={logoSrc}
              alt="Whispr logo"
              fill
              className="rounded-full object-cover"
              priority
            />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="font-serif text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
          >
            Whispr
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Admin dashboard shortcut for logged-in admins */}
          {hasMounted && isAdmin && (
            <Link href="/admin/dashboard" className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden lg:inline">Dashboard</span>
            </Link>
          )}

          <ThemeToggle />

          {/* Share button: desktop/tablet */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex items-center gap-2"
            onClick={async () => {
              const url = typeof window !== 'undefined' ? window.location.origin : 'https://whispr.example'
              const shareUrl = url
              const shareText = "Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable."
              const composed = `${shareText}\n\n${shareUrl}`
              try {
                if (navigator.share) {
                  // Include the composed message in the `text` field and also provide the URL separately.
                  // Some platforms prefer the `text` payload; embedding the URL in `text` ensures recipients
                  // receive the full precomposed message even if the target app ignores `text` when `url` is present.
                  await navigator.share({ title: 'Whispr', text: composed, url: shareUrl })
                  try { toast({ title: 'Thanks for sharing!', duration: 3000 }) } catch (e) {}
                  return
                }
              } catch (e) {
                // fallthrough to clipboard fallback
              }

              // Clipboard fallback: copy the full composed message (text + URL)
              try {
                await navigator.clipboard.writeText(composed)
                try { toast({ title: 'Link copied to clipboard', description: 'You can now paste and share it anywhere.', duration: 3000 }) } catch (e) {}
              } catch (err) {
                try { toast({ title: 'Unable to share', description: 'Copy this link manually: ' + shareUrl, duration: 4000 }) } catch (e) {}
              }
            }}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden lg:inline">Share</span>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="md:hidden border-t bg-background/95 backdrop-blur"
        >
          <nav className="container py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t">
              {/* Mobile admin quick links */}
                  {isAdmin && (
                <div className="space-y-2">
                  <Link href="/admin/messages" className="block py-2 text-sm font-medium transition-colors hover:text-primary text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                    Messages
                  </Link>
                  <Link href="/admin/dashboard" className="block py-2 text-sm font-medium transition-colors hover:text-primary text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                </div>
              )}
              <div className="pt-3">
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false)
                    const url = typeof window !== 'undefined' ? window.location.origin : 'https://whispr.example'
                    const shareUrl = url
                    const shareText = "Whispr — bite-sized poems, spoken word, and stories that spark curiosity. Discover something unforgettable."
                    const composed = `${shareText}\n\n${shareUrl}`
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: 'Whispr', text: composed, url: shareUrl })
                        try { toast({ title: 'Thanks for sharing!', duration: 3000 }) } catch (e) {}
                        return
                      }
                    } catch (e) {}

                    try {
                      await navigator.clipboard.writeText(composed)
                      try { toast({ title: 'Link copied to clipboard', description: 'You can now paste and share it anywhere.', duration: 3000 }) } catch (e) {}
                    } catch (err) {
                      try { toast({ title: 'Unable to share', description: 'Copy this link manually: ' + shareUrl, duration: 4000 }) } catch (e) {}
                    }
                  }}
                  className="w-full text-left py-2 text-sm font-medium flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Whispr
                </button>
              </div>
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  )
}
