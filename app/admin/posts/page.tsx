import { requireAuth } from "@/lib/auth"
<<<<<<< HEAD
import { PostsList } from "@/components/admin/posts-list"
import { PostsHeader } from "@/components/admin/posts-header"
=======
import ClientPostsContainer from "@/components/admin/client-posts-container"
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

export const metadata = {
  title: "Manage Posts - Whispr Admin",
  description: "Manage your blog posts and poems",
}

export default async function PostsPage() {
<<<<<<< HEAD
  await requireAuth()

  return (
    <div className="container py-8 space-y-8">
      <PostsHeader />
      <PostsList />
=======
  const { admin } = await requireAuth()

  return (
    <div className="container py-8">
      <ClientPostsContainer adminId={admin.id} />
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    </div>
  )
}
