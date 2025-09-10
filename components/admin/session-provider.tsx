"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
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
  refreshSession: (opts?: { timeoutMs?: number }) => Promise<boolean>
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
  // Keep a ref to any ongoing session check promise so multiple callers
  // don't trigger duplicate network requests to `/api/auth/me`.
  const ongoingCheckRef = useRef<Promise<boolean> | null>(null)
  // Cache the last check result for a short period to avoid repeated
  // back-to-back requests from multiple callers.
  const lastCheckRef = useRef<{ ts: number; result: boolean } | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const checkSession = async (): Promise<boolean> => {
    if (!mounted) return false

    // If a check is already running, return that promise so callers reuse it.
    if (ongoingCheckRef.current) return ongoingCheckRef.current

    // If we have a recent cached result (within 2s), reuse it to avoid
    // hammering the `/api/auth/me` endpoint when many components mount
    // or call `refreshSession` in quick succession.
    const now = Date.now()
  const cacheWindowMs = 10000
    if (lastCheckRef.current && now - lastCheckRef.current.ts < cacheWindowMs) {
      return lastCheckRef.current.result
    }

    // Store the in-flight promise so concurrent calls reuse it.
    ongoingCheckRef.current = (async () => {
      console.log("Checking session for path:", pathname)
      setIsLoading(true)
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })

        console.log("Session check response:", response.status)
        if (response.ok) {
          const data = await response.json()
          console.log("Session data:", data)
          if (data.admin) {
            console.log("Setting authenticated state")
            setAdmin(data.admin)
            setIsAuthenticated(true)
            lastCheckRef.current = { ts: Date.now(), result: true }
            return true
          }

          console.log("No admin data, clearing authentication")
          setAdmin(null)
          setIsAuthenticated(false)
          lastCheckRef.current = { ts: Date.now(), result: false }

          if (
            pathname.startsWith("/admin") &&
            pathname !== "/admin/login" &&
            pathname !== "/admin/signup" &&
            pathname !== "/admin/forgot-password"
          ) {
            router.push("/admin/login")
          }
          return false
        }

        console.log("Session check failed with status:", response.status)
        setAdmin(null)
        setIsAuthenticated(false)
        lastCheckRef.current = { ts: Date.now(), result: false }

        if (
          pathname.startsWith("/admin") &&
          pathname !== "/admin/login" &&
          pathname !== "/admin/signup" &&
          pathname !== "/admin/forgot-password"
        ) {
          router.push("/admin/login")
        }

        return false
      } catch (error) {
        console.error("Session check failed:", error)
        setAdmin(null)
        setIsAuthenticated(false)
        lastCheckRef.current = { ts: Date.now(), result: false }
        return false
      } finally {
        setIsLoading(false)
        ongoingCheckRef.current = null
      }
    })()

    return ongoingCheckRef.current
  }

  const login = async (adminId: string) => {
    // Login API already creates the session, so we just refresh
    await refreshSession()
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      setAdmin(null)
      setIsAuthenticated(false)
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const refreshSession = async (opts?: { timeoutMs?: number }): Promise<boolean> => {
    // Run a fresh check and return the authoritative result from the server.
    // Relying on React state variables inside this function can lead to
    // stale-closure races (the caller receives a function that captured an
    // earlier render's state). Returning the `checkSession` result directly
    // avoids that race. We add a tiny await when successful so UI callers
    // have a short moment for state updates to flush if they need them.
    const ok = await checkSession()
    if (ok) {
      // Small micro-delay to let React state updates settle for callers that
      // render immediately after this resolves.
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    return ok
  }

  useEffect(() => {
    // Run a single check after mount if we're on an admin route. We avoid
    // including `pathname` in the dependency array so route changes don't
    // immediately re-trigger a session check from this effect; other
    // components can still call `refreshSession` when needed.
    if (mounted && pathname.startsWith("/admin")) {
      console.log("Admin route detected on mount, checking session immediately")
      // Check session immediately for admin routes
      checkSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

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
