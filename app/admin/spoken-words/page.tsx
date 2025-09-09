import { requireAuth } from "@/lib/auth"
import { SpokenWordsManager } from "@/components/admin/spoken-words-manager"

export const metadata = {
  title: "Spoken Words Manager - Whispr Admin",
  description: "Manage audio and video spoken words content",
}

export default async function SpokenWordsPage() {
  await requireAuth()

  return (
    <div className="container py-8">
      <SpokenWordsManager />
    </div>
  )
}
