import { requireAuth } from "@/lib/auth"
import ClientPostsContainer from "@/components/admin/client-posts-container"

export const metadata = {
  title: "Manage Posts - Whispr Admin",
  description: "Manage your blog posts and poems",
}

export default async function PostsPage() {
  const { admin } = await requireAuth()

  return (
    <div className="container py-8">
      <ClientPostsContainer adminId={admin.id} />
    </div>
  )
}
