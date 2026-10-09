"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Comments } from "@/components/comments"
import { Reactions } from "@/components/reactions"
import { ShareButtons } from "@/components/share-buttons"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, BookOpen, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { MediaPlayer } from "@/components/media-player"
import AdvancedFeaturesModal from "@/components/advanced-features-modal"
import { AppBanner } from "@/components/app-banner"
import { CopyrightFooter } from "@/components/copyright-footer"
import Link from "next/link"
import Image from "next/image"

interface PoemClientPageProps {
  poem: any
}

interface SuggestedPost {
  id: string
  title: string
  slug: string
  excerpt: string
  type: "blog" | "poem"
  tags: string[]
  cover_image_url?: string
  created_at: string
  reading_time: number
  admin: { id: string; username: string; full_name: string; avatar_url?: string }
}

function getPoemImage(poem: any): string | null {
  if (poem.cover_image_url) return poem.cover_image_url
  if (poem.featured_image) return poem.featured_image
  if (Array.isArray(poem.media_files)) {
    const img = poem.media_files.find(
      (f: any) =>
        f.file_type?.startsWith("image/") ||
        (f.file_url || "").match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)
    )
    if (img) return img.file_url || img.file_path || null
  }
  return null
}

function getNonImageMedia(poem: any): any[] {
  if (!Array.isArray(poem.media_files)) return []
  return poem.media_files.filter(
    (f: any) =>
      !f.file_type?.startsWith("image/") &&
      !(f.file_url || "").match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)
  )
}

