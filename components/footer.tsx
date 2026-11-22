"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, FileText, Shield, Github, Instagram, Facebook, Youtube, Music2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { PushNotificationManager } from "@/components/push-notification-manager"

/*
 * Social profiles. Every handle is @whisprwords; the URLs are declared now so
 * the footer, llms.txt and Organization schema all point at the same places as
 * each account goes live. `rel="me"` on each link is the identity signal that
 * ties these profiles to whisprwords.com for search and AI engines.
 */
const SOCIALS = [
  { label: "X (Twitter)", href: "https://x.com/whisprwords", Icon: XIcon },
  { label: "Instagram", href: "https://www.instagram.com/_whisprwords", Icon: Instagram },
  { label: "Pinterest", href: "https://www.pinterest.com/whisprwords", Icon: PinterestIcon },
  { label: "Facebook", href: "https://facebook.com/people/Whispr-Words/61596775979642/", Icon: Facebook },
  { label: "TikTok", href: "https://www.tiktok.com/@whisprwords", Icon: TikTokIcon },
  { label: "YouTube", href: "https://www.youtube.com/@whisprwrites", Icon: Youtube },
  { label: "Threads", href: "https://www.threads.com/@whisprwords", Icon: ThreadsIcon },
  { label: "Medium", href: "https://medium.com/@whisprwords", Icon: MediumIcon },
  { label: "Substack", href: "https://whisprwords.substack.com", Icon: Music2 },
  { label: "GitHub", href: "https://github.com/whisprwords", Icon: Github },
]

/* Lucide dropped its brand icons, so the few we need are inlined as SVG. */
type IconProps = { className?: string }

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function PinterestIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
    </svg>
  )
}

function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

function ThreadsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
    </svg>
  )
}

function MediumIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  )
}

export function Footer() {
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const { isSubscribed } = usePushNotifications()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const logoSrc = hasMounted
    ? theme === "dark"
      ? "/lightlogo.png"
      : "/darklogo.png"
    : "/darklogo.png" // Fallback during SSR

  return (
    <footer className="border-t bg-background/95 backdrop-blur">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="h-10 w-10 relative"
              >
                <Image
                  src={logoSrc}
                  alt="Whispr logo"
                  fill
                  className="rounded-full object-cover"
                />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="font-serif text-xl font-bold"
              >
                Whispr
              </motion.span>
            </Link>
            <p className="text-sm text-muted-foreground">
              ...from silence to whispers, from whispers to words
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/poems" className="hover:text-primary transition-colors">
                  Poems
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/download" className="hover:text-primary transition-colors font-semibold text-[#911A1B] dark:text-red-100 dark:hover:text-red-500">
                  Download App
                </Link>
              </li>
              <li>
                <Link href="/opportunities" className="hover:text-primary transition-colors">
                  Opportunities
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Follow the whispers and stay updated with new writings.
            </p>
            {isSubscribed && <PushNotificationManager compact={true} />}
            <Link href="/community" className="text-sm hover:text-primary transition-colors font-semibold text-[#911A1B] dark:text-red-100 dark:hover:text-red-500">
              Community
            </Link>
            <ul className="space-y-2 text-sm text-muted-foreground pt-2">
              <li>
                <Link href="/chronicles" className="hover:text-primary transition-colors">
                  Chronicles
                </Link>
              </li>
              <li>
                <Link href="/feature-requests" className="hover:text-primary transition-colors">
                  Feature Request
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link 
                  href="/terms" 
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/changelog" 
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Socials */}
        <div className="mt-10 pt-8 border-t">
          <div className="flex flex-col items-center gap-4">
            <h3 className="font-serif text-lg font-semibold">Find Whispr everywhere</h3>
            <p className="max-w-md text-center text-sm text-muted-foreground">
              Daily poems, behind-the-scenes writing notes and new stories — follow{" "}
              <span className="font-medium text-foreground">@whisprwords</span>.
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {SOCIALS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label={`Whispr on ${label}`}
                    title={label}
                    className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          {/* <p className="flex items-center justify-center gap-1">
            Crafted with <Heart className="h-4 w-4 text-primary" /> for the literary community.
          </p> */}
          <p className="mt-3">
            All content on this site — including text, images, audio, and other media — is the intellectual property of Whispr or its respective contributors and is protected by copyright and related laws. Unauthorized reproduction, distribution, or derivative use is prohibited. For licensing or permissions, please contact us.
          </p>
          <p className="mt-4">
            © {new Date().getFullYear()} Whispr. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
