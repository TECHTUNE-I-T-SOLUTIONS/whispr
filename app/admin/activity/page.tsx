import { requireAuth } from "@/lib/auth"
import { ActivityFeed } from "@/components/admin/activity-feed"

export const metadata = {
  title: "Activity - Whispr Admin",
  description: "View all recent activity and events",
}

export default async function ActivityPage() {
  await requireAuth()

  return (
    <div className="container py-8">
      <ActivityFeed />
    </div>
  )
}
