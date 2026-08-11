import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { generateCopyrightMetadata, generateJsonLd } from "@/components/copyright-metadata"
import PublicPostPage from "./page"

interface ChroniclesPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ChroniclesPageProps) {
  const { slug } = await params
  const supabase = createSupabaseServer()

  // Fetch post data with creator information
  const { data: post, error } = await supabase
    .from('chronicles_posts')
    .select(`
      *,
      creator:creator_id (
        id,
        pen_name,
        username,
        profile_image_url,
        bio
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    return {
      title: "Post Not Found - Whispr Chronicles",
    }
  }

  // Support chronicle creators as authors
  const author = post.creator?.pen_name || post.creator?.username || 'Anonymous'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/chronicles/${post.slug}`
  const publishedDate = post.published_at || post.created_at
  const modifiedDate = post.updated_at

  return generateCopyrightMetadata({
    articleId: post.id,
    author,
    title: post.title,
    publishedDate,
    modifiedDate,
    canonicalUrl,
    articleType: 'chronicles',
  })
}

export default async function ChroniclesServerPage({ params }: ChroniclesPageProps) {
  const { slug } = await params
  const supabase = createSupabaseServer()

  // Fetch post data with creator information
  const { data: post, error } = await supabase
    .from('chronicles_posts')
    .select(`
      *,
      creator:creator_id (
        id,
        pen_name,
        username,
        profile_image_url,
        bio
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    notFound()
  }

  // Generate JSON-LD with chronicle creator as author
  const author = post.creator?.pen_name || post.creator?.username || 'Anonymous'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/chronicles/${post.slug}`
  const jsonLd = generateJsonLd({
    articleId: post.id,
    author,
    title: post.title,
    publishedDate: post.published_at || post.created_at,
    modifiedDate: post.updated_at,
    canonicalUrl,
    articleType: 'chronicles',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <PublicPostPage />
    </>
  )
}
