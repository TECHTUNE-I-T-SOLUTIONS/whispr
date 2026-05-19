import notFound from "./not-found"
import PoemClientPage from "./PoemClientPage"
import { createSupabaseServer } from "@/lib/supabase-server"
import { markdownToHtml } from "@/lib/utils"

interface PoemPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getPoem(slugOrId: string) {
  const supabase = createSupabaseServer()
  
  // 1. Try fetching by slug
  let { data: poem } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slugOrId)
    .eq("type", "poem")
    .eq("status", "published")
    .maybeSingle()

  // 2. Fallback to ID check if it's a valid UUID
  if (!poem) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)
    if (isUuid) {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("id", slugOrId)
        .eq("type", "poem")
        .eq("status", "published")
        .maybeSingle()
      poem = data
    }
  }

  return poem
}

export async function generateMetadata({ params }: PoemPageProps) {
  const { slug } = await params
  const poem = await getPoem(slug)

  if (!poem) {
    return {
      title: "Poem Not Found - Whispr",
    }
  }

  return {
    title: `${poem.title} - Whispr | Whispr's Poetry`,
    description: poem.excerpt || poem.content.substring(0, 160),
    openGraph: {
      title: poem.title,
      description: poem.excerpt || poem.content.substring(0, 160),
      images: poem.featured_image ? [poem.featured_image] : [],
      type: "article",
      publishedTime: poem.created_at,
      authors: ["Whispr"],
    },
    twitter: {
      card: "summary_large_image",
      title: poem.title,
      description: poem.excerpt || poem.content.substring(0, 160),
      images: poem.featured_image ? [poem.featured_image] : [],
    },
  }
}

export default async function PoemPage({ params }: PoemPageProps) {
  const { slug } = await params
  const poem = await getPoem(slug)

  if (!poem) {
    return notFound()
  }

  // Convert poem.content (Markdown) to HTML
  const htmlContent = await markdownToHtml(poem.content || "")

  // Pass HTML content to client page
  return <PoemClientPage poem={{ ...poem, content: htmlContent }} />
}
