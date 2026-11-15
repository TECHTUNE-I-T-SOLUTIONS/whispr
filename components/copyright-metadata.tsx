// Copyright Metadata Component
// Builds per-piece metadata + Schema.org structured data for poems, stories,
// chronicles and blog posts.

import type { Metadata } from "next"
import { absoluteUrl, buildMetadata, clampText, plainText, SITE_NAME, SITE_URL } from "@/lib/seo"

type ArticleType = 'blog' | 'chronicles' | 'poem' | 'story'

interface CopyrightMetadataProps {
  articleId?: string
  author: string
  title: string
  publishedDate: string
  modifiedDate?: string
  canonicalUrl: string
  articleType?: ArticleType
  /** Raw excerpt, summary or body — used for the meta description. */
  excerpt?: string | null
  /** Cover / author image URL. */
  image?: string | null
  /** Extra topical keywords. */
  keywords?: string[] | null
}

const TYPE_PATH: Record<ArticleType, string> = {
  poem: '/poems',
  story: '/stories',
  blog: '/blog',
  chronicles: '/chronicles',
}

const TYPE_LABEL: Record<ArticleType, string> = {
  poem: 'poem',
  story: 'story',
  blog: 'article',
  chronicles: 'chronicle',
}

const SCHEMA_TYPE: Record<ArticleType, string> = {
  poem: 'CreativeWork',
  story: 'CreativeWork',
  blog: 'Article',
  chronicles: 'Article',
}

function describe(props: CopyrightMetadataProps) {
  const { author, title, articleType = 'blog', excerpt } = props
  const fallback = `Read "${title}" by ${author} on ${SITE_NAME} — original ${TYPE_LABEL[articleType]}s published with copyright protection built in.`
  const clean = clampText(plainText(excerpt), 155)
  if (clean.length < 40) return fallback
  return `${clean} By ${author} on ${SITE_NAME}.`
}

function pathFor(props: CopyrightMetadataProps) {
  try {
    const url = new URL(props.canonicalUrl)
    return `${url.pathname}${url.search}`
  } catch {
    return `/${TYPE_PATH[props.articleType || 'blog']}/${props.articleId || ''}`
  }
}

export function generateCopyrightMetadata(props: CopyrightMetadataProps): Metadata {
  const {
    author,
    title,
    publishedDate,
    modifiedDate,
    articleType = 'blog',
    keywords,
  } = props

  const typeKeywords = [
    ...(articleType === 'poem' ? ['original poem', 'poetry'] : []),
    ...(articleType === 'story' ? ['short story', 'serialized fiction'] : []),
    ...(keywords || []),
    author,
  ].filter(Boolean) as string[]

  return buildMetadata({
    title, // root layout template appends " | Whispr"
    description: describe(props),
    path: pathFor(props),
    image: props.image || undefined,
    type: 'article',
    publishedTime: publishedDate,
    modifiedTime: modifiedDate || publishedDate,
    authors: [author],
    keywords: Array.from(new Set(typeKeywords)),
  })
}

export function generateJsonLd(props: CopyrightMetadataProps) {
  const {
    articleId,
    author,
    title,
    publishedDate,
    modifiedDate,
    canonicalUrl,
    articleType = 'blog',
    excerpt,
    image,
  } = props

  const publishedYear = new Date(publishedDate).getFullYear()
  const description = clampText(plainText(excerpt), 300) || `${title} by ${author} on ${SITE_NAME}.`
  const authorEntity = {
    "@type": "Person",
    name: author,
    url: absoluteUrl(`/chronicles/portfolio/${encodeURIComponent(author)}`),
  }

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[articleType],
    "@id": canonicalUrl,
    headline: title,
    name: title,
    description,
    abstract: description,
    author: authorEntity,
    creator: authorEntity,
    copyrightHolder: authorEntity,
    copyrightYear: publishedYear,
    copyrightNotice: `© ${publishedYear} ${author}. All rights reserved.`,
    datePublished: publishedDate,
    dateModified: modifiedDate || publishedDate,
    publisher: { "@id": `${SITE_URL}/#organization` },
    license: canonicalUrl,
    url: canonicalUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    identifier: articleId
      ? { "@type": "PropertyValue", propertyID: "Whispr Article ID", value: `WHP-${articleId}` }
      : undefined,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    isAccessibleForFree: true,
    inLanguage: "en",
    ...(image ? { image: absoluteUrl(image) } : {}),
    ...(articleType === 'poem'
      ? { genre: "Poetry", creativeWorkStatus: "Published" }
      : articleType === 'story'
        ? { genre: "Fiction", creativeWorkStatus: "Published" }
        : { articleSection: articleType === 'chronicles' ? 'Chronicles' : 'Blog' }),
  })
}
