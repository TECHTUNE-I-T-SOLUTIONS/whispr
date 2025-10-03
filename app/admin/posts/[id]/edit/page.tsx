import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { PostEditor } from "@/components/admin/post-editor"

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

async function getPost(id: string) {
  const supabase = createSupabaseServer()

  const { data: post, error } = await supabase
    .from("posts")
    .select("*, admin:admin_id(id, username, full_name, avatar_url)")
    .eq("id", id)
    .single()

  if (error || !post) {
    return null
  }

  return post
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <PostEditor postId={id} initialData={post} />
    </div>
  )
}