export default function PoemClientPage({ poem }: PoemClientPageProps) {
  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/poems/${poem.slug || poem.id}`
  const contentRef = useRef<HTMLDivElement>(null)
  const [autoScrollMode, setAutoScrollMode] = useState(false)
  const [suggestedPosts, setSuggestedPosts] = useState<SuggestedPost[]>([])
  const [loadingSuggested, setLoadingSuggested] = useState(false)
  const [imgError, setImgError] = useState(false)

  const heroImage = getPoemImage(poem)
  const otherMedia = getNonImageMedia(poem)
  const authorName = poem.admin?.full_name || poem.admin?.username || "Whispr"
  const readingMins = Math.max(1, Math.ceil(poem.content?.split(" ").length / 200))

  useEffect(() => {
    let cancelled = false
    const fetchSuggested = async () => {
      setLoadingSuggested(true)
      try {
        const res = await fetch(`/api/posts/suggested-posts?postId=${poem.id}&type=poem&limit=6`)
        if (!cancelled && res.ok) {
          const data = await res.json()
          setSuggestedPosts(data.posts || [])
        }
      } catch (e) {
        console.warn("[PoemClientPage] suggested posts error:", e)
      } finally {
        if (!cancelled) setLoadingSuggested(false)
      }
    }
    fetchSuggested()
    return () => { cancelled = true }
  }, [poem.id])

  const showImage = heroImage && !imgError

  return (
    <div className="whispr-gradient min-h-screen">

      {/* ══════════════════════════════════════════════
          HERO — full-width two-panel layout
          Left panel: artwork / image
          Right panel: title, meta, excerpt
      ══════════════════════════════════════════════ */}
      <div className="w-full border-b border-border/20">
        <div className="container max-w-7xl mx-auto">
          <div className={`grid min-h-[60vh] md:min-h-[70vh] ${showImage ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-4xl"}`}>

            {/* ── Left: Image panel ── */}
            {showImage && (
              <div className="relative h-72 md:h-full overflow-hidden bg-muted order-1">
                <Image
                  src={heroImage!}
                  alt={poem.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setImgError(true)}
                />
                {/* subtle gradient toward right edge so text panel blends */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/40 hidden md:block" />
              </div>
            )}

            {/* ── Right (or centre when no image): title + meta ── */}
            <div className={`flex flex-col justify-center px-8 py-14 md:py-20 order-2 ${showImage ? "md:pl-14 md:pr-16" : "mx-auto w-full"}`}>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 uppercase tracking-widest font-medium">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Poetry</span>
                <span className="opacity-40">•</span>
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(poem.created_at)}</span>
                <span className="opacity-40">•</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{readingMins} min</span>
              </div>

              {/* Title */}
              <h1 className="font-serif font-bold leading-[1.1] tracking-tight mb-6 text-foreground"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}>
                {poem.title}
              </h1>

              {/* Excerpt */}
              {poem.excerpt && (
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-serif italic mb-8 max-w-prose">
                  {poem.excerpt}
                </p>
              )}

              {/* Author chip */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm font-serif">
                  {authorName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{authorName}</p>
                  <p className="text-xs text-muted-foreground">Author</p>
                </div>
              </div>

              {/* Tags */}
              {poem.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {poem.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs rounded-full px-3 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════ */}
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className={`grid gap-10 ${showImage ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1 max-w-3xl mx-auto"}`}>

          {/* ── Main column: poem + engagement ── */}
          <div className="min-w-0">

            {/* Poem card */}
            <Card className="mb-10 border border-border/30 bg-card/60 backdrop-blur-sm shadow-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 px-6 py-4">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Read the Poem</span>
                <AdvancedFeaturesModal
                  text={poem.content.replace(/<[^>]*>/g, "")}
                  contentRef={contentRef}
                  onAutoScrollChange={setAutoScrollMode}
                />
              </CardHeader>

              <CardContent className="p-0">
                {autoScrollMode ? (
                  /* Auto-scroll teleprompter view */
                  <div className="h-[480px] bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-hidden">
                    <div
                      ref={contentRef}
                      className="h-full overflow-y-scroll px-6 py-10 text-center scroll-smooth"
                    >
                      <div
                        className="space-y-4 pb-96"
                        dangerouslySetInnerHTML={{
                          __html: poem.content
                            .replace(/<p>/g, '<p class="text-xl md:text-2xl font-serif font-light leading-loose text-slate-800 dark:text-slate-200">')
                        }}
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                ) : (
                  /* Normal reading view */
                  <div
                    ref={contentRef}
                    className="poem-content px-8 py-10 md:px-16 md:py-14 font-serif"
                    dangerouslySetInnerHTML={{ __html: poem.content }}
                    suppressHydrationWarning
                  />
                )}
              </CardContent>
            </Card>

            {/* Non-image media (audio / video) */}
            {otherMedia.length > 0 && (
              <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherMedia.map((file: any, i: number) => (
                  <MediaPlayer
                    key={i}
                    media={{
                      id: file.id || `media-${i}`,
                      original_name: file.original_name || file.file_name || `Media ${i + 1}`,
                      file_name: file.file_name || `media-${i}`,
                      file_path: file.file_path || "",
                      file_url: file.file_url || "",
                      file_type: file.file_type || "application/octet-stream",
                      file_size: file.file_size || 0,
                    }}
                    showControls={false}
                    showDownload={false}
                    hideMeta={true}
                  />
                ))}
              </div>
            )}

            {/* Reactions + share */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div className="lg:col-span-1">
                <Suspense fallback={<SkeletonBox className="h-24" />}>
                  <Reactions postId={poem.id} />
                </Suspense>
              </div>
              <div className="lg:col-span-2">
                <ShareButtons
                  url={currentUrl}
                  title={poem.title}
                  description={poem.excerpt || `A poem by Whispr: ${poem.title}`}
                />
              </div>
            </div>

            {/* Comments */}
            <Suspense fallback={<CommentsSkeleton />}>
              <Comments postId={poem.id} />
            </Suspense>

            {/* App banner */}
            <div className="mt-12">
              <AppBanner postId={poem.id} postType="post" />
            </div>

            {/* Copyright */}
            <div className="mt-8">
              <CopyrightFooter
                articleId={poem.id}
                author={authorName}
                publishedDate={poem.created_at}
                canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || "https://whisprwords.com"}/poems/${poem.slug || poem.id}`}
                articleType="post"
              />
            </div>
          </div>

          {/* ── Sidebar (desktop only) ── */}
          {showImage && (
            <aside className="hidden lg:flex flex-col gap-6 self-start sticky top-6">

              {/* About the poem */}
              <Card className="border border-border/30 bg-card/60 backdrop-blur-sm shadow-md">
                <CardContent className="p-6 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">About</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold font-serif">
                      {authorName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{authorName}</p>
                      <p className="text-xs text-muted-foreground">Poet</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-4">
                    <div className="flex justify-between">
                      <span>Published</span>
                      <span className="font-medium text-foreground">{formatDate(poem.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reading time</span>
                      <span className="font-medium text-foreground">{readingMins} min</span>
                    </div>
                    {poem.view_count > 0 && (
                      <div className="flex justify-between">
                        <span>Views</span>
                        <span className="font-medium text-foreground">{poem.view_count.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {poem.tags?.length > 0 && (
                <Card className="border border-border/30 bg-card/60 backdrop-blur-sm shadow-md">
                  <CardContent className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {poem.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs rounded-full">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            Suggested Poems
        ══════════════════════════════════════════════ */}
        {(loadingSuggested || suggestedPosts.length > 0) && (
          <div className="mt-16 pt-12 border-t border-border/30">
            <h2 className="text-2xl font-serif font-bold mb-8">You Might Also Like</h2>
            {loadingSuggested ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.type === "poem" ? "poems" : "blog"}/${post.slug}`}
                    className="group block"
                  >
                    <div className="h-full rounded-xl bg-card/50 border border-border/30 overflow-hidden hover:shadow-lg hover:border-border/60 transition-all duration-300">
                      {post.cover_image_url && (
                        <div className="relative h-44 w-full overflow-hidden bg-muted">
                          <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                          />
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-card/80 backdrop-blur text-foreground">
                              {post.type === "poem" ? "✨ Poem" : "📖 Blog"}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-serif font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 italic">{post.excerpt}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{post.admin?.full_name || post.admin?.username || "Whispr"}</span>
                          <span>{post.reading_time || 1} min read</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Poem content styles */}
      <style jsx global>{`
        .poem-content {
          font-size: clamp(1.0625rem, 2vw, 1.2rem);
          line-height: 1.75;
          white-space: pre-wrap;
          word-break: break-word;
          color: hsl(var(--foreground));
        }

        .poem-content p {
          margin-bottom: 0.35rem;
        }

        .poem-content p:empty,
        .poem-content br {
          display: block;
          content: '';
          margin-bottom: 1rem;
        }

        .poem-content strong {
          font-weight: 700;
        }

        .poem-content em {
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }

        .poem-content blockquote {
          border-left: 3px solid hsl(var(--primary) / 0.6);
          padding: 0.75rem 1.25rem;
          margin: 1.5rem 0;
          font-style: italic;
          background: hsl(var(--muted) / 0.25);
          border-radius: 0 0.5rem 0.5rem 0;
        }

        .poem-content h1,
        .poem-content h2,
        .poem-content h3 {
          font-family: var(--font-serif, Georgia, serif);
          color: hsl(var(--primary));
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
      `}</style>
    </div>
  )
}

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-muted/50 animate-pulse ${className}`} />
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 bg-muted/50 rounded w-28 animate-pulse" />
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <div className="rounded-full bg-muted/50 h-9 w-9 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-muted/50 rounded w-1/4 animate-pulse" />
                <div className="h-14 bg-muted/50 rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
