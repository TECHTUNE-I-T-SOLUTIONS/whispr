import { requireAuth } from "@/lib/auth"
import { PostsList } from "@/components/admin/posts-list"
import { PostsHeader } from "@/components/admin/posts-header"

export const metadata = {
  title: "Manage Posts - Whispr Admin",
  description: "Manage your blog posts and poems",
}

export default async function PostsPage() {
  await requireAuth()

  return (
    <div className="container py-8 space-y-8">
      <PostsHeader />
      <PostsList />
    </div>
  )
}
