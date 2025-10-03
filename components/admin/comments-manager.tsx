"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Search, Filter, Check, X, Reply, Trash2, User, Calendar, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Comment {
  id: string
  post_id: string
  author_name: string
  author_email: string
  author_website?: string
  content: string
  status: "pending" | "approved" | "rejected" | "spam"
  admin_reply?: string
  created_at: string
  posts: {
    title: string
    type: string
  }
}

export function CommentsManager() {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchComments()
  }, [filter])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/admin/comments?status=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateCommentStatus = async (commentId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setComments(
          comments.map((comment) => (comment.id === commentId ? { ...comment, status: status as any } : comment)),
        )
        toast({
          variant: "success",
          title: "Comment updated",
          description: `Comment ${status} successfully.`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update comment status.",
      })
    }
  }

  const submitReply = async (commentId: string) => {
    if (!replyText.trim()) return

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_reply: replyText }),
      })

      if (response.ok) {
        setComments(
          comments.map((comment) => (comment.id === commentId ? { ...comment, admin_reply: replyText } : comment)),
        )
        setReplyingTo(null)
        setReplyText("")
        toast({
          variant: "success",
          title: "Reply added",
          description: "Your reply has been saved.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save reply.",
      })
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComments(comments.filter((comment) => comment.id !== commentId))
        toast({
          variant: "success",
          title: "Comment deleted",
          description: "The comment has been permanently deleted.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete comment.",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "spam":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredComments = comments.filter(
    (comment) =>
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.posts.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            Comments Management
          </h1>
          <p className="text-muted-foreground">Moderate and respond to reader comments</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Comments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {filteredComments.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No comments found</h3>
              <p className="text-muted-foreground">
                {filter === "all" ? "No comments have been submitted yet." : `No ${filter} comments found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map((comment, index) => (
            <Card
              key={comment.id}
              className="animate-slide-up border-0 bg-card/50 backdrop-blur"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{comment.author_name}</span>
                      </div>
                      <Badge className={getStatusColor(comment.status)}>{comment.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{comment.author_email}</span>
                      {comment.author_website && (
                        <Link
                          href={comment.author_website}
                          target="_blank"
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Website
                        </Link>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      On:{" "}
                      <Link href={`/${comment.posts.type}/${comment.post_id}`} className="text-primary hover:underline">
                        {comment.posts.title}
                      </Link>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{comment.content}</p>
                </div>

                {comment.admin_reply && (
                  <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Admin Reply</span>
                    </div>
                    <p className="text-sm">{comment.admin_reply}</p>
                  </div>
                )}

                {replyingTo === comment.id ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => submitReply(comment.id)}>
                        Save Reply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2">
                    {comment.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateCommentStatus(comment.id, "approved")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateCommentStatus(comment.id, "rejected")}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Reject
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateCommentStatus(comment.id, "spam")}>
                          Spam
                        </Button>
                      </>
                    )}

                    {comment.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => updateCommentStatus(comment.id, "rejected")}>
                        <X className="mr-1 h-3 w-3" />
                        Reject
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={() => setReplyingTo(comment.id)}>
                      <Reply className="mr-1 h-3 w-3" />
                      {comment.admin_reply ? "Edit Reply" : "Reply"}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteComment(comment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
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
