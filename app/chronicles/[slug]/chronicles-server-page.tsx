import { notFound } from "next/navigation"
import { getChroniclesPostBySlug } from "@/lib/services/chronicles.service"
import { generateCopyrightMetadata, generateJsonLd } from "@/components/copyright-metadata"
import ChroniclesClientPage from "./chronicles-client-page"

interface ChroniclesPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ChroniclesPageProps) {
  const { slug } = await params
  const post = await getChroniclesPostBySlug(slug)

  if (!post) {
    return {
      title: "Post Not Found - Whispr Chronicles",
    }
  }

  // Support chronicle creators as authors
  const author = post.creator?.penName || post.creator?.name || 'Anonymous'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/chronicles/${post.slug}`
  const publishedDate = post.publishedAt
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
  const post = await getChroniclesPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // Generate JSON-LD with chronicle creator as author
  const author = post.creator?.penName || post.creator?.name || 'Anonymous'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/chronicles/${post.slug}`
  const jsonLd = generateJsonLd({
    articleId: post.id,
    author,
    title: post.title,
    publishedDate: post.publishedAt,
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
      <ChroniclesClientPage initialPost={post} />
    </>
  )
}
