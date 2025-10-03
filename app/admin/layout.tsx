import type React from "react"
import type { Metadata } from "next"
import { SessionProvider } from "@/components/admin/session-provider"
import { RouteGuard } from "@/components/admin/route-guard"
<<<<<<< HEAD
=======
import AdminHeaderWrapper from "@/components/admin/admin-header-wrapper"
import { TooltipProvider } from '@/components/ui/tooltip'
import ErrorBoundary from "@/components/admin/error-boundary"
import SetAdminId from '@/components/admin/set-admin-id'
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

export const metadata: Metadata = {
  title: "Admin Dashboard - Whispr",
  description: "Manage your Whispr content and analytics",
}

<<<<<<< HEAD
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <RouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">{children}</div>
=======
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RouteGuard>
        <ErrorBoundary>
          <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
              <SetAdminId />
              <AdminHeaderWrapper>{children}</AdminHeaderWrapper>
            </div>
          </TooltipProvider>
        </ErrorBoundary>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
      </RouteGuard>
    </SessionProvider>
  )
}
