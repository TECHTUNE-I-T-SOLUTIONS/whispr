"use client"

import { useSession } from "@/components/admin/session-provider"
import { AdminHeader } from "@/components/admin/admin-header"
import { DesktopSidebar } from "@/components/admin/desktop-sidebar"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { MobileSidebar } from "@/components/admin/mobile-sidebar"
import {
  User, LayoutDashboard, FileEdit, FilePlus2, ImageIcon,
  MessageSquareText, Settings, LogOut, Home, PenTool, MessageSquareHeart,
  FileText, BarChart3, Bell, TrendingUp, Sliders, ClipboardList, MessageCircle, AlertTriangle
} from "lucide-react"
import { usePathname } from "next/navigation"

export default function AdminHeaderWrapper({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useSession()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [messagesUnread, setMessagesUnread] = useState(0)
  const [notificationsUnread, setNotificationsUnread] = useState(0)
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Posts", href: "/admin/posts", icon: FileEdit },
    { name: "New Post", href: "/admin/posts/new", icon: FilePlus2 },
    { name: "Media", href: "/admin/media", icon: ImageIcon },
    { name: "Spoken Words", href: "/admin/spoken-words", icon: PenTool },
    { name: "Comments", href: "/admin/comments", icon: MessageSquareText },
    { name: "Whispr Wall", href: "/admin/whispr-wall", icon: MessageSquareHeart },
    { name: "Messages", href: "/admin/messages", icon: MessageSquareText },
    { name: "Feedback", href: "/admin/feedback", icon: MessageCircle },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Push Subscribers", href: "/admin/push-subscribers", icon: User },
    { name: "Create Notification", href: "/admin/create-notification", icon: Bell },
    { name: "Notification History", href: "/admin/push-history", icon: BarChart3 },
    { name: "Flagged Content", href: "/admin/chronicles/flagged-content", icon: ClipboardList },
    { name: "Error Logs", href: "/admin/error-logs", icon: AlertTriangle },
    // Ads Control Section
    { name: "Ads Control", href: "/admin/ads-control", icon: Sliders },
    // Chronicles Section
    { name: "Chronicles Analytics", href: "/admin/chronicles/analytics", icon: TrendingUp },
    { name: "Chronicles Settings", href: "/admin/chronicles/settings", icon: Sliders },
    { name: "Chronicles Reports", href: "/admin/chronicles/reports", icon: ClipboardList },
  ]

  const excludedRoutes = ["/admin/login", "/admin/signup", "/admin/forgot-password"]

  // ✅ Fetch only if admin is available and not on excluded auth routes
  useEffect(() => {
    if (!admin || excludedRoutes.includes(pathname)) return

    const fetchCounts = async () => {
      try {
        const [mRes, nRes] = await Promise.all([
          fetch("/api/admin/messages/unread-count", { credentials: "include" }),
          fetch("/api/admin/notifications/unread-count", { credentials: "include" }),
        ])
        const mJson = await mRes.json().catch(() => ({ count: 0 }))
        const nJson = await nRes.json().catch(() => ({ count: 0 }))
        if (mRes.ok) setMessagesUnread(mJson.count || 0)
        if (nRes.ok) setNotificationsUnread(nJson.count || 0)
      } catch (error) {
        console.error("Failed to fetch unread counts:", error)
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [admin, pathname])

  // Listen for conversation read events so the header can update immediately
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: any) => {
      try {
        const detail = e?.detail || {}
        const delta = Number(detail.unreadDelta) || 0
        if (delta > 0) {
          setMessagesUnread(prev => Math.max(0, prev - delta))
          return
        }
        // if the event provides an exact unread_count, set it
        if (typeof detail.unread_count === 'number') {
          setMessagesUnread(Math.max(0, detail.unread_count))
          return
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('conversation:read', handler as EventListener)
    return () => window.removeEventListener('conversation:read', handler as EventListener)
  }, [])

  // Listen for conversations:refreshed (exact unread count) events from broadcasts/storage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: any) => {
      try {
        const detail = e?.detail || {}
        if (typeof detail.unread_count === 'number') {
          setMessagesUnread(Math.max(0, detail.unread_count))
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('conversations:refreshed', handler as EventListener)

    const storageHandler = (e: StorageEvent) => {
      try {
        if (e.key === 'whispr:conversations:refreshed' && e.newValue) {
          const payload = JSON.parse(e.newValue)
          const data = payload.data
          if (data && typeof data.unread_count === 'number') {
            setMessagesUnread(Math.max(0, data.unread_count))
          }
        }
      } catch (err) {}
    }
    window.addEventListener('storage', storageHandler)

    return () => {
      try { window.removeEventListener('conversations:refreshed', handler as EventListener) } catch (e) {}
      try { window.removeEventListener('storage', storageHandler) } catch (e) {}
    }
  }, [])

  // Don't show header on excluded routes
  if (excludedRoutes.includes(pathname)) {
    return <>{children}</>
  }

  // ⏳ Show loading while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not logged in — let auth pages render
  if (!admin) return <>{children}</>

  // ✅ Logged in — show layout
  return (
    <>
      <AdminHeader
        admin={admin}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        messagesUnread={messagesUnread}
        notificationsUnread={notificationsUnread}
      />
      <DesktopSidebar
        navigation={navigation}
        messagesUnread={messagesUnread}
        notificationsUnread={notificationsUnread}
      />
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        navigation={navigation}
        notificationsUnread={notificationsUnread}
      />
      <div className="lg:ml-64 pt-16">
        {children}
      </div>
    </>
  )
}
