import { requireAuth } from "@/lib/auth"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"

export const metadata = {
  title: "Analytics - Whispr Admin",
  description: "View detailed analytics and insights",
}

export default async function AnalyticsPage() {
  await requireAuth()

  return (
    <div className="container py-8">
      <AnalyticsDashboard />
    </div>
  )
}
