"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User, LayoutDashboard, FileEdit, FilePlus2, ImageIcon,
  MessageSquareText, Settings, LogOut, Home, PenTool, MessageSquareHeart, MessageCircle,
  FileText, BarChart3, Bell
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutModal } from "@/components/admin/logout-modal"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

interface AdminHeaderProps {
  admin: {
    id: string
    username: string
    email: string
    full_name?: string
    avatar_url?: string
  }
  onToggleMobileMenu: () => void
  messagesUnread: number
  notificationsUnread: number
}

export function AdminHeader({ admin, onToggleMobileMenu, messagesUnread, notificationsUnread }: AdminHeaderProps) {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg")
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setHasMounted(true)
    // Fetch proper avatar URL from dedicated endpoint
    const fetchAvatarUrl = async () => {
      try {
        console.log("🔵 AdminHeader: Fetching avatar URL...")
        const res = await fetch("/api/admin/avatar")
        if (res.ok) {
          const data = await res.json()
          console.log("✅ AdminHeader: Avatar endpoint response:", data)
          
          // Ensure URL is clean and properly formatted
          let url = data.avatar_url || "/placeholder.svg"
          url = url.trim() // Remove whitespace
          
          console.log("✅ AdminHeader: Setting avatarUrl to:", url)
          setAvatarUrl(url)
        } else {
          console.error("❌ AdminHeader: Avatar endpoint returned status:", res.status)
        }
      } catch (err) {
        console.error("❌ AdminHeader: Failed to fetch avatar URL:", err)
      }
    }
    fetchAvatarUrl()
  }, [])

  // Log when avatarUrl changes
  useEffect(() => {
    console.log("🎨 AdminHeader: avatarUrl state changed to:", avatarUrl)
  }, [avatarUrl])

  const logoSrc = hasMounted
    ? theme === "dark"
      ? "/lightlogo.png"
      : "/darklogo.png"
    : "/darklogo.png"

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Posts", href: "/admin/posts", icon: FileEdit },
    { name: "New Post", href: "/admin/posts/new", icon: FilePlus2 },
    { name: "Media", href: "/admin/media", icon: ImageIcon },
    { name: "Comments", href: "/admin/comments", icon: MessageSquareText },
    { name: "Spoken Words", href: "/admin/spoken-words", icon: PenTool },
    { name: "Whispr Wall", href: "/admin/whispr-wall", icon: MessageSquareHeart },
    { name: "Feedback", href: "/admin/feedback", icon: MessageCircle },
  ]

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-2 md:px-3 lg:px-4 gap-2">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center space-x-2 sm:space-x-4 min-w-0">
            <Link href="/admin/dashboard" className="flex items-center space-x-2 min-w-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 relative rounded-full overflow-hidden shadow-lg shadow-primary/20 flex-shrink-0">
                <Image src={logoSrc} alt="Whispr Logo" fill className="object-cover" priority />
              </div>
              <span className="hidden sm:inline font-serif text-lg sm:text-xl font-bold truncate">Whispr Admin</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2 flex-1 justify-center">
            {/* Additional desktop nav items can go here if needed */}
          </nav>

          {/* Right Controls - Optimized for tablet */}
          <div className="flex items-center space-x-1 md:space-x-2 lg:space-x-3 ml-auto gap-1">
            {/* Home Button - Always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <Link href="/">
                    <Home className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Site</TooltipContent>
            </Tooltip>

            {/* Notifications - Hide on small tablets, show on larger tablets + desktop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="relative hidden sm:flex h-8 w-8 sm:h-9 sm:w-9">
                  <Link href="/admin/notifications">
                    <Bell className="h-4 w-4" />
                    {notificationsUnread > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {notificationsUnread}
                      </Badge>
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            {/* Theme Toggle - Hide on small tablets */}
            <div className="hidden lg:flex">
              <ThemeToggle />
            </div>

            {/* Mobile/Tablet Menu Button - Show on md and below */}
            <Button variant="ghost" size="icon" onClick={onToggleMobileMenu} className="lg:hidden h-8 w-8 sm:h-9 sm:w-9">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0 flex-shrink-0">
                  {avatarUrl && avatarUrl !== "/placeholder.svg" ? (
                    <Image 
                      src={avatarUrl}
                      alt={admin.full_name || admin.username}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                      unoptimized
                      onError={(e) => {
                        console.error("❌ Header avatar failed to load from:", avatarUrl)
                      }}
                      onLoadingComplete={() => {
                        console.log("✅ Header avatar loaded successfully from:", avatarUrl)
                      }}
                    />
                  ) : (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {(admin.full_name || admin.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center gap-2 p-2">
                  <div className="flex flex-col">
                    <p className="font-medium">{admin.full_name || admin.username}</p>
                    <p className="text-xs text-muted-foreground truncate w-48 break-words">{admin.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" /> <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" /> <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLogoutModalOpen(true)} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" /> <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <LogoutModal open={logoutModalOpen} onOpenChange={setLogoutModalOpen} />
    </TooltipProvider>
  )
}
