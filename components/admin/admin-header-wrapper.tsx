"use client"

import { useSession } from "@/components/admin/session-provider"
import { AdminHeader } from "@/components/admin/admin-header"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { MobileSidebar } from "@/components/admin/mobile-sidebar"
import {
  User, LayoutDashboard, FileEdit, FilePlus2, ImageIcon,
  MessageSquareText, Settings, LogOut, Home, PenTool, MessageSquareHeart,
  FileText, BarChart3, Bell
} from "lucide-react"
import { usePathname } from "next/navigation"

export default function AdminHeaderWrapper({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useSession()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Posts", href: "/admin/posts", icon: FileEdit },
  { name: "New Post", href: "/admin/posts/new", icon: FilePlus2 },
  { name: "Media", href: "/admin/media", icon: ImageIcon },
  { name: "Comments", href: "/admin/comments", icon: MessageSquareText },
  { name: "Whispr Wall", href: "/admin/whispr-wall", icon: MessageSquareHeart },
]

  const excludedRoutes = ["/admin/login", "/admin/signup", "/admin/forgot-password"]

  // ✅ Fetch only if admin is available and not on excluded auth routes
  useEffect(() => {
    if (!admin || excludedRoutes.includes(pathname)) return

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/admin/notifications/unread-count", {
          credentials: "include",
        })
        const data = await res.json()
        if (res.ok) setUnreadCount(data.count || 0)
      } catch (error) {
        console.error("Failed to fetch unread count:", error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [admin, pathname])

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
        unreadCount={unreadCount}
      />
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        navigation={navigation}
        unreadCount={unreadCount}
      />
      {children}
    </>
  )
}
