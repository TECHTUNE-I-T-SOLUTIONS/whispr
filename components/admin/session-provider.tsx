"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface Admin {
  id: string
  username: string
  email: string
  full_name?: string
  bio?: string
  avatar_url?: string
  phone?: string
  date_of_birth?: string
  profile_image_url?: string
  created_at: string
  last_login?: string
}

interface SessionContextType {
  admin: Admin | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (adminId: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const checkSession = async () => {
    if (!mounted) return

    try {
      const response = await fetch("/api/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.authenticated && data.admin) {
          setAdmin(data.admin)
          setIsAuthenticated(true)
        } else {
          setAdmin(null)
          setIsAuthenticated(false)

          // Redirect to login if on protected route
          if (
            pathname.startsWith("/admin") &&
            pathname !== "/admin/login" &&
            pathname !== "/admin/signup" &&
            pathname !== "/admin/forgot-password"
          ) {
            router.push("/admin/login")
          }
        }
      } else {
        setAdmin(null)
        setIsAuthenticated(false)

        // Redirect to login if on protected route
        if (
          pathname.startsWith("/admin") &&
          pathname !== "/admin/login" &&
          pathname !== "/admin/signup" &&
          pathname !== "/admin/forgot-password"
        ) {
          router.push("/admin/login")
        }
      }
    } catch (error) {
      console.error("Session check failed:", error)
      setAdmin(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (adminId: string) => {
    // Login API already creates the session, so we just refresh
    await checkSession()
  }

  const logout = async () => {
    try {
      await fetch("/api/session", {
        method: "DELETE",
        credentials: "include",
      })

      setAdmin(null)
      setIsAuthenticated(false)
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const refreshSession = async () => {
    await checkSession()
  }

  useEffect(() => {
    if (mounted) {
      checkSession()
    }
  }, [pathname, mounted])

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <SessionContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
