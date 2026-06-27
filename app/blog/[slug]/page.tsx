import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { formatDate, markdownToHtml } from "@/lib/utils"
import { createSupabaseServer } from "@/lib/supabase-server"
import { MediaPlayer } from "@/components/media-player"
import { Reactions } from "@/components/reactions"
import { Comments } from "@/components/comments"
import { ShareButtons } from "@/components/share-buttons"
import { BlogClientPage } from "./blog-client-page"
import { AppBanner } from "@/components/app-banner"
import { AdsterraBanner } from "@/components/AdsterraBanner"


function buildJsonLd(post: any) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://whisprwords.com"
  const url = `${siteUrl}/blog/${post.slug || post.id}`
  const base = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo_description || post.excerpt || "",
    url,
    datePublished: post.published_at || post.created_at,
    author: {
      "@type": "Person",
      name: post.admin?.full_name || post.admin?.username || "Whispr",
    },
  }

  if (post.schema_type === "HowTo") {
    return {
      ...base,
      "@type": "HowTo",
      url,
      datePublished: post.published_at || post.created_at,
      author: base.author,
    }
  }

  if (post.schema_type === "FAQPage") {
    return {
      ...base,
      "@type": "FAQPage",
      url,
      datePublished: post.published_at || post.created_at,
      author: base.author,
    }
  }

  return base
}

type BlogPostPageProps = {
  params: Promise<{ slug: string }>
}

async function getPost(slugOrId: string) {
  const supabase = createSupabaseServer()
  
  // 1. Try slug first
  let { data: post } = await supabase
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
    .eq("slug", slugOrId)
    .eq("status", "published")
    .maybeSingle()

  // 2. Fallback to ID check
  if (!post) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)
    if (isUuid) {
      const { data } = await supabase
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
        .eq("id", slugOrId)
        .eq("status", "published")
        .maybeSingle()
      post = data
    }
  }

  if (!post) return null

  const jsonLd = buildJsonLd(post)

  return { post, jsonLd }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const result = await getPost(slug)
    const post = (result as any)?.post

    if (!post || post.status !== "published") return {}

    return {
      title: `${post.title} - Whispr`,
      description: post.seo_description || post.excerpt || "",
    }
  } catch {
    return {}
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const result = await getPost(slug)
  const post = (result as any)?.post
  const jsonLd = (result as any)?.jsonLd

  if (!post) return notFound()

  const htmlContent = post.content_html || (await markdownToHtml(post.content || ""))

  return (
    <>
      {jsonLd && (
        <script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="whispr-gradient min-h-screen py-10">
        <article className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <span>←</span>
            <span>Back to Blog</span>
          </Link>

          <h1 className="text-4xl font-bold font-serif">{post.title}</h1>

          <p className="text-muted-foreground text-sm">
            {post.admin?.full_name || post.admin?.username || "Anonymous"} • {formatDate(post.created_at)} •{" "}
            {post.reading_time || 1} min read
          </p>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm">
              {post.tags.map((tag: string) => (
                <span key={tag} className="bg-muted/30 px-3 py-1 rounded-full text-xs">
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
          <BlogClientPage htmlContent={htmlContent} plainText={post.content || htmlContent.replace(/<[^>]*>/g, '')} />

          {/* Reactions */}
          <div className="border-t pt-6">
            <Reactions postId={post.id} />
          </div>

          {/* Share Buttons */}
          <div className="border-t pt-6">
            <ShareButtons
              url={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/blog/${post.slug || post.id}`}
              title={post.title}
              description={post.excerpt || post.seo_description || ""}
            />
          </div>

          {/* Comments */}
          <div className="border-t pt-6">
            <Comments postId={post.id} />
          </div>

          {/* App Banner for Mobile Users */}
          <div className="border-t pt-6 mb-8">
            <AppBanner postId={post.id} postType="post" />
          </div>
        </article>
        {/* Adsterra banners below main content */}
        <AdsterraBanner />
      </div>
    </>
  )
}
