"use client"

import type React from "react"
import { useSession } from "@/components/admin/session-provider"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { isLoading, isAuthenticated } = useSession()
  const pathname = usePathname()

  // Allow access to login, signup, and forgot password pages
  const publicPaths = ["/admin/login", "/admin/signup", "/admin/forgot-password"]
  if (publicPaths.includes(pathname)) {
    return <>{children}</>
  }

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect will be handled by SessionProvider
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
