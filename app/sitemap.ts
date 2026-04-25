import type { MetadataRoute } from "next"
import { createSupabaseServer } from "@/lib/supabase-server"

export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://whisprwords.com").replace(/\/$/, "")

function absoluteUrl(path: string) {
  if (!path || path === "/") return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

function toDate(value?: string | null) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

async function getPublishedCorePosts() {
  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("posts")
      .select("id, type, created_at, updated_at, published_at")
      .eq("status", "published")

    if (error) {
      console.error("Sitemap posts query failed:", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Sitemap posts fetch failed:", error)
    return []
  }
}

async function getPublishedChroniclesPosts() {
  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("chronicles_posts")
      .select("slug, created_at, updated_at, published_at")
      .eq("status", "published")
      .not("slug", "is", null)

    if (error) {
      console.error("Sitemap chronicles posts query failed:", error.message)
      return []
    }

    return (data || []).filter((post) => typeof post.slug === "string" && post.slug.trim().length > 0)
  } catch (error) {
    console.error("Sitemap chronicles posts fetch failed:", error)
    return []
  }
}

async function getPublicCommunityIssues() {
  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("community_issues")
      .select("id, created_at, updated_at")

    if (error) {
      console.error("Sitemap community issues query failed:", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Sitemap community issues fetch failed:", error)
    return []
  }
}

async function getPublicChroniclesCreators() {
  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("chronicles_creators")
      .select("pen_name, created_at")
      .eq("status", "active")

    if (error) {
      console.error("Sitemap creators query failed:", error.message)
      return []
    }

    return (data || []).filter((creator) => typeof creator.pen_name === "string" && creator.pen_name.trim().length > 0)
  } catch (error) {
    console.error("Sitemap creators fetch failed:", error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/about"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/blog"), lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/poems"), lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/media"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/community"), lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/chronicles"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/chronicles/feed"), lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/chronicles/whispr-ai"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/download"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/welcome"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/changelog"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/terms"), lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/whispr-wall"), lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
  ]

  const [corePosts, chroniclesPosts, communityIssues, creators] = await Promise.all([
    getPublishedCorePosts(),
    getPublishedChroniclesPosts(),
    getPublicCommunityIssues(),
    getPublicChroniclesCreators(),
  ])

  const postPages: MetadataRoute.Sitemap = corePosts
    .map((post) => {
      const segment = post.type === "poem" ? "poems" : "blog"
      return {
        url: absoluteUrl(`/${segment}/${post.id}`),
        lastModified: toDate(post.updated_at || post.published_at || post.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }
    })

  const chroniclesPages: MetadataRoute.Sitemap = chroniclesPosts.map((post) => ({
    url: absoluteUrl(`/chronicles/${post.slug}`),
    lastModified: toDate(post.updated_at || post.published_at || post.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const communityPages: MetadataRoute.Sitemap = communityIssues.map((issue) => ({
    url: absoluteUrl(`/community/${issue.id}`),
    lastModified: toDate(issue.updated_at || issue.created_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const creatorPages: MetadataRoute.Sitemap = creators.map((creator) => ({
    url: absoluteUrl(`/chronicles/portfolio/${encodeURIComponent(creator.pen_name)}`),
    lastModified: toDate(creator.created_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  return [...staticPages, ...postPages, ...chroniclesPages, ...communityPages, ...creatorPages]
}
