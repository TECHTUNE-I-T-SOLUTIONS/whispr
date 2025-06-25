import type React from "react"
import type { Metadata } from "next"
import { SessionProvider } from "@/components/admin/session-provider"
import { RouteGuard } from "@/components/admin/route-guard"

export const metadata: Metadata = {
  title: "Admin Dashboard - Whispr",
  description: "Manage your Whispr content and analytics",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <RouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">{children}</div>
      </RouteGuard>
    </SessionProvider>
  )
}
