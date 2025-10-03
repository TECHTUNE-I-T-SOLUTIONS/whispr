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
          className="fixed inset-0 z-[9998] bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-in Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-[9999] w-64 h-full bg-background shadow-lg transform transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo/Header */}
        <div className="flex items-center px-4 py-5 border-b space-x-3">
          <div className="relative h-10 w-10 rounded-full overflow-hidden shadow-md">
            <Image
              src={logoSrc}
              alt="Whispr Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-serif text-lg font-semibold">Whispr Admin</span>
        </div>

        {/* Navigation */}
        <div className="flex flex-col p-4 space-y-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center space-x-2 text-sm font-medium ${
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              } hover:text-primary`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}

          <Link href="/admin/notifications" onClick={onClose} className="flex items-center space-x-2 text-muted-foreground hover:text-primary">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
            {notificationsUnread > 0 && (
              <Badge className="ml-auto text-xs">{notificationsUnread}</Badge>
            )}
          </Link>

          {/* Messages link with synced unread count */}
          {/* <Link href="/admin/messages" onClick={onClose} className={`flex items-center space-x-2 text-sm font-medium ${pathname === '/admin/messages' ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}>
            <MessageSquareText className="h-5 w-5" />
            <span>Messages</span>
            {messagesUnread > 0 && (
              <Badge className="ml-auto text-xs">{messagesUnread}</Badge>
            )}
          </Link> */}

          <Link href="/" onClick={onClose} className="flex items-center space-x-2 text-muted-foreground hover:text-primary">
            <Home className="h-5 w-5" />
            <span>View Site</span>
          </Link>

          <div className="flex items-center">
            <ThemeToggle />
            <span className="ml-2 text-sm">Toggle Theme</span>
          </div>
        </div>
      </div>
    </>
  )
}
