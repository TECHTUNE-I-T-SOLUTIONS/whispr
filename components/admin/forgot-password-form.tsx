"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, User, Shield, ArrowLeft, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"verify" | "reset" | "success">("verify")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [adminId, setAdminId] = useState("")
  const [securityQuestion, setSecurityQuestion] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const securityAnswer = formData.get("securityAnswer") as string

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: "verify",
          username,
          securityAnswer,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAdminId(data.adminId)
        setSecurityQuestion(data.securityQuestion)
        setStep("reset")
        toast({
          variant: "success",
          title: "Verification successful",
          description: "You can now reset your password.",
        })
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: "reset",
          adminId,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStep("success")
        toast({
          variant: "success",
          title: "Password reset successful",
          description: "Your password has been updated and account unlocked. You can now sign in.",
        })
      } else {
        setError(data.error || "Password reset failed")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "success") {
    return (
      <Card className="w-full max-w-md animate-slide-up border-0 bg-card/80 backdrop-blur shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="animate-float mx-auto">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-serif text-green-600">Password Reset Successful</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your password has been successfully updated and your account has been unlocked
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">You can now sign in with your new password.</p>
          <Button asChild className="w-full">
            <Link href="/admin/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md animate-slide-up border-0 bg-card/80 backdrop-blur shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <div className="animate-float mx-auto">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            {step === "verify" ? (
              <Shield className="h-8 w-8 text-primary-foreground" />
            ) : (
              <Lock className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-serif bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {step === "verify" ? "Verify Identity" : "Reset Password"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === "verify" ? "Answer your security question to verify your identity" : "Enter your new password"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {step === "verify" ? (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
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
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityAnswer" className="text-sm font-medium">
                Security Answer
              </Label>
              <Input
                id="securityAnswer"
                name="securityAnswer"
                type="text"
                placeholder="Answer to your security question"
                required
                disabled={isLoading}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                We'll show you your security question after you enter your username
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="animate-slide-up">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Identity
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            {securityQuestion && (
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Security Question: {securityQuestion}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="animate-slide-up">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        )}

        <div className="text-center mt-4">
          <Link
            href="/admin/login"
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
