import { requireAuth } from "@/lib/auth"
import { CommentsManager } from "@/components/admin/comments-manager"

export const metadata = {
  title: "Comments - Whispr Admin",
  description: "Manage and moderate comments",
}

export default async function CommentsPage() {
  await requireAuth()

  return (
    <div className="container py-8">
      <CommentsManager />
    </div>
  )
}
