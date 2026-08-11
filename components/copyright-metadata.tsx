// Copyright Metadata Component
// Adds structured copyright metadata to article pages

import type { Metadata } from 'next'

interface CopyrightMetadataProps {
  articleId?: string
  author: string
  title: string
  publishedDate: string
  modifiedDate?: string
  canonicalUrl: string
  articleType?: 'blog' | 'chronicles' | 'poem'
}

export function generateCopyrightMetadata(props: CopyrightMetadataProps): Metadata {
  const {
    articleId,
    author,
    title,
    publishedDate,
    modifiedDate,
    canonicalUrl,
    articleType = 'blog'
  } = props

  const currentYear = new Date().getFullYear()
  const publishedYear = new Date(publishedDate).getFullYear()

  return {
    title: `${title} - Whispr`,
    description: `Originally published by ${author} on ${new Date(publishedDate).toLocaleDateString()}`,
    authors: [{ name: author }],
    creator: author,
    publisher: 'Whispr',
    other: {
      'article-id': articleId || '',
      'article-type': articleType,
      'canonical-url': canonicalUrl,
      'license': 'Perpetual, non-exclusive license to host and distribute',
      'copyright-holder': author,
      'copyright-year': publishedYear.toString(),
    },
    openGraph: {
      title: `${title} - Whispr`,
      description: `By ${author}`,
      url: canonicalUrl,
      siteName: 'Whispr',
      publishedTime: publishedDate,
      modifiedTime: modifiedDate,
      authors: [author],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - Whispr`,
      description: `By ${author}`,
      creator: '@whispr',
    },
  }
}

export function generateJsonLd(props: CopyrightMetadataProps) {
  const {
    articleId,
    author,
    title,
    publishedDate,
    modifiedDate,
    canonicalUrl,
    articleType = 'blog'
  } = props

  const currentYear = new Date().getFullYear()
  const publishedYear = new Date(publishedDate).getFullYear()

  const baseJsonLd = {
    '@context': 'https://schema.org',
    '@type': articleType === 'poem' ? 'CreativeWork' : 'Article',
    headline: title,
    author: {
      '@type': 'Person',
      name: author,
    },
    copyrightHolder: {
      '@type': 'Person',
      name: author,
    },
    copyrightYear: publishedYear,
    datePublished: publishedDate,
    dateModified: modifiedDate || publishedDate,
    publisher: {
      '@type': 'Organization',
      name: 'Whispr',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com',
    },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    url: canonicalUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    identifier: articleId,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Whispr',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com',
    },
  }

  return JSON.stringify(baseJsonLd)
}
