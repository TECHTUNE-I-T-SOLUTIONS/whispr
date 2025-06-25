"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, User, Feather, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/components/admin/session-provider"
import Link from "next/link"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [accountLocked, setAccountLocked] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { refreshSession } = useSession()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setAccountLocked(false)

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    if (!username || !password) {
      setError("Please enter both username and password")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh session to get the latest data
        await refreshSession()

        toast({
          variant: "success",
          title: "Welcome back! 🎉",
          description: "You've successfully signed in to your dashboard.",
        })

        // Small delay to ensure session is set
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 100)
      } else {
        setError(data.error || "Login failed")

        if (data.accountLocked) {
          setAccountLocked(true)
        }

        toast({
          variant: "destructive",
          title: "Login failed",
          description: data.error || "Please check your credentials and try again.",
        })
      }
    } catch (error) {
      const errorMessage = "An error occurred. Please try again."
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md animate-slide-up border-0 bg-card/80 backdrop-blur shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <div className="animate-float mx-auto">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <Feather className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-serif bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to your Whispr admin dashboard</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username or Email
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username or email"
                required
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-slide-up">
              {accountLocked && <AlertTriangle className="h-4 w-4" />}
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="text-center space-y-2">
            <Link
              href="/admin/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {accountLocked ? "Reset your password to unlock account" : "Forgot your password?"}
            </Link>
            <div className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/admin/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Create one here
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
