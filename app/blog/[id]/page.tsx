import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { formatDate, markdownToHtml } from "@/lib/utils"
import { createSupabaseServer } from "@/lib/supabase-server"
import { SafeImage } from "@/components/SafeImage"
import { MediaPlayer } from "@/components/media-player"
import { Reactions } from "@/components/reactions"
import { Comments } from "@/components/comments"
import { ShareButtons } from "@/components/share-buttons"

type BlogPostPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const { id } = await params

  const res = await fetch(`${baseUrl}/api/posts/${id}`, {
    cache: "no-store",
  })

  if (!res.ok) return {}

  const post = await res.json()

  return {
    title: `${post.title} - Whispr`,
    description: post.seo_description || post.excerpt || "",
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const supabase = createSupabaseServer()
  const { id } = await params
  const { data: post } = await supabase
    .from("posts")
    .select(`
      *,
      admin (
        full_name,
        username,
        bio,
        avatar_url
      )
    `)
    .eq("id", id)
    .eq("status", "published")
    .single()

  if (!post) return notFound()

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const htmlContent = post.content_html || (await markdownToHtml(post.content || ""))

  return (
    <div className="whispr-gradient min-h-screen py-10">
      <article className="container max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold">{post.title}</h1>

        <p className="text-muted-foreground text-sm">
          {post.admin?.full_name || post.admin?.username || "Anonymous"} • {formatDate(post.created_at)} •{" "}
          {post.reading_time || 1} min read
        </p>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            {post.tags.map((tag: string) => (
              <span key={tag} className="bg-muted/30 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Media files */}
        {post.media_files?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {post.media_files.map((file: any, index: number) => (
              <MediaPlayer
                key={index}
                media={{
                  id: file.id || `media-${index}`,
                  file_url: file.file_url || "",
                  file_type: file.file_type || "application/octet-stream",
                  original_name: file.original_name || "",
                  file_name: file.file_name || "",
                  file_path: file.file_path || "",
                  file_size: file.file_size || 0
                }}
                showControls={true}
                showDownload={false}
                hideMeta={true}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>

        {/* Reactions */}
        <div className="border-t pt-6">
          <Reactions postId={post.id} />
        </div>

        {/* Share Buttons */}
        <div className="border-t pt-6">
          <ShareButtons
            url={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/blog/${post.id}`}
            title={post.title}
            description={post.excerpt || post.seo_description || ""}
          />
        </div>

        {/* Comments */}
        <div className="border-t pt-6">
          <Comments postId={post.id} />
        </div>
      </article>
    </div>
  )
}
