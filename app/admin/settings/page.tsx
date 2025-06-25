import { requireAuth } from "@/lib/auth"
import { SettingsManager } from "@/components/admin/settings-manager"

export const metadata = {
  title: "Settings - Whispr Admin",
  description: "Configure your admin dashboard settings",
}

export default async function SettingsPage() {
  await requireAuth()

  return (
    <div className="container py-8">
      <SettingsManager />
    </div>
  )
}
