import notFound from "./not-found"
import PoemClientPage from "./PoemClientPage"
import { createSupabaseServer } from "@/lib/supabase-server"
import { markdownToHtml } from "@/lib/utils" // ✅ import the utility

interface PoemPageProps {
  params: {
    id: string
  }
}

async function getPoem(id: string) {
  const supabase = createSupabaseServer()
  const { data: poem, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("type", "poem")
    .eq("status", "published")
    .single()

  return error || !poem ? null : poem
}

export async function generateMetadata({ params }: PoemPageProps) {
  const poem = await getPoem(params.id)

  if (!poem) {
    return {
      title: "Poem Not Found - Whispr",
    }
  }

  return {
    title: `${poem.title} - Whispr | Prayce's Poetry`,
    description: poem.excerpt || poem.content.substring(0, 160),
    openGraph: {
      title: poem.title,
      description: poem.excerpt || poem.content.substring(0, 160),
      images: poem.featured_image ? [poem.featured_image] : [],
      type: "article",
      publishedTime: poem.created_at,
      authors: ["Prayce"],
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
  const poem = await getPoem(params.id)

  if (!poem) {
    return notFound()
  }

  // ✅ Convert poem.content (Markdown) to HTML
  const htmlContent = await markdownToHtml(poem.content || "")

  // ✅ Pass HTML content to client page
  return <PoemClientPage poem={{ ...poem, content: htmlContent }} />
}
