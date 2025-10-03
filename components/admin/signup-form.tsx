"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
<<<<<<< HEAD
=======
import Image from "next/image"
import { useTheme } from "next-themes"
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, User, Mail, FileText, Feather, UserPlus, Phone, Calendar, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/components/admin/session-provider"

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [securityQuestions, setSecurityQuestions] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useSession()

<<<<<<< HEAD
=======
  const { theme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const logoSrc = hasMounted
    ? theme === "dark"
      ? "/lightlogo.png"
      : "/darklogo.png"
    : "/darklogo.png"


>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
  useEffect(() => {
    fetchSecurityQuestions()
  }, [])

  const fetchSecurityQuestions = async () => {
    try {
      const response = await fetch("/api/auth/signup")
      if (response.ok) {
        const data = await response.json()
        setSecurityQuestions(data.securityQuestions)
      }
    } catch (error) {
      console.error("Failed to fetch security questions:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const signupData = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      fullName: formData.get("fullName") as string,
      bio: formData.get("bio") as string,
      phone: formData.get("phone") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      securityQuestion: formData.get("securityQuestion") as string,
      securityAnswer: formData.get("securityAnswer") as string,
    }

    // Client-side validation
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (signupData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (!signupData.securityQuestion || !signupData.securityAnswer) {
      setError("Please select a security question and provide an answer")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          variant: "success",
          title: "Account created successfully! 🎉",
          description: "Welcome to Whispr! Please sign in to continue.",
        })
        router.push("/admin/login")
      } else {
        setError(data.error || "Signup failed")
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: data.error || "Please try again.",
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
    <Card className="w-full max-w-2xl animate-slide-up border-0 bg-card/80 backdrop-blur shadow-2xl">
      <CardHeader className="text-center space-y-4">
<<<<<<< HEAD
        <div className="animate-float mx-auto">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <Feather className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
=======
        <div className="animate-float mx-auto mb-2">
          <div className="h-40 w-40 relative rounded-full overflow-hidden shadow-lg shadow-primary/20">
            <Image
              src={logoSrc}
              alt="Whispr Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
        <div>
          <CardTitle className="text-2xl font-serif bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Join Whispr
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create your admin account to start sharing your thoughts and poetry
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    required
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Your full name"
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                Date of Birth
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="dateOfBirth" name="dateOfBirth" type="date" className="pl-10" disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself and your writing..."
                  className="pl-10 min-h-[80px] resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 8 characters"
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
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    required
                    minLength={8}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityQuestion" className="text-sm font-medium">
                Security Question *
              </Label>
              <Select name="securityQuestion" required disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a security question" />
                </SelectTrigger>
                <SelectContent>
                  {securityQuestions.map((question) => (
                    <SelectItem key={question} value={question}>
                      {question}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityAnswer" className="text-sm font-medium">
                Security Answer *
              </Label>
              <Input
                id="securityAnswer"
                name="securityAnswer"
                type="text"
                placeholder="Your answer to the security question"
                required
                disabled={isLoading}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                This will be used to recover your account if you forget your password.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-slide-up">
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
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/admin/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in here
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
