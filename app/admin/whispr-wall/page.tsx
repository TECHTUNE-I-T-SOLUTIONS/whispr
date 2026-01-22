
"use client"

import { useEffect, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ChevronDown, ChevronUp } from "lucide-react"
import { saveAs } from "file-saver"

interface WallPost {
  id: string
  content: string
  created_at: string
  response: string | null
  updated_at?: string | null
}

interface WallComment {
  id: string
  wall_id: string
  content: string
  created_at: string
  admin_response?: string | null
  admin_response_updated_at?: string | null
}

export default function AdminWhisprWallPage() {
  const [posts, setPosts] = useState<WallPost[]>([])
  const [comments, setComments] = useState<Record<string, WallComment[]>>({})
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("")
  const [status, setStatus] = useState<"all" | "responded" | "unresponded">("all")
  const [page, setPage] = useState(1)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [sortByDate, setSortByDate] = useState<"newest" | "oldest">("newest")

  const POSTS_PER_PAGE = 10

  useEffect(() => {
    fetch("/api/admin/wall")
      .then((res) => res.json())
      .then(setPosts)
  }, [])

  useEffect(() => {
    posts.forEach((post) => {
      if (!comments[post.id]) {
        fetch(`/api/wall/comments?wall_id=${post.id}`)
          .then((res) => res.json())
          .then((data) => setComments((prev) => ({ ...prev, [post.id]: data })))
      }
    })
  }, [posts])

  const respondToPost = async (id: string, response: string) => {
    setLoading(true)
    const res = await fetch(`/api/admin/wall/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    })

    if (res.ok) {
      toast.success("Response saved")
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, response, updated_at: new Date().toISOString() } : p)))
    } else {
      toast.error("Failed to save response")
    }
    setLoading(false)
  }

  const respondToComment = async (commentId: string, admin_response: string) => {
    const res = await fetch(`/api/admin/wall/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_response }),
    })

    if (res.ok) {
      toast.success("Replied to comment")
      setComments((prev) => {
        const newComments = { ...prev }
        for (const wallId in newComments) {
          newComments[wallId] = newComments[wallId].map((c) =>
            c.id === commentId ? { ...c, admin_response, admin_response_updated_at: new Date().toISOString() } : c
          )
        }
        return newComments
      })
    } else {
      toast.error("Failed to reply to comment")
    }
  }

  const exportToCSV = () => {
    const header = ["Post ID", "Content", "Created At", "Response", "Edited At"]
    const rows = posts.map((p) => [
      p.id,
      p.content.replace(/\n/g, " "),
      new Date(p.created_at).toLocaleString(),
      p.response ?? "",
      p.updated_at ? new Date(p.updated_at).toLocaleString() : ""
    ])
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, "whispr_wall_export.csv")
  }

  const filteredPosts = posts
    .filter((post) => {
      const matchesFilter = post.content.toLowerCase().includes(filter.toLowerCase()) || (post.response?.toLowerCase().includes(filter.toLowerCase()) ?? false)
      const matchesStatus =
        status === "all" ||
        (status === "responded" && post.response) ||
        (status === "unresponded" && !post.response)
      return matchesFilter && matchesStatus
    })
    .sort((a, b) => sortByDate === "newest"
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  const totalPages = Math.ceil(
    posts.filter((post) => {
      const matchesFilter = post.content.toLowerCase().includes(filter.toLowerCase()) || (post.response?.toLowerCase().includes(filter.toLowerCase()) ?? false)
      const matchesStatus =
        status === "all" ||
        (status === "responded" && post.response) ||
        (status === "unresponded" && !post.response)
      return matchesFilter && matchesStatus
    }).length / POSTS_PER_PAGE
  )

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }))
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6 px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-md font-bold mb-4 font-serif">🧱 Whispr Wall — Admin</h1>
        <Button variant="outline" size="sm" onClick={exportToCSV}>Export CSV</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <Input
          placeholder="Search content or response..."
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1) }}
          className="w-full md:max-w-sm"
        />

        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as any); setPage(1) }}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="responded">Responded</option>
            <option value="unresponded">Unresponded</option>
          </select>

          <select
            value={sortByDate}
            onChange={(e) => setSortByDate(e.target.value as any)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <p className="text-muted-foreground">No wall posts found.</p>
      ) : (
        filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium whitespace-pre-line">{post.content}</p>
                <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</span>
              </div>

              <Textarea
                placeholder="Write or edit response..."
                defaultValue={post.response || ""}
                onBlur={(e) => respondToPost(post.id, e.target.value)}
                disabled={loading}
                className="text-xs"
              />
              {post.updated_at && (
                <span className="text-[10px] text-muted-foreground block">Edited: {new Date(post.updated_at).toLocaleString()}</span>
              )}

              {comments[post.id] && comments[post.id].length > 0 && (
                <div className="pt-2 space-y-2 border-t mt-4">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                  >
                    {expandedComments[post.id] ? <><ChevronUp className="w-4 h-4" /> Hide Comments</> : <><ChevronDown className="w-4 h-4" /> Show Comments ({comments[post.id].length})</>}
                  </button>

                  {expandedComments[post.id] && comments[post.id].map((c) => (
                    <div key={c.id} className="text-sm bg-muted px-3 py-2 rounded-md space-y-1">
                      <p className="whitespace-pre-line">{c.content}</p>
                      <span className="block text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>

                      <Textarea
                        placeholder="Admin reply to comment..."
                        defaultValue={c.admin_response || ""}
                        onBlur={(e) => respondToComment(c.id, e.target.value)}
                        className="mt-2 text-xs"
                      />
                      {c.admin_response_updated_at && (
                        <span className="block text-[10px] text-muted-foreground">Edited: {new Date(c.admin_response_updated_at).toLocaleString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
