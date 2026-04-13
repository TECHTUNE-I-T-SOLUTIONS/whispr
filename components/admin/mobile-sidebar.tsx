"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useRef, useEffect, useState } from "react"
import { Bell, Home, MessageSquareText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  navigation: { name: string; href: string; icon: any }[]
  notificationsUnread: number
}

export function MobileSidebar({ isOpen, onClose, navigation, notificationsUnread }: MobileSidebarProps) {
  const pathname = usePathname()
  const sidebarRef = useRef(null)
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const [messagesUnread, setMessagesUnread] = useState(0)

  useEffect(() => {
    setHasMounted(true)
    // listen for refreshed counts
    const handler = (e: any) => {
      try {
        const detail = e?.detail || {}
        if (typeof detail.unread_count === 'number') setMessagesUnread(detail.unread_count)
      } catch (err) {}
    }
    window.addEventListener('conversations:refreshed', handler as EventListener)

    const convReadHandler = (e: any) => {
      try {
        const detail = e?.detail || {}
        const delta = Number(detail.unreadDelta) || 0
        if (typeof detail.unread_count === 'number') {
          setMessagesUnread(detail.unread_count)
        } else if (delta > 0) {
          setMessagesUnread(prev => Math.max(0, prev - delta))
        }
      } catch (err) {}
    }
    window.addEventListener('conversation:read', convReadHandler as EventListener)

    const storageHandler = (e: StorageEvent) => {
      try {
        if (e.key === 'whispr:conversations:refreshed' && e.newValue) {
          const payload = JSON.parse(e.newValue)
          const data = payload.data
          if (data && typeof data.unread_count === 'number') setMessagesUnread(data.unread_count)
        }
      } catch (err) {}
    }
    window.addEventListener('storage', storageHandler)

    return () => {
      try { window.removeEventListener('conversations:refreshed', handler as EventListener) } catch (e) {}
      try { window.removeEventListener('conversation:read', convReadHandler as EventListener) } catch (e) {}
      try { window.removeEventListener('storage', storageHandler) } catch (e) {}
    }
  }, [])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !(sidebarRef.current as HTMLElement).contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  const logoSrc = hasMounted
    ? theme === "dark"
      ? "/lightlogo.png"
      : "/darklogo.png"
    : "/darklogo.png"

  return (
    <>
      {/* Fullscreen Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-in Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-16 left-0 z-[9999] w-64 h-[calc(100vh-4rem)] bg-background shadow-lg transform transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Navigation */}
        <div className="flex flex-col p-4 space-y-2 overflow-y-auto h-full">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.href === '/admin/messages' && messagesUnread > 0 && (
                <Badge className="ml-auto text-xs">{messagesUnread}</Badge>
              )}
              {item.href === '/admin/notifications' && notificationsUnread > 0 && (
                <Badge className="ml-auto text-xs">{notificationsUnread}</Badge>
              )}
            </Link>
          ))}

          {/* Divider */}
          <div className="my-2 border-t" />

          {/* Additional Links */}
          <Link href="/" onClick={onClose} className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Home className="h-5 w-5 flex-shrink-0" />
            <span>View Site</span>
          </Link>

          <div className="flex items-center space-x-3 px-3 py-2">
            <ThemeToggle />
            <span className="text-sm">Toggle Theme</span>
          </div>
        </div>
      </div>
    </>
  )
}
