"use client"

import Link from "next/link"
<<<<<<< HEAD
import { useState } from "react"
=======
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
<<<<<<< HEAD
import { User, Settings, LogOut, Home, PenTool, FileText, BarChart3, Feather, Bell } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutModal } from "@/components/admin/logout-modal"
import { Badge } from "@/components/ui/badge"
=======
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
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

interface AdminHeaderProps {
  admin: {
    id: string
    username: string
    email: string
    full_name?: string
    avatar_url?: string
  }
<<<<<<< HEAD
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
    { name: "Posts", href: "/admin/posts", icon: FileText },
    { name: "New Post", href: "/admin/posts/new", icon: PenTool },
    { name: "Media", href: "/admin/media", icon: FileText },
    { name: "Comments", href: "/admin/comments", icon: FileText },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Feather className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-bold">Whispr Admin</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/" className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">View Site</span>
              </Link>
            </Button>

            <Button asChild variant="ghost" size="sm" className="relative">
              <Link href="/admin/notifications">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Link>
            </Button>

            <ThemeToggle />

=======
  onToggleMobileMenu: () => void
  messagesUnread: number
  notificationsUnread: number
}

export function AdminHeader({ admin, onToggleMobileMenu, messagesUnread, notificationsUnread }: AdminHeaderProps) {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setHasMounted(true)
  }, [])

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
        <div className="container flex items-center justify-between h-16 px-2 md:px-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <div className="h-12 w-12 relative rounded-full overflow-hidden shadow-lg shadow-primary/20">
                <Image src={logoSrc} alt="Whispr Logo" fill className="object-cover" priority />
              </div>
              <span className="hidden sm:inline font-serif text-xl font-bold">Whispr Admin</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-1 px-2 py-1 text-sm font-medium ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="hidden lg:inline">{item.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{item.name}</TooltipContent>
              </Tooltip>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Admin quick shortcuts */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/admin/messages" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
                <MessageSquareText className="h-4 w-4" />
                <span className="hidden lg:inline">Messages</span>
                {messagesUnread > 0 && (
                  <Badge className="ml-2">{messagesUnread}</Badge>
                )}
              </Link>
              {/* QuickCompose removed from desktop header per request */}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon">
                  <Link href="/">
                    <Home className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Site</TooltipContent>
            </Tooltip>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={onToggleMobileMenu}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="relative hidden md:flex">
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

            {/* Theme Toggle */}
            <div className="hidden md:flex">
              <ThemeToggle />
            </div>

            {/* Profile Dropdown */}
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={admin.avatar_url || "/placeholder.svg"} alt={admin.full_name || admin.username} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(admin.full_name || admin.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
<<<<<<< HEAD
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{admin.full_name || admin.username}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{admin.email}</p>
=======
                <div className="flex items-center gap-2 p-2">
                  <div className="flex flex-col">
                    <p className="font-medium">{admin.full_name || admin.username}</p>
                    <p className="text-sm text-muted-foreground truncate w-48">{admin.email}</p>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="flex items-center">
<<<<<<< HEAD
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
=======
                    <User className="mr-2 h-4 w-4" /> <span>Profile</span>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
<<<<<<< HEAD
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
=======
                    <Settings className="mr-2 h-4 w-4" /> <span>Settings</span>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLogoutModalOpen(true)} className="text-red-600">
<<<<<<< HEAD
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
=======
                  <LogOut className="mr-2 h-4 w-4" /> <span>Log out</span>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <LogoutModal open={logoutModalOpen} onOpenChange={setLogoutModalOpen} />
<<<<<<< HEAD
    </>
=======
    </TooltipProvider>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
  )
}
