"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogOut, Home, PenTool, FileText, BarChart3, Feather, Bell } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutModal } from "@/components/admin/logout-modal"
import { Badge } from "@/components/ui/badge"

interface AdminHeaderProps {
  admin: {
    id: string
    username: string
    email: string
    full_name?: string
    avatar_url?: string
  }
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
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{admin.full_name || admin.username}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLogoutModalOpen(true)} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <LogoutModal open={logoutModalOpen} onOpenChange={setLogoutModalOpen} />
    </>
  )
}
