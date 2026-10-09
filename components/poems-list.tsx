import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Calendar, PenTool } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

type Poem = {
  id: string
  title: string
  content: string
  excerpt?: string
  type: "poem" | "blog"
  status: "draft" | "published" | "archived"
  admin_id?: string
  featured?: boolean
  reading_time?: number
  tags?: string[]
  media_files?: any
  cover_image_url?: string
  seo_title?: string
  seo_description?: string
  slug?: string
  view_count?: number
  created_at?: string
  updated_at?: string
  published_at?: string
  admin?: {
    full_name?: string
    username?: string
    avatar_url?: string
  }
}

interface PoemsListProps {
  poems: Poem[]
}

function getPoemImage(poem: Poem): string | null {
  if (poem.cover_image_url) return poem.cover_image_url
  if (poem.media_files && Array.isArray(poem.media_files)) {
    const img = poem.media_files.find((f: any) =>
      f.file_type?.startsWith("image/") || f.file_url?.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)
    )
    if (img) return img.file_url || img.file_path || null
  }
  return null
}

function getExcerpt(poem: Poem, maxLen = 200): string {
  return (
    poem.excerpt ||
    poem.content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, maxLen)
  )
}

export const PoemsList: React.FC<PoemsListProps> = ({ poems }) => {
  if (!poems.length) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
            <PenTool className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-serif font-semibold mb-2">No poems yet</h3>
          <p className="text-muted-foreground">Words are forming… Soon, verses will be whispered.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif font-bold mb-2">All Poems</h2>
        <p className="text-muted-foreground">
          {poems.length} {poems.length === 1 ? "poem" : "poems"} in Whispr's whispering vault
        </p>
      </div>

      <div className="space-y-0 divide-y divide-border/40">
        {poems.map((poem, index) => {
          const imageUrl = getPoemImage(poem)
          const excerpt = getExcerpt(poem, 220)
          const authorName = poem.admin?.full_name || poem.admin?.username || "Whispr"
          const href = `/poems/${poem.slug || poem.id}`
          const isEven = index % 2 === 0

          return (
            <Link
              key={poem.id}
              href={href}
              className="group block py-6 first:pt-0"
            >
              {/* Each poem card: image + text side by side */}
              <div
                className={`flex flex-col md:flex-row gap-0 overflow-hidden rounded-2xl bg-card/40 hover:bg-card/70 border border-border/30 hover:border-border/60 transition-all duration-300 shadow-sm hover:shadow-lg ${
                  !isEven ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Image side */}
                {imageUrl ? (
                  <div className="relative md:w-2/5 h-64 md:h-auto overflow-hidden flex-shrink-0">
                    <Image
                      src={imageUrl}
                      alt={poem.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                    {/* Gradient overlay */}
                    <div
                      className={`absolute inset-0 ${
                        isEven
                          ? "bg-gradient-to-r from-transparent to-card/30"
                          : "bg-gradient-to-l from-transparent to-card/30"
                      }`}
                    />
                    {poem.featured && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-primary/90 text-primary-foreground text-xs">⭐ Featured</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No image fallback – decorative bg panel */
                  <div
                    className={`relative md:w-2/5 h-40 md:h-auto flex-shrink-0 flex items-center justify-center overflow-hidden ${
                      index % 3 === 0
                        ? "bg-gradient-to-br from-rose-100 to-pink-200 dark:from-rose-900/30 dark:to-pink-900/30"
                        : index % 3 === 1
                        ? "bg-gradient-to-br from-violet-100 to-indigo-200 dark:from-violet-900/30 dark:to-indigo-900/30"
                        : "bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/30"
                    }`}
                  >
                    <span className="text-6xl opacity-20 select-none font-serif">"</span>
                    {poem.featured && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-primary/90 text-primary-foreground text-xs">⭐ Featured</Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Text side */}
                <div className="flex-1 flex flex-col justify-center p-7 md:p-10">
                  <div className="mb-3">
                    <Badge variant="secondary" className="bg-secondary/40 text-xs mb-4">
                      ✨ Poem
                    </Badge>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors mb-4">
                      {poem.title}
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed line-clamp-3 md:line-clamp-4 font-serif italic">
                      {excerpt}
                    </p>
                  </div>

                  {poem.tags && poem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {poem.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {poem.tags.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{poem.tags.length - 4} more</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span>{authorName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{poem.reading_time || 2}m read</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {poem.created_at
                            ? formatDistanceToNow(new Date(poem.created_at), { addSuffix: true })
                            : "Recently"}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary group-hover:translate-x-1 transition-transform inline-block">
                      Read →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
