"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils"
import { MessageCircle, Send, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCommentCache } from "@/hooks/use-comment-cache"

interface Comment {
  id: string
  content: string
  author_name: string
  author_email: string
  created_at: string
  status: "pending" | "approved" | "rejected"
  admin_reply?: string | null
  author_website?: string | null
}


interface CommentsProps {
  postId: string
}

export function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    content: "",
    author_name: "",
    author_email: "",
  })
  const { toast } = useToast()
  const { cachedData, saveCommentData } = useCommentCache()

  // Auto-populate form with cached data when form is shown
  useEffect(() => {
    if (showForm && cachedData) {
      setFormData(prev => ({
        ...prev,
        author_name: cachedData.name,
        author_email: cachedData.email
      }))
    }
  }, [showForm, cachedData])

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?post_id=${postId}&status=approved`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.content.trim() || !formData.author_name.trim() || !formData.author_email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          post_id: postId,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Comment submitted! It will appear after approval.",
        })
        // Save comment data to cache
        saveCommentData({
          name: formData.author_name,
          email: formData.author_email
        })
        setFormData({ content: "", author_name: "", author_email: "" })
        setShowForm(false)
      } else {
        throw new Error("Failed to submit comment")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-4">
              <div className="rounded-full bg-muted h-10 w-10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-16 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </h3>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm">
          {showForm ? "Cancel" : "Add Comment"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h4 className="font-medium">Leave a Comment</h4>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Your name"
                  value={formData.author_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, author_name: e.target.value }))}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={formData.author_email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, author_email: e.target.value }))}
                  required
                />
              </div>
              <Textarea
                placeholder="Write your comment..."
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                rows={4}
                required
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Comment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6 space-y-4">
                {/* User Comment */}
                <div className="flex space-x-4">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{getInitials(comment.author_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{comment.author_name}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(comment.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>

                {/* Admin Reply */}
                {comment.admin_reply && (
                  <div className="ml-14 border-l-2 border-primary pl-4">
                    <p className="text-xs text-muted-foreground mb-1">Admin reply:</p>
                    <p className="text-sm text-primary">{comment.admin_reply}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
