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

  return (
    <footer className="border-t bg-background/95 backdrop-blur">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            </ul>
          </div>

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
            Made with <Heart className="h-4 w-4 text-primary" /> for all lovers of art and words.
          </p>
          <p className="flex items-center justify-center gap-1">
            All files, media, poetry, blogs, elements of this website are the property of Whispr or its content creators and are protected by copyright laws. <br />Unauthorized use, reproduction, or distribution of any content from this site is strictly prohibited. Please contact us for permissions. © Whispr. All rights reserved. Do not reproduce or distribute without permission.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Whispr. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
