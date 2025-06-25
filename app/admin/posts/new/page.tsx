import { requireAuth } from "@/lib/auth"
import { PostEditor } from "@/components/admin/post-editor"

export const metadata = {
  title: "Create New Post - Whispr Admin",
  description: "Create a new blog post or poem",
}

interface PageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function NewPostPage({ searchParams }: PageProps) {
  await requireAuth()
  const { type } = await searchParams

  return (
    <div className="container py-8">
      <PostEditor type={type as "blog" | "poem" | undefined} />
    </div>
  )
}
