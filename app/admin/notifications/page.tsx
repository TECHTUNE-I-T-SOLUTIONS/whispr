import { requireAuth } from "@/lib/auth"
import { NotificationsCenter } from "@/components/admin/notifications-center"

export const metadata = {
  title: "Notifications - Whispr Admin",
  description: "Manage your notifications and alerts",
}

export default async function NotificationsPage() {
  await requireAuth()

  return (
    <div className="container py-8">
      <NotificationsCenter />
    </div>
  )
}
