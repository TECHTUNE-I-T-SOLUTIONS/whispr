"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { BookOpen, Plus, BarChart2, Eye, Heart, MessageSquare, Share2, Loader2, AlertCircle, Edit, Trash2, Globe, FileText } from "lucide-react"

interface Story {
  id: string
  title: string
  slug: string
  genre: string
  status: "draft" | "published" | "archived"
  views_count: number
  likes_count: number
  comments_count: number
  shares_count: number
  chapters_count: number
  created_at: string
}

export default function CreatorStoriesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseBrowser()

  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchCreatorStories()
  }, [])

  const fetchCreatorStories = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/chronicles/creator/stories")
      if (res.status === 401 || res.status === 403) {
        router.push("/chronicles/login")
        return
      }
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to load stories")
      }
      setStories(data.stories || [])
    } catch (e: any) {
      setError(e.message || "Error fetching your stories")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStory = async () => {
    if (!deletingId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/chronicles/creator/stories?storyId=${deletingId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete story")
      }

      toast({
        title: "Story Deleted 🗑️",
        description: "The story outline and all its associated chapters were permanently removed.",
      })
      setStories((prev) => prev.filter((s) => s.id !== deletingId))
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Could not delete the story.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black pt-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading your stories hub...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black pt-20">
        <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-xl shadow-lg text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 animate-bounce" />
          <p className="text-lg font-bold text-foreground">{error}</p>
          <Button onClick={fetchCreatorStories} variant="outline" className="mt-2">
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back and metrics CTA */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              Creator Stories Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Draft, serialize, and analyze your multi-chapter stories.</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href="/chronicles/stories/metrics">
                <BarChart2 className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 rounded-lg">
              <Link href="/chronicles/stories/new">
                <Plus className="h-4 w-4 mr-1" />
                New Story
              </Link>
            </Button>
          </div>
        </div>

        {/* Stories Listing */}
        {stories.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-2 border-muted bg-transparent rounded-2xl">
            <BookOpen className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-serif font-bold mb-2">No Stories Created Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Bring your characters and worlds to life. Create a story outline, customize details, and write serialized chapters for the Whispr audience.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/95 rounded-lg">
              <Link href="/chronicles/stories/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Story Outline
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <Card
                key={story.id}
                className="group border border-border/10 bg-card hover:bg-card/90 hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden"
              >
                <div className="p-5 md:flex items-center justify-between gap-6">
                  {/* Info Column */}
                  <div className="flex-1 min-w-0 mb-4 md:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-xs">
                        🎭 {story.genre}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/40">
                        {story.chapters_count} Chapters
                      </Badge>
                      {story.status === "published" ? (
                        <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
                          <Globe className="h-3.5 w-3.5" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                          <FileText className="h-3.5 w-3.5" /> Draft Outline
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white truncate">
                      {story.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created on {new Date(story.created_at).toLocaleDateString()}
                    </p>

                    {/* Quick Stats Toolbar */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1" title="Total Views">
                        <Eye className="h-3.5 w-3.5 text-blue-400" /> {story.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Total Likes">
                        <Heart className="h-3.5 w-3.5 text-pink-500" /> {story.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Reader Comments">
                        <MessageSquare className="h-3.5 w-3.5 text-purple-400" /> {story.comments_count || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Total Shares">
                        <Share2 className="h-3.5 w-3.5 text-emerald-400" /> {story.shares_count || 0}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm" className="rounded-lg">
                      <Link href={`/chronicles/stories/${story.id}`}>
                        <Edit className="h-4 w-4 mr-1.5" /> Manage Chapters
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(story.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg h-9 w-9"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border border-border/10 bg-card rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-serif">Confirm Permanent Deletion</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm text-muted-foreground">
                            Are you absolutely sure you want to delete this story? This action cannot be undone. All serialized chapters, viewer comments, and metric aggregates will be deleted forever.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteStory}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                          >
                            {deleting ? "Deleting..." : "Permanently Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
