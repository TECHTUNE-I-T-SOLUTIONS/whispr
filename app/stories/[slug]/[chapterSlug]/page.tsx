import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getChapterBySlugs } from "@/lib/stories"
import { markdownToHtml } from "@/lib/utils"
import ChapterClientPage from "./chapter-client-page"

interface ChapterPageProps {
  params: Promise<{
    slug: string
    chapterSlug: string
  }>
}

async function fetchChapterData(storySlug: string, chapterSlug: string) {
  const supabase = createSupabaseServer()
  return await getChapterBySlugs(supabase, storySlug, chapterSlug)
}

export async function generateMetadata({ params }: ChapterPageProps) {
  const { slug, chapterSlug } = await params
  const data = await fetchChapterData(slug, chapterSlug)

  if (!data) {
    return {
      title: "Chapter Not Found - Whispr",
    }
  }

  return {
    title: `${data.chapter.title} - Chapter ${data.chapter.sequence} of ${data.story.title}`,
    description: `Read Chapter ${data.chapter.sequence}: "${data.chapter.title}" of "${data.story.title}" on Whispr.`,
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug, chapterSlug } = await params
  const data = await fetchChapterData(slug, chapterSlug)

  if (!data) {
    return notFound()
  }

  // Convert markdown to HTML
  const htmlContent = await markdownToHtml(data.chapter.content || "")

  const processedChapter = {
    ...data.chapter,
    content: htmlContent,
  }

  return (
    <ChapterClientPage
      story={data.story}
      chapter={processedChapter}
      allChapters={data.allChapters}
      prevChapterSlug={data.prevChapterSlug}
      nextChapterSlug={data.nextChapterSlug}
    />
  )
}
