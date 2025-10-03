<<<<<<< HEAD
import Link from "next/link"
import { Heart } from "lucide-react"

export function Footer() {
=======
"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { PushNotificationManager } from "@/components/push-notification-manager"

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

>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
  return (
    <footer className="border-t bg-background/95 backdrop-blur">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
<<<<<<< HEAD
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">W</span>
              </div>
              <span className="font-serif text-xl font-bold">Whispr</span>
            </Link>
            <p className="text-sm text-muted-foreground">Where words find their voice in the quiet moments.</p>
          </div>

=======
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
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
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
            </ul>
          </div>

<<<<<<< HEAD
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <p className="text-sm text-muted-foreground">Follow the whispers and stay updated with new writings.</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            Made with <Heart className="h-4 w-4 text-primary" /> for the love of words
=======
          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Follow the whispers and stay updated with new writings.
            </p>
            {isSubscribed && <PushNotificationManager compact={true} />}
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            Crafted with <Heart className="h-4 w-4 text-primary" /> for the literary community.
          </p>
          <p className="mt-3">
            All content on this site — including text, images, audio, and other media — is the intellectual property of Whispr or its respective contributors and is protected by copyright and related laws. Unauthorized reproduction, distribution, or derivative use is prohibited. For licensing or permissions, please contact us.
          </p>
          <p className="mt-4">
            © {new Date().getFullYear()} Whispr. All rights reserved.
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
          </p>
        </div>
      </div>
    </footer>
  )
}
