"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Heart, BookOpen, MessageSquare, Share2, Calendar, Eye, Send, Play, Copy, Twitter, Mail, HelpCircle } from "lucide-react"

interface StoryClientPageProps {
  story: any
  chapters: any[]
}

export default function StoryClientPage({ story, chapters }: StoryClientPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseBrowser()

  const [user, setUser] = useState<any>(null)
  const [profileName, setProfileName] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(story.likes_count || 0)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [commenterName, setCommenterName] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [loadingLikes, setLoadingLikes] = useState(true)

  const currentUrl = typeof window !== "undefined" ? window.location.href : ""

  useEffect(() => {
    // 1. Fetch user session
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        // Fetch creator details or standard name
        const { data: creator } = await supabase
          .from("chronicles_creators")
          .select("pen_name, display_name")
          .eq("user_id", user.id)
          .single()

        const name = creator ? (creator.display_name || creator.pen_name) : (user.user_metadata?.full_name || user.email?.split("@")[0] || "Creative Reader")
        setCommenterName(name)
        setProfileName(name)

        // Check if liked
        const res = await fetch(`/api/stories/like?storyId=${story.id}&authorType=${story.author_type}`)
        if (res.ok) {
          const data = await res.json()
          setIsLiked(data.isLiked)
        }
      }
      setLoadingLikes(false)
    }

    checkUser()
    fetchComments()
  }, [story.id])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/stories/comment?storyId=${story.id}&authorType=${story.author_type}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error("Comments fetch error:", err)
    }
  }

  // Liking action with optimistic update
  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like this story and join the community!",
        variant: "destructive",
      })
      return
    }

    // Optimistic toggle
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikesCount((prev: number) => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)))

    try {
      const res = await fetch("/api/stories/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id, authorType: story.author_type }),
      })

      if (!res.ok) {
        // Rollback on error
        setIsLiked(!newIsLiked)
        setLikesCount((prev: number) => (!newIsLiked ? prev + 1 : Math.max(0, prev - 1)))
        const data = await res.json()
        throw new Error(data.error || "Failed to save reaction")
      }
      
      toast({
        title: newIsLiked ? "Story Liked! ❤️" : "Reaction removed",
        description: newIsLiked ? `You liked "${story.title}".` : `Unliked "${story.title}".`,
      })
    } catch (err: any) {
      toast({
        title: "Reaction Error",
        description: err.message || "Failed to update like status",
        variant: "destructive",
      })
    }
  }

  // Comments submit
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit comments on this story.",
        variant: "destructive",
      })
      return
    }

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
      const res = await fetch("/api/stories/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.id,
          authorType: story.author_type,
          content: newComment.trim(),
          commenterName: commenterName.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment")
      }

      toast({
        title: "Comment published",
        description: "Your thought has been successfully recorded!",
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

  // Sharing utils
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(currentUrl)
    toast({
      title: "Link Copied!",
      description: "Story URL copied to your clipboard.",
    })
    logShare("link")
  }

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(`Check out "${story.title}" on Whispr!`)}`, "_blank")
    logShare("twitter")
  }

  const logShare = async (platform: string) => {
    await fetch("/api/stories/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: story.id, sharedTo: platform, authorType: story.author_type }),
    }).catch(() => {})
  }

  return (
    <div className="whispr-gradient min-h-screen pb-12 pt-6">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link href="/stories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Stories
          </Link>
        </div>

        {/* Outline Card */}
        <Card className="border-0 bg-card/45 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden mb-8">
          <div className="relative h-64 md:h-80 w-full overflow-hidden bg-muted/20 border-b border-border/20">
            {story.cover_image_url ? (
              <Image src={story.cover_image_url} alt={story.title} fill className="object-cover" priority />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-purple-950/40 to-pink-900/40 flex items-center justify-center">
                <BookOpen className="h-24 w-24 text-white/10" />
              </div>
            )}
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 font-semibold uppercase tracking-wider">
              🎭 {story.genre}
            </Badge>
          </div>

          <CardHeader className="p-6 md:p-8 pb-4">
            <h1 className="font-serif text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent mb-4 leading-tight">
              {story.title}
            </h1>

            {/* Author Profile Card */}
            <div className="flex flex-wrap items-center gap-4 py-3 border-y border-border/20">
              <div className="flex items-center gap-3">
                {story.author_avatar ? (
                  <img
                    src={story.author_avatar}
                    alt={story.author_name}
                    className="h-10 w-10 rounded-full object-cover border border-white/20 shadow-md"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-sm text-white font-bold shadow-md">
                    {story.author_name?.charAt(0).toUpperCase() || "W"}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-foreground">@{story.author_username}</h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {story.author_name} • {story.author_type === "admin" ? "Whispr Staff" : "Platform Creator"}
                  </p>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {story.published_at
                    ? new Date(story.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Recently"}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {story.views_count || 0} views
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 pt-0">
            {/* Description Excerpt */}
            <p className="text-muted-foreground text-base leading-relaxed mb-6 font-serif">
              {story.description || story.excerpt || "Enter this beautiful saga and begin reading."}
            </p>

            {/* Hashtags display */}
            {story.hashtags && story.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {story.hashtags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Interaction Row */}
            <div className="flex flex-wrap items-center gap-3 py-4 border-t border-border/20">
              <Button
                variant={isLiked ? "default" : "outline"}
                onClick={handleLike}
                disabled={loadingLikes}
                className={`rounded-full flex items-center gap-2 px-6 transition-all duration-300 ${
                  isLiked ? "bg-pink-600 hover:bg-pink-700 text-white ring-2 ring-pink-500/50" : "hover:text-pink-500 hover:border-pink-500"
                }`}
              >
                <Heart className={`h-4.5 w-4.5 ${isLiked ? "fill-white" : ""}`} />
                <span>{likesCount} Likes</span>
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                <Button size="icon" variant="outline" className="rounded-full hover:bg-blue-600/10 hover:text-blue-500 hover:border-blue-500" onClick={handleShareTwitter}>
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="rounded-full hover:bg-primary/10 hover:text-primary" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chapters Section */}
        <Card className="border-0 bg-card/45 backdrop-blur-md shadow-xl rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-6">
            <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Table of Chapters
            </h3>
            <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs">
              {chapters.length} Chapters Published
            </Badge>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No chapters have been published for this story yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chap, idx) => (
                <Link
                  key={chap.id}
                  href={`/stories/${story.slug}/${chap.slug}`}
                  className="group block p-4 bg-muted/20 hover:bg-primary/10 rounded-xl border border-border/10 hover:border-primary/20 transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-background/80 flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      {chap.sequence}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold group-hover:text-primary transition-colors">
                        {chap.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {Math.ceil(chap.content.split(" ").length / 200)} min read
                      </p>
                    </div>
                  </div>
                  <Play className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all translate-x-2 group-hover:translate-x-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Comments Section */}
        <Card className="border-0 bg-card/45 backdrop-blur-md shadow-xl rounded-2xl p-6 md:p-8">
          <h3 className="font-serif text-2xl font-bold flex items-center gap-2 border-b border-border/20 pb-4 mb-6">
            <MessageSquare className="h-5 w-5 text-primary" />
            Reader Thoughts ({comments.length})
          </h3>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="space-y-4 mb-8 bg-muted/10 p-4 rounded-xl border border-border/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-1 block">Commenter Pen Name</label>
                  <Input
                    value={commenterName}
                    onChange={(e) => setCommenterName(e.target.value)}
                    placeholder="Enter your name..."
                    required
                    className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">Your Thought</label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share what you think about this story outline..."
                  required
                  rows={4}
                  className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif"
                />
              </div>
              <Button type="submit" disabled={submittingComment} className="rounded-lg flex items-center gap-2">
                {submittingComment ? "Publishing..." : "Post Comment"}
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="bg-muted/15 border border-dashed border-border/40 p-6 rounded-xl text-center mb-8">
              <p className="text-muted-foreground text-sm mb-3">You must be logged in to leave a comment.</p>
              <Button asChild size="sm">
                <Link href="/login">Log In to Comment</Link>
              </Button>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No thoughts posted yet. Be the first to share your comment!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comm) => (
                <div key={comm.id} className="p-4 bg-muted/10 rounded-xl border border-border/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">@{comm.commenter_name}</span>
                    <span>•</span>
                    <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-serif">{comm.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
