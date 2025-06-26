import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { PostEditor } from "@/components/admin/post-editor"

interface EditPostPageProps {
  params: {
    id: string
  }
}

async function getPost(id: string) {
  const supabase = createSupabaseServer()

  const { data: post, error } = await supabase.from("posts").select("*").eq("id", id).single()

  if (error || !post) {
    return null
  }

  return post
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const post = await getPost(params.id)

  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <PostEditor postId={params.id} initialData={post} />
    </div>
  )
}
