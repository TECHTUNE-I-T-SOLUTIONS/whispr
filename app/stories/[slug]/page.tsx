import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getStoryBySlug, getStoryChapters } from "@/lib/stories"
import { generateCopyrightMetadata, generateJsonLd } from "@/components/copyright-metadata"
import { CopyrightFooter } from "@/components/copyright-footer"
import StoryClientPage from "./story-client-page"

interface StoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: StoryPageProps) {
  const { slug } = await params
  const supabase = createSupabaseServer()
  const story = await getStoryBySlug(supabase, slug)

  if (!story) {
    return {
      title: "Story Not Found - Whispr",
    }
  }

  // Determine author based on author_type
  let author = 'Whispr'
  if (story.author_type === 'admin' && story.admin) {
    author = story.admin.full_name || story.admin.username || 'Whispr'
  } else if (story.author_type === 'creator' && story.creator) {
    author = story.creator.pen_name || story.creator.username || 'Whispr'
  }

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/stories/${story.slug}`
  const publishedDate = story.published_at || story.created_at
  const modifiedDate = story.updated_at

  return generateCopyrightMetadata({
    articleId: story.id,
    author,
    title: story.title,
    publishedDate,
    modifiedDate,
    canonicalUrl,
    articleType: 'story',
  })
}

export default async function StoryDetailPage({ params }: StoryPageProps) {
  const { slug } = await params
  const supabase = createSupabaseServer()
  const story = await getStoryBySlug(supabase, slug)

  if (!story || story.status !== 'published') {
    return notFound()
  }

  // Fetch chapters
  const chapters = await getStoryChapters(supabase, story.id, story.author_type, false)

  // Determine author for JSON-LD
  let author = 'Whispr'
  if (story.author_type === 'admin' && story.admin) {
    author = story.admin.full_name || story.admin.username || 'Whispr'
  } else if (story.author_type === 'creator' && story.creator) {
    author = story.creator.pen_name || story.creator.username || 'Whispr'
  }

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/stories/${story.slug}`
  const jsonLd = generateJsonLd({
    articleId: story.id,
    author,
    title: story.title,
    publishedDate: story.published_at || story.created_at,
    modifiedDate: story.updated_at,
    canonicalUrl,
    articleType: 'story',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <StoryClientPage story={story} chapters={chapters} />
    </>
  )
}
