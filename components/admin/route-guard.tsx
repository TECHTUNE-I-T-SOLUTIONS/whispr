"use client"

import type React from "react"
<<<<<<< HEAD
import { useSession } from "@/components/admin/session-provider"
import { usePathname } from "next/navigation"
=======
import { useEffect } from "react"
import { useSession } from "@/components/admin/session-provider"
import { usePathname, useRouter } from "next/navigation"
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
import { Loader2 } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { isLoading, isAuthenticated } = useSession()
  const pathname = usePathname()
<<<<<<< HEAD

  // Allow access to login, signup, and forgot password pages
  const publicPaths = ["/admin/login", "/admin/signup", "/admin/forgot-password"]
  if (publicPaths.includes(pathname)) {
    return <>{children}</>
  }
=======
  const router = useRouter()

  // Allow access to login, signup, and forgot password pages
  const publicPaths = ["/admin/login", "/admin/signup", "/admin/forgot-password"]
  const isPublicPath = publicPaths.includes(pathname)

  console.log("RouteGuard state:", { isLoading, isAuthenticated, pathname, isPublicPath })

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPath) {
      console.log("RouteGuard: Not authenticated on protected route, waiting before redirect...")
      // Add a longer delay to allow session check to complete
      const timer = setTimeout(() => {
        console.log("RouteGuard: Still not authenticated, redirecting to login")
        router.push("/admin/login")
      }, 500) // Increased delay
      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthenticated, isPublicPath, router])
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

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

<<<<<<< HEAD
  // Redirect will be handled by SessionProvider
  if (!isAuthenticated) {
=======
  // If not authenticated and on a protected page, show redirect message
  if (!isAuthenticated && !isPublicPath) {
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

<<<<<<< HEAD
=======
  // Allow access to all pages
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
  return <>{children}</>
}
