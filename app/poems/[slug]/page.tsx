import notFound from "./not-found"
import PoemClientPage from "./PoemClientPage"
import { createSupabaseServer } from "@/lib/supabase-server"
import { markdownToHtml } from "@/lib/utils"
import { generateCopyrightMetadata, generateJsonLd } from "@/components/copyright-metadata"

interface PoemPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getPoem(slugOrId: string) {
  const supabase = createSupabaseServer()

  // 1. Try fetching by slug with admin information
  let { data: poem } = await supabase
    .from("posts")
    .select(`
      *,
      admin:admin_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
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
        .select(`
          *,
          admin:admin_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
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

  // Determine author from admin information
  const author = poem.admin?.full_name || poem.admin?.username || 'Whispr'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/poems/${poem.slug || poem.id}`
  const publishedDate = poem.created_at
  const modifiedDate = poem.updated_at

  return generateCopyrightMetadata({
    articleId: poem.id,
    author,
    title: poem.title,
    publishedDate,
    modifiedDate,
    canonicalUrl,
    articleType: 'poem',
  })
}

export default async function PoemPage({ params }: PoemPageProps) {
  const { slug } = await params
  const poem = await getPoem(slug)

  if (!poem) {
    return notFound()
  }

  // Convert poem.content (Markdown) to HTML
  const htmlContent = await markdownToHtml(poem.content || "")

  // Determine author for JSON-LD
  const author = poem.admin?.full_name || poem.admin?.username || 'Whispr'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/poems/${poem.slug || poem.id}`
  const jsonLd = generateJsonLd({
    articleId: poem.id,
    author,
    title: poem.title,
    publishedDate: poem.created_at,
    modifiedDate: poem.updated_at,
    canonicalUrl,
    articleType: 'poem',
  })

  // Pass HTML content to client page
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <PoemClientPage poem={{ ...poem, content: htmlContent }} />
    </>
  )
}
