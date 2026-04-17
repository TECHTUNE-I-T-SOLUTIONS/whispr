"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith("/admin")
  const isChroniclesPage = pathname.startsWith("/chronicles")
  // Treat certain chronicles auth/onboarding routes as regular pages (show main header)
  const isChroniclesAuthPage =
    pathname.startsWith('/chronicles/login') ||
    pathname.startsWith('/chronicles/signup') ||
    pathname.startsWith('/chronicles/onboarding') ||
    pathname.startsWith('/chronicles/verify') ||
    pathname.startsWith('/chronicles/forgot') ||
    pathname.startsWith('/chronicles/reset-password') ||
    pathname.startsWith('/chronicles/feed') ||
    pathname.startsWith('/chronicles/explore') ||
    pathname === '/chronicles' || pathname === '/chronicles/'

  if (isAdminPage || (isChroniclesPage && !isChroniclesAuthPage)) {
    // Admin and authenticated Chronicles pages handle their own layout
    return <>{children}</>
  }

  // Regular pages get header and footer
  return (
    <div className="min-h-screen max-w-full bg-background text-foreground">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
