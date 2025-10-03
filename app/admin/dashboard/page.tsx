"use client"

import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentActivity } from "@/components/admin/recent-activity"
import { QuickActions } from "@/components/admin/quick-actions"
import { useSession } from "@/components/admin/session-provider"
import { Loader2 } from "lucide-react"

export default function AdminDashboard() {
  const { admin, isLoading } = useSession()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!admin) {
    return null // RouteGuard will handle redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="container py-8 space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-serif font-bold mb-2">Welcome back, {admin.full_name || admin.username}! ✨</h1>
          <p className="text-muted-foreground">Here's what's happening with your Whispr content today.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <DashboardStats />
            <RecentActivity />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  )
}
