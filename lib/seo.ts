import type { Metadata } from "next"

/**
 * Central SEO configuration for Whispr.
 *
 * Every route should build its metadata through `buildMetadata()` so that
 * titles, canonicals, Open Graph and Twitter cards stay consistent. This is
 * what removes the "duplicate title / missing canonical" audit findings.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://whisprwords.com"
).replace(/\/$/, "")

export const SITE_NAME = "Whispr"
export const SITE_TAGLINE = "Original Poetry, Stories & Verse"
export const DEFAULT_OG_IMAGE = "/lightlogo.png"
export const TWITTER_HANDLE = "@whisprwords"

/**
 * Every official Whispr profile, all on the @whisprwords handle where the
 * network supports one. These feed `Organization.sameAs` — the signal search
 * engines and AI assistants use to confirm one entity across the web.
 */
export const SOCIAL_PROFILES = [
  "https://x.com/whisprwords",
  "https://www.instagram.com/whisprwords",
  "https://www.pinterest.com/whisprwords",
  "https://www.facebook.com/whisprwords",
  "https://www.tiktok.com/@whisprwords",
  "https://www.youtube.com/@whisprwords",
  "https://www.threads.com/@whisprwords",
  "https://medium.com/@whisprwords",
  "https://whisprwords.substack.com",
  "https://github.com/whisprwords",
]

export function absoluteUrl(path = "/") {
  if (!path) return `${SITE_URL}/`
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/** Trim text on a word boundary so previews never end mid-word. */
export function clampText(input: string | null | undefined, max = 160) {
  const text = (input || "").replace(/\s+/g, " ").trim()
  if (!text) return ""
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  const body = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${body.replace(/[.,;:\-–—]+$/, "")}…`
}

/** Strip markdown/HTML so excerpts stay clean in meta descriptions and schema. */
export function plainText(input: string | null | undefined) {
  return (input || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>~|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

interface BuildMetadataOptions {
  title: string
  description: string
  path?: string
  image?: string
  type?: "website" | "article" | "profile" | "book"
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  keywords?: string[]
  noIndex?: boolean
}

export function buildMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  keywords,
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path)
  const ogImage = absoluteUrl(image)
  const desc = clampText(description, 160)

  return {
    title,
    description: desc,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: true }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE_NAME,
      type: type === "profile" || type === "book" ? "website" : type,
      locale: "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${title} — ${SITE_NAME}` }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors?.length ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
  }
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: "WhisprWords",
    alternateName: ["WhisprWords", "Whispr Words", "Whispr"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/lightlogo.png"),
      width: 512,
      height: 512,
    },
    image: absoluteUrl("/lightlogo.png"),
    description:
      "Whispr is a curated publishing platform for original poetry, short stories and serialized fiction, with copyright fingerprinting and creator protection built in.",
    email: "support@whisprwords.com",
    foundingDate: "2025",
    sameAs: SOCIAL_PROFILES,
    publishingPrinciples: absoluteUrl("/about"),
    knowsAbout: [
      "poetry",
      "creative writing",
      "short stories",
      "serialized fiction",
      "copyright protection for writers",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@whisprwords.com",
        url: absoluteUrl("/community"),
        availableLanguage: ["English"],
      },
    ],
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: "WhisprWords",
    url: SITE_URL,
    description:
      "Read original poetry, whisper stories and serialized fiction from independent writers — or publish your own with copyright protection built in.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/poems?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/** Serialise one or more schema objects into escaped JSON-LD strings. */
export function serializeJsonLd(data: object | object[]) {
  const blocks = Array.isArray(data) ? data : [data]
  return blocks.map((block) =>
    // Escape "<" so a "</script>" inside content can never break out of the tag.
    JSON.stringify(block).replace(/</g, "\\u003c"),
  )
}
