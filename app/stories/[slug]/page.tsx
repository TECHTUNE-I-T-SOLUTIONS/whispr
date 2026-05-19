import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getStoryBySlug, getStoryChapters } from "@/lib/stories"
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

  return {
    title: `${story.title} - Whispering Stories`,
    description: story.excerpt || story.description || `Read "${story.title}" on Whispr's premium reading platform.`,
    openGraph: {
      title: story.title,
      description: story.excerpt || story.description,
      images: story.cover_image_url ? [story.cover_image_url] : [],
      type: "article",
    },
  }
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

  return <StoryClientPage story={story} chapters={chapters} />
}
