"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { wallHero as WallHeroComponent } from "@/components/wall-hero"


export default function WhisprWallPage() {
  const [message, setMessage] = useState("")
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [commentPages, setCommentPages] = useState<Record<string, number>>({})
  const COMMENTS_PER_PAGE = 3

  useEffect(() => {
    fetch("/api/wall")
      .then((res) => res.json())
      .then(async (postsData) => {
        const postsWithDetails = await Promise.all(
          postsData.map(async (post: any) => {
            const [commentsRes, reactionsRes] = await Promise.all([
              fetch(`/api/wall/comments?wall_id=${post.id}&limit=${COMMENTS_PER_PAGE}`),
              fetch(`/api/wall/reactions?wall_id=${post.id}`),
            ])

            const comments = await commentsRes.json()
            const reactionData = await reactionsRes.json()

            return {
              ...post,
              comments,
              reaction_count: reactionData?.count || 0,
              reacted: reactionData?.reacted || false,
            }
          })
        )

        setPosts(postsWithDetails)
      })

  }, [])

  const loadMoreComments = async (postId: string) => {
    const nextPage = (commentPages[postId] || 1) + 1
    const res = await fetch(`/api/wall/comments?wall_id=${postId}&limit=${COMMENTS_PER_PAGE}&page=${nextPage}`)
    const newComments = await res.json()
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, comments: [...p.comments, ...newComments] } : p)
    )
    setCommentPages((prev) => ({ ...prev, [postId]: nextPage }))
  }

  const submitPost = async () => {
    if (!message.trim()) return toast.error("Message cannot be empty")
    setLoading(true)
    const res = await fetch("/api/wall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    })
    const data = await res.json()
    if (res.ok) {
      setPosts([{ ...data, comments: [] }, ...posts])
      setMessage("")
      toast.success("Posted anonymously")
    } else {
      toast.error(data?.error || "Failed to post")
    }
    setLoading(false)
  }

  const submitComment = async (postId: string) => {
    const comment = commentInputs[postId]?.trim()
    if (!comment) return toast.error("Comment cannot be empty")

    const res = await fetch("/api/wall/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wall_id: postId, content: comment }),
    })

    if (res.ok) {
      const newComment = await res.json()
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p
        )
      )
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }))
      toast.success("Comment added")
    } else {
      const err = await res.json()
      toast.error(err?.error || "Failed to comment")
    }
  }

  const toggleReaction = async (postId: string) => {
    const res = await fetch(`/api/wall/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wall_id: postId }),
    })
    const data = await res.json()
    if (!res.ok) return toast.error(data?.error || "Failed to react")
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, reacted: data.reacted, reaction_count: data.reaction_count } : p
      )
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6 px-4">
      <WallHeroComponent />
      
      <h1 className="text-3xl font-bold text-center font-serif">🧱 Whispr Wall</h1>
      <p className="text-center text-muted-foreground">
        Say something anonymously. Ask, vent, or request a poem — no account needed.
      </p>

      <div className="space-y-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="What's on your mind?"
        />
        <Button onClick={submitPost} disabled={loading} className="w-full">
          {loading ? "Posting..." : "Post Anonymously"}
        </Button>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-foreground whitespace-pre-line">{post.content}</p>

              {post.response && (
                <div className="bg-primary/10 border-l-4 border-primary p-3 rounded-md text-sm text-primary">
                  <strong className="block mb-1">Prayce's Reply</strong>
                  <p>{post.response}</p>
                  {post.updated_at && (
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Replied: {new Date(post.updated_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Comments</h4>
                {post.comments?.map((c: any) => (
                  <div key={c.id} className="text-sm bg-muted/30 p-2 rounded space-y-1">
                    <p>{c.content}</p>
                    <span className="block text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>

                    {c.admin_response && (
                      <div className="mt-2 bg-primary/10 text-primary p-2 rounded text-xs">
                        <strong className="block mb-1">Prayce's Reply</strong>
                        <p>{c.admin_response}</p>
                        {c.admin_response_updated_at && (
                          <span className="text-[10px] text-muted-foreground block mt-1">
                            Replied: {new Date(c.admin_response_updated_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <Button variant="ghost" size="sm" onClick={() => loadMoreComments(post.id)}>
                  Load more comments
                </Button>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    rows={2}
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    onClick={() => submitComment(post.id)}
                    className="ml-auto block"
                  >
                    Comment
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleReaction(post.id)}
                >
                  {post.reacted ? `❤️ ${post.reaction_count}` : `🤍 ${post.reaction_count || 0}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
