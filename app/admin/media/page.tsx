import { requireAuth } from "@/lib/auth"
import { MediaLibrary } from "@/components/admin/media-library"

export const metadata = {
  title: "Media Library - Whispr Admin",
  description: "Manage your media files and uploads",
}

export default async function MediaPage() {
  await requireAuth()

  return (
    <div className="container py-8">
      <MediaLibrary />
    </div>
  )
}
