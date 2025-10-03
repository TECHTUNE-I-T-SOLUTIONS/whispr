import { requireAuth } from "@/lib/auth"
import { ProfileManager } from "@/components/admin/profile-manager"

export const metadata = {
  title: "Profile - Whispr Admin",
  description: "Manage your admin profile and account settings",
}

export default async function ProfilePage() {
  await requireAuth()

  return (
    <div className="container py-8">
      <ProfileManager />
    </div>
  )
}
