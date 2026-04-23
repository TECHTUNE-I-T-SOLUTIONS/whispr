"use client"

import { useEffect, useRef, useState } from "react"
import {
  ThumbsUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Send,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getVisitorToken } from "../visitor-token"

type Issue = {
  id: string
  title: string
  description: string
  category: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: string
  tags: string[]
  author_name: string | null
  reply_count: number
  upvote_count: number
  view_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

type Reply = {
  id: string
  issue_id: string
  content: string
  author_name: string | null
  is_admin: boolean
  is_solution: boolean
  created_at: string
}

const STATUS_META: Record<Issue["status"], { label: string; className: string }> = {
  open: { label: "Open", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  in_progress: {
    label: "In progress",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime()
  const s = Math.floor((Date.now() - d) / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function IssueClient({ initialIssue, initialReplies }: { initialIssue: Issue; initialReplies: Reply[] }) {
  const { toast } = useToast()
  const [issue, setIssue] = useState<Issue>(initialIssue)
  const [replies, setReplies] = useState<Reply[]>(initialReplies)
  const [upvoted, setUpvoted] = useState(false)
  const [voting, setVoting] = useState(false)
  const [reply, setReply] = useState({ content: "", author_name: "", author_email: "" })
  const [posting, setPosting] = useState(false)
  const tokenRef = useRef("")

  useEffect(() => {
    tokenRef.current = getVisitorToken()
    try {
      const stored = JSON.parse(window.localStorage.getItem("whispr-community-upvotes") || "{}")
      if (stored[issue.id]) setUpvoted(true)
    } catch {}
  }, [issue.id])

  async function toggleUpvote() {
    if (voting) return
    setVoting(true)
    try {
      const res = await fetch(`/api/community/issues/${issue.id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voter_token: tokenRef.current }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not vote")
      setUpvoted(j.upvoted)
      setIssue((prev) => ({ ...prev, upvote_count: Math.max(0, prev.upvote_count + (j.upvoted ? 1 : -1)) }))
      try {
        const stored = JSON.parse(window.localStorage.getItem("whispr-community-upvotes") || "{}")
        if (j.upvoted) stored[issue.id] = true
        else delete stored[issue.id]
        window.localStorage.setItem("whispr-community-upvotes", JSON.stringify(stored))
      } catch {}
    } catch (e: any) {
      toast({ title: "Could not vote", description: e.message, variant: "destructive" })
    } finally {
      setVoting(false)
    }
  }

  async function postReply(e: React.FormEvent) {
    e.preventDefault()
    if (posting) return
    if (reply.content.trim().length < 2) {
      toast({ title: "Reply is too short", variant: "destructive" })
      return
    }
    setPosting(true)
    try {
      const res = await fetch(`/api/community/issues/${issue.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reply, author_token: tokenRef.current }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not post reply")
      setReplies((prev) => [...prev, j.reply])
      setIssue((prev) => ({ ...prev, reply_count: prev.reply_count + 1 }))
      setReply({ content: "", author_name: reply.author_name, author_email: reply.author_email })
      toast({ title: "Reply posted" })
    } catch (e: any) {
      toast({ title: "Could not post", description: e.message, variant: "destructive" })
    } finally {
      setPosting(false)
    }
  }

  const meta = STATUS_META[issue.status]

  return (
    <div className="mt-4 space-y-6">
      <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${meta.className}`}>
              {issue.status === "resolved" && <CheckCircle2 className="mr-1 h-3 w-3" />}
              {meta.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {issue.category}
            </Badge>
            {issue.is_pinned && (
              <Badge variant="outline" className="border-primary/40 text-[10px] uppercase tracking-wide text-primary">
                Pinned
              </Badge>
            )}
          </div>

          <h1 className="mt-3 font-serif text-2xl font-bold leading-tight sm:text-3xl">{issue.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo(issue.created_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> {issue.reply_count} replies
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> {issue.view_count} views
            </span>
            {issue.author_name && <span>by {issue.author_name}</span>}
          </div>

          <div className="prose prose-sm dark:prose-invert mt-5 max-w-none whitespace-pre-wrap text-foreground">
            {issue.description}
          </div>

          {issue.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {issue.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  #{t}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center gap-2">
            <Button
              size="sm"
              variant={upvoted ? "default" : "outline"}
              onClick={toggleUpvote}
              disabled={voting}
              className="gap-2"
            >
              {voting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
              {upvoted ? "Upvoted" : "Upvote"} · {issue.upvote_count}
            </Button>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </h2>
        {replies.length === 0 ? (
          <Card className="border-dashed bg-card/40 p-6 text-center text-sm text-muted-foreground">
            No replies yet — our team or another community member will respond soon.
          </Card>
        ) : (
          <ul className="space-y-3">
            {replies.map((r) => (
              <li key={r.id}>
                <ReplyCard reply={r} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {issue.status !== "closed" && (
        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur sm:p-6">
          <h3 className="text-base font-semibold">Add a reply</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            You don&apos;t need an account. If you&apos;re the original author, leaving the same name keeps your replies linked.
          </p>
          <form onSubmit={postReply} className="mt-4 space-y-3">
            <Textarea
              required
              minLength={2}
              rows={4}
              value={reply.content}
              onChange={(e) => setReply({ ...reply, content: e.target.value })}
              placeholder="Share more detail, suggest a fix, or thank the team…"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={reply.author_name}
                onChange={(e) => setReply({ ...reply, author_name: e.target.value })}
                placeholder="Your name (optional)"
              />
              <Input
                type="email"
                value={reply.author_email}
                onChange={(e) => setReply({ ...reply, author_email: e.target.value })}
                placeholder="Email (optional, never shown)"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={posting} className="gap-2">
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post reply
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

function ReplyCard({ reply }: { reply: Reply }) {
  return (
    <Card
      className={`p-4 sm:p-5 ${
        reply.is_admin
          ? "border-primary/30 bg-primary/5"
          : reply.is_solution
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border/60 bg-card/60"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-foreground">{reply.author_name || "Anonymous"}</span>
        {reply.is_admin && (
          <Badge variant="outline" className="gap-1 border-primary/40 text-[10px] uppercase tracking-wide text-primary">
            <ShieldCheck className="h-3 w-3" /> Whispr Team
          </Badge>
        )}
        {reply.is_solution && (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/40 text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="h-3 w-3" /> Solution
          </Badge>
        )}
        <span className="text-muted-foreground">· {timeAgo(reply.created_at)}</span>
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{reply.content}</div>
    </Card>
  )
}
