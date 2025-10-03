"use client"

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Comments } from "@/components/comments"
import { Reactions } from "@/components/reactions"
import { ShareButtons } from "@/components/share-buttons"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, BookOpen } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { SafeImage } from "@/components/SafeImage"
import { MediaPlayer } from "@/components/media-player"

interface PoemClientPageProps {
  poem: any
}

export default function PoemClientPage({ poem }: PoemClientPageProps) {
  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/poems/${poem.id}`

  return (
    <div className="whispr-gradient min-h-screen">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Poem Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <BookOpen className="h-4 w-4" />
              <span>Poetry</span>
              <span>•</span>
              <Calendar className="h-4 w-4" />
              <span>{formatDate(poem.created_at)}</span>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>{Math.ceil(poem.content.split(" ").length / 200)} min read</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {poem.title}
            </h1>

            {poem.excerpt && <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{poem.excerpt}</p>}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Prayce</span>
              </div>
              {poem.tags && poem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {poem.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {poem.featured_image && (
            <div className="mb-8">
              <SafeImage
                src={poem.featured_image}
                alt={poem.title}
                width={800}
                height={400}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                priority
              />
            </div>
          )}

          {/* Media Files */}
          {poem.media_files?.length > 0 && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {poem.media_files.map((file: any, index: number) => (
                <MediaPlayer
                  key={index}
                  media={{
                    id: file.id || `media-${index}`,
                    original_name: file.original_name || file.file_name || `Media ${index + 1}`,
                    file_name: file.file_name || file.original_name || `media-${index}`,
                    file_path: file.file_path || "",
                    file_url: file.file_url || "",
                    file_type: file.file_type || "application/octet-stream",
                    file_size: file.file_size || 0
                  }}
                  showControls={false}
                  showDownload={false}
                  hideMeta={true}
                />
              ))}
            </div>
          )}

          {/* Poem Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="prose poem-content" dangerouslySetInnerHTML={{ __html: poem.content }} />
            </CardContent>
          </Card>

          {/* Engagement Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <Suspense fallback={<ReactionsSkeleton />}>
                <Reactions postId={poem.id} />
              </Suspense>
            </div>
            <div className="lg:col-span-2">
              <ShareButtons
                url={currentUrl}
                title={poem.title}
                description={poem.excerpt || `A beautiful poem by Prayce: ${poem.title}`}
              />
            </div>
          </div>

          <Suspense fallback={<CommentsSkeleton />}>
            <Comments postId={poem.id} />
          </Suspense>
        </div>
      </div>

      {/* Custom styles for poem content */}
      <style jsx global>{`
        .poem-content {
          white-space: pre-wrap;
          line-height: 1.8;
          font-size: 1.1rem;
          word-break: break-word;
        }

        .poem-content strong {
          font-weight: bold;
          color: inherit;
        }

        .poem-content p {
          margin-bottom: 1.5rem;
          text-align: left;
        }
            
        .poem-content blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 2rem 0;
          font-style: italic;
          background: hsl(var(--muted) / 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
        }
        
        .poem-content h1,
        .poem-content h2,
        .poem-content h3 {
          color: hsl(var(--primary));
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .poem-content em {
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        
        .poem-content strong {
          font-weight: 600;
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  )
}

function ReactionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 bg-muted rounded w-32 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <div className="rounded-full bg-muted h-10 w-10 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                <div className="h-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
