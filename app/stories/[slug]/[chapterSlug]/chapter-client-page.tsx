"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import {
  BookOpen, Menu, ChevronLeft, ChevronRight, Maximize2, X, Sparkles, TypeOutline,
  ThumbsUp, ThumbsDown, MessageSquare, Send
} from "lucide-react"

interface ChapterClientPageProps {
  story: any
  chapter: any
  allChapters: any[]
  prevChapterSlug: string | null
  nextChapterSlug: string | null
}

type FontSize = "sm" | "base" | "lg" | "xl"

export default function ChapterClientPage({
  story,
  chapter,
  allChapters,
  prevChapterSlug,
  nextChapterSlug,
}: ChapterClientPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseBrowser()

  const [scrollProgress, setScrollProgress] = useState(0)
  const [fontSize, setFontSize] = useState<FontSize>("base")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [immersiveMode, setImmersiveMode] = useState(false)

  // ----- Comments state -----
  const [user, setUser] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [commenterName, setCommenterName] = useState("")
  const [commenterEmail, setCommenterEmail] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [savedGuestName, setSavedGuestName] = useState("")
  const [savedGuestEmail, setSavedGuestEmail] = useState("")

  // ----- Reactions state -----
  const [likesCount, setLikesCount] = useState(chapter.likes_count || 0)
  const [dislikesCount, setDislikesCount] = useState(chapter.dislikes_count || 0)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [loadingReaction, setLoadingReaction] = useState(true)

  // 1. Monitor scroll coordinates to compute horizontal progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100
        setScrollProgress(progress)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // 2. Load user, comments, and reactions on mount
  useEffect(() => {
    const initialize = async () => {
      // Check user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Try fetching creator details for chronicles users
        const { data: creator } = await supabase
          .from("chronicles_creators")
          .select("pen_name, display_name, email")
          .eq("user_id", user.id)
          .single()

        const creatorData = creator as { pen_name?: string; display_name?: string; email?: string } | null
        const name = creatorData
          ? (creatorData.display_name || creatorData.pen_name)
          : (user.user_metadata?.full_name || user.email?.split("@")[0] || "Reader")
        setCommenterName(name)
      } else {
        // Check localStorage for saved guest identity
        const savedName = localStorage.getItem("whispr_guest_name")
        const savedEmail = localStorage.getItem("whispr_guest_email")
        if (savedName) {
          setSavedGuestName(savedName)
          setCommenterName(savedName)
        }
        if (savedEmail) {
          setSavedGuestEmail(savedEmail)
          setCommenterEmail(savedEmail)
        }
      }

      // Fetch comments
      fetchComments()
      // Fetch reactions
      fetchReactions()
    }

    initialize()
  }, [chapter.id])

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `/api/stories/chapter-comment?chapterId=${chapter.id}&storyId=${story.id}&authorType=${story.author_type}`
      )
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error("Chapter comments fetch error:", err)
    }
  }

  const fetchReactions = async () => {
    try {
      setLoadingReaction(true)
      const res = await fetch(
        `/api/stories/chapter-reaction?chapterId=${chapter.id}&storyId=${story.id}&authorType=${story.author_type}`
      )
      if (res.ok) {
        const data = await res.json()
        setLikesCount(data.likes)
        setDislikesCount(data.dislikes)
        setUserReaction(data.userReaction)
      }
    } catch (err) {
      console.error("Chapter reactions fetch error:", err)
    } finally {
      setLoadingReaction(false)
    }
  }

  // 3. Handle reaction (like / dislike) — works for both authenticated and anonymous users
  const handleReaction = async (type: 'like' | 'dislike') => {
    // Optimistic update
    const wasLiked = userReaction === 'like'
    const wasDisliked = userReaction === 'dislike'
    const isSameReaction = userReaction === type

    // Toggle counts optimistically
    if (isSameReaction) {
      // Remove reaction
      if (type === 'like') setLikesCount((prev: number) => Math.max(0, prev - 1))
      else setDislikesCount((prev: number) => Math.max(0, prev - 1))
      setUserReaction(null)
    } else {
      // Change or add reaction
      if (wasLiked) setLikesCount((prev: number) => Math.max(0, prev - 1))
      if (wasDisliked) setDislikesCount((prev: number) => Math.max(0, prev - 1))
      if (type === 'like') setLikesCount((prev: number) => prev + 1)
      else setDislikesCount((prev: number) => prev + 1)
      setUserReaction(type)
    }

    try {
      const res = await fetch("/api/stories/chapter-reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: chapter.id,
          storyId: story.id,
          authorType: story.author_type,
          reactionType: type,
        }),
      })

      if (!res.ok) {
        // Rollback on error
        fetchReactions()
        const data = await res.json()
        throw new Error(data.error || "Failed to save reaction")
      }

      toast({
        title: isSameReaction ? "Reaction removed" : `${type === 'like' ? "Liked" : "Disliked"} chapter`,
        description: isSameReaction
          ? `You removed your ${type} from this chapter.`
          : `You ${type === 'like' ? "liked" : "disliked"} "${chapter.title}".`,
      })
    } catch (err: any) {
      toast({
        title: "Reaction Error",
        description: err.message || "Failed to update reaction",
        variant: "destructive",
      })
    }
  }

  // 4. Handle comment submit (supports guest commenters)
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() || !commenterName.trim()) {
      toast({
        title: "Empty fields",
        description: "Please enter your name and comment content.",
        variant: "destructive",
      })
      return
    }

    setSubmittingComment(true)

    try {
      // Save guest identity to localStorage if not logged in
      if (!user) {
        localStorage.setItem("whispr_guest_name", commenterName.trim())
        if (commenterEmail.trim()) {
          localStorage.setItem("whispr_guest_email", commenterEmail.trim())
        }
      }

      const res = await fetch("/api/stories/chapter-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: chapter.id,
          storyId: story.id,
          authorType: story.author_type,
          content: newComment.trim(),
          commenterName: commenterName.trim(),
          commenterEmail: commenterEmail.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment")
      }

      toast({
        title: "Comment published",
        description: "Your thought on this chapter has been recorded!",
      })
      setNewComment("")
      fetchComments()
    } catch (err: any) {
      toast({
        title: "Comment Failed",
        description: err.message || "Could not publish your comment.",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  // Class helper for font size
  const getFontSizeClass = () => {
    switch (fontSize) {
      case "sm":
        return "text-base md:text-md"
      case "lg":
        return "text-xl md:text-2xl"
      case "xl":
        return "text-2xl md:text-3xl"
      case "base":
      default:
        return "text-lg md:text-xl"
    }
  }

  return (
    <div className={`whispr-gradient min-h-screen pb-16 transition-all duration-500 ${immersiveMode ? "pt-4" : "pt-8"}`}>
      {/* 1. SCROLL PROGRESS BAR */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Immersive Top Bar */}
      <div className="container max-w-3xl mx-auto px-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!immersiveMode && (
            <Link
              href={`/stories/${story.slug}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Outline
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 bg-background/40 backdrop-blur border border-border/10 p-1.5 rounded-full shadow-lg">
          {/* Chapter list drawer trigger */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDrawerOpen(true)}
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            title="Table of Contents"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Sizing controls */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setFontSize((prev) => (prev === "sm" ? "base" : prev === "base" ? "lg" : prev === "lg" ? "xl" : "sm"))}
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            title="Adjust Font Size"
          >
            <TypeOutline className="h-4 w-4" />
          </Button>

          {/* Immersive mode trigger */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setImmersiveMode((prev) => !prev)}
            className={`h-8 w-8 rounded-full transition-all ${
              immersiveMode ? "bg-primary text-primary-foreground" : "hover:bg-primary/10 hover:text-primary"
            }`}
            title="Focus Mode"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Immersive Floating Title */}
      {immersiveMode && (
        <div className="fixed top-4 left-6 z-40 hidden md:block bg-background/50 backdrop-blur border border-border/10 px-3 py-1.5 rounded-lg text-xs text-muted-foreground animate-slide-in">
          {story.title} • Chapter {chapter.sequence}
        </div>
      )}

      {/* Main Immersive Reading Block */}
      <article className="container max-w-2xl mx-auto px-4 mt-8">
        <header className="mb-8 text-center">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs uppercase px-3 py-0.5 rounded-full mb-3">
            ✨ Chapter {chapter.sequence}
          </Badge>
          <h1 className="font-serif text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight mb-2">
            {chapter.title}
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            From "{story.title}"
          </p>
        </header>

        {/* Immersive Reading Canvas */}
        <Card className="border-0 bg-card/35 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden mb-8">
          <CardContent className="p-8 md:p-12">
            <div
              className={`prose prose-invert max-w-none leading-relaxed font-serif ${getFontSizeClass()} text-slate-900 dark:text-slate-200 focus:outline-none scroll-smooth`}
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          </CardContent>
        </Card>

        {/* Reactions Bar (Like / Dislike) */}
        <div className="flex items-center justify-center gap-4 mb-8 bg-card/30 backdrop-blur border border-border/10 p-3 rounded-2xl">
          <Button
            variant={userReaction === 'like' ? "default" : "ghost"}
            size="sm"
            onClick={() => handleReaction('like')}
            disabled={loadingReaction}
            className={`rounded-full flex items-center gap-2 px-5 transition-all ${
              userReaction === 'like'
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
            }`}
          >
            <ThumbsUp className={`h-4 w-4 ${userReaction === 'like' ? "fill-white" : ""}`} />
            <span className="text-sm font-semibold">{likesCount}</span>
          </Button>

          <div className="w-px h-6 bg-border/30" />

          <Button
            variant={userReaction === 'dislike' ? "default" : "ghost"}
            size="sm"
            onClick={() => handleReaction('dislike')}
            disabled={loadingReaction}
            className={`rounded-full flex items-center gap-2 px-5 transition-all ${
              userReaction === 'dislike'
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            }`}
          >
            <ThumbsDown className={`h-4 w-4 ${userReaction === 'dislike' ? "fill-white" : ""}`} />
            <span className="text-sm font-semibold">{dislikesCount}</span>
          </Button>

          <div className="w-px h-6 bg-border/30" />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{comments.length} comments</span>
          </div>
        </div>

        {/* Comments Section */}
        <Card className="border-0 bg-card/35 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden mb-8">
          <CardContent className="p-6 md:p-8">
            <h3 className="font-serif text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
              <MessageSquare className="h-5 w-5 text-primary" />
              Reader Reactions ({comments.length})
            </h3>

            {/* Comment Form - Supports both authenticated users and guests */}
            <form onSubmit={handleCommentSubmit} className="space-y-4 mb-8 bg-muted/15 p-4 rounded-xl border border-border/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-1 block">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={commenterName}
                    onChange={(e) => setCommenterName(e.target.value)}
                    placeholder={user ? "Your display name" : "Enter your name..."}
                    required
                    className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                  />
                </div>
                {!user && (
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold mb-1 block">
                      Email (optional - for replies)
                    </label>
                    <Input
                      type="email"
                      value={commenterEmail}
                      onChange={(e) => setCommenterEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">
                  Your Thought <span className="text-red-400">*</span>
                </label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this chapter..."
                  required
                  rows={4}
                  className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif"
                />
              </div>
              <div className="flex items-center justify-between">
                {!user && (
                  <p className="text-[10px] text-muted-foreground italic">
                    Your name & email will be saved locally for future comments.
                  </p>
                )}
                <Button type="submit" disabled={submittingComment} className="rounded-lg flex items-center gap-2 ml-auto">
                  {submittingComment ? "Publishing..." : "Post Comment"}
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground text-sm">No thoughts posted yet. Be the first to share your reaction to this chapter!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {comments.map((comm) => (
                  <div key={comm.id} className="p-4 bg-muted/10 rounded-xl border border-border/5 space-y-2 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">@{comm.commenter_name}</span>
                      <span>•</span>
                      <span>{new Date(comm.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}</span>
                      {comm.commenter_email && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-muted-foreground/60">{comm.commenter_email}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-slate-900 dark:text-slate-200 leading-relaxed font-serif">
                      {comm.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Immersive Footer Navigation */}
        <div className="flex items-center justify-between bg-card/45 backdrop-blur border border-border/20 p-4 rounded-2xl shadow-xl">
          {prevChapterSlug ? (
            <Button
              asChild
              variant="ghost"
              className="hover:bg-primary/10 hover:text-primary transition-all rounded-xl pl-2 text-sm"
            >
              <Link href={`/stories/${story.slug}/${prevChapterSlug}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous Chapter
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" disabled className="opacity-30 rounded-xl pl-2 text-sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              First Chapter
            </Button>
          )}

          <div className="text-xs text-muted-foreground hidden sm:block">
            Chapter {chapter.sequence} of {allChapters.length}
          </div>

          {nextChapterSlug ? (
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-xl pr-2 text-sm font-semibold"
            >
              <Link href={`/stories/${story.slug}/${nextChapterSlug}`}>
                Next Chapter
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 hover:text-primary transition-all rounded-xl pr-2 text-sm font-semibold"
            >
              <Link href={`/stories/${story.slug}`}>
                Finish Story
                <Sparkles className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </article>

      {/* 2. TABLE OF CONTENTS COLLAPSIBLE SIDE DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
          <div className="w-80 h-full bg-card/90 backdrop-blur-md border-l border-border/20 p-6 flex flex-col justify-between animate-slide-in shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-6">
                <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-primary" />
                  Table of Contents
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDrawerOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Story Outline preview */}
              <div className="p-3 bg-muted/20 border border-border/10 rounded-xl mb-6">
                <h4 className="text-xs text-muted-foreground font-semibold uppercase mb-1">Outline</h4>
                <p className="text-sm font-bold truncate">{story.title}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">by @{story.author_username}</p>
              </div>

              {/* Chapters list */}
              <div className="space-y-1 overflow-y-auto max-h-[60vh] pr-1">
                {allChapters.map((c) => {
                  const isCurrent = c.id === chapter.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setDrawerOpen(false)
                        router.push(`/stories/${story.slug}/${c.slug}`)
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-sm transition-all duration-300 flex items-center gap-3 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-primary/10 hover:text-primary text-muted-foreground"
                      }`}
                    >
                      <span className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isCurrent ? "bg-white/20 text-white" : "bg-muted/40 text-muted-foreground"
                      }`}>
                        {c.sequence}
                      </span>
                      <span className="truncate flex-1">{c.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border/10 text-center">
              <Button asChild variant="link" size="sm" className="text-xs">
                <Link href={`/stories/${story.slug}`}>Go back to outline details</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}