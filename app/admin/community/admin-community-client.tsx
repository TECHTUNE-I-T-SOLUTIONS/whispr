"use client"

import { useMemo, useState } from "react"
import {
  Search,
  Loader2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Pin,
  PinOff,
  Send,
  RefreshCw,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type Issue = {
  id: string
  title: string
  description: string
  category: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: string
  tags: string[]
  author_name: string | null
  author_email: string | null
  reply_count: number
  upvote_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

type Reply = {
  id: string
  content: string
  author_name: string | null
  is_admin: boolean
  is_solution: boolean
  created_at: string
}

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function AdminCommunityClient({ initialIssues }: { initialIssues: Issue[] }) {
  const { toast } = useToast()
  const [issues, setIssues] = useState<Issue[]>(initialIssues)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selected, setSelected] = useState<Issue | null>(initialIssues[0] || null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [reply, setReply] = useState("")
  const [markSolution, setMarkSolution] = useState(false)
  const [posting, setPosting] = useState(false)
  const [updating, setUpdating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return issues.filter((it) => {
      if (statusFilter !== "all" && it.status !== statusFilter) return false
      if (!q) return true
      return (
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        (it.author_name || "").toLowerCase().includes(q) ||
        (it.author_email || "").toLowerCase().includes(q)
      )
    })
  }, [issues, query, statusFilter])

  async function loadReplies(issue: Issue) {
    setSelected(issue)
    setLoadingReplies(true)
    try {
      const res = await fetch(`/api/community/issues/${issue.id}`)
      const j = await res.json()
      if (j.ok) setReplies(j.replies || [])
    } finally {
      setLoadingReplies(false)
    }
  }

  async function refreshOne(id: string) {
    const res = await fetch(`/api/community/issues/${id}`)
    const j = await res.json()
    if (j.ok) {
      setIssues((prev) => prev.map((p) => (p.id === id ? j.issue : p)))
      if (selected?.id === id) setSelected(j.issue)
      setReplies(j.replies || [])
    }
  }

  async function patch(id: string, body: any) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/community/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "Update failed")
      setIssues((prev) => prev.map((p) => (p.id === id ? j.issue : p)))
      if (selected?.id === id) setSelected(j.issue)
      toast({ title: "Updated" })
    } catch (e: any) {
      toast({ title: "Could not update", description: e.message, variant: "destructive" })
    } finally {
      setUpdating(false)
    }
  }

  async function postReply(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || posting) return
    if (reply.trim().length < 2) return
    setPosting(true)
    try {
      const res = await fetch(`/api/community/issues/${selected.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply, is_solution: markSolution }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not post")
      setReplies((prev) => [...prev, j.reply])
      setReply("")
      setMarkSolution(false)
      await refreshOne(selected.id)
      toast({ title: "Reply sent" })
    } catch (e: any) {
      toast({ title: "Could not post", description: e.message, variant: "destructive" })
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* Left: list */}
      <div className="space-y-3">
        <Card className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, body, author…"
              className="h-9 pl-9"
            />
          </div>
          <div className="mt-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="max-h-[70vh] overflow-y-auto p-2">
          {filtered.length === 0 && <div className="p-4 text-sm text-muted-foreground">No matching issues.</div>}
          <ul className="space-y-1">
            {filtered.map((it) => (
              <li key={it.id}>
                <button
                  onClick={() => loadReplies(it)}
                  className={`w-full rounded-md p-3 text-left text-sm transition hover:bg-accent ${
                    selected?.id === it.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${
                        it.status === "open"
                          ? "bg-amber-500"
                          : it.status === "in_progress"
                            ? "bg-blue-500"
                            : it.status === "resolved"
                              ? "bg-emerald-500"
                              : "bg-muted-foreground"
                      }`}
                    />
                    <span className="line-clamp-1 flex-1 font-medium">{it.title}</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {it.author_name || "Anonymous"} · {timeAgo(it.created_at)} · {it.reply_count} replies ·{" "}
                    {it.upvote_count} upvotes
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Right: detail */}
      <div>
        {!selected ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">Select an issue to manage it.</Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="border-b p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-lg font-semibold">{selected.title}</h2>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selected.author_name || "Anonymous"}
                    {selected.author_email && (
                      <>
                        {" · "}
                        <a className="underline" href={`mailto:${selected.author_email}`}>
                          {selected.author_email}
                        </a>
                      </>
                    )}{" "}
                    · {timeAgo(selected.created_at)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refreshOne(selected.id)} className="gap-1">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Select
                  value={selected.status}
                  onValueChange={(v) => patch(selected.id, { status: v })}
                  disabled={updating}
                >
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selected.priority}
                  onValueChange={(v) => patch(selected.id, { priority: v })}
                  disabled={updating}
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["low", "normal", "high", "urgent"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={updating}
                  onClick={() => patch(selected.id, { is_pinned: !selected.is_pinned })}
                >
                  {selected.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  {selected.is_pinned ? "Unpin" : "Pin"}
                </Button>
                <Badge variant="outline">{selected.category}</Badge>
                <Badge variant="outline">{selected.upvote_count} upvotes</Badge>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">
                {selected.description}
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Replies ({replies.length})
                </h3>
                {loadingReplies ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : replies.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No replies yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {replies.map((r) => (
                      <li
                        key={r.id}
                        className={`rounded-md border p-3 text-sm ${
                          r.is_admin
                            ? "border-primary/30 bg-primary/5"
                            : r.is_solution
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "bg-background"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-medium">{r.author_name || "Anonymous"}</span>
                          {r.is_admin && (
                            <Badge
                              variant="outline"
                              className="gap-1 border-primary/40 text-[10px] uppercase text-primary"
                            >
                              <ShieldCheck className="h-3 w-3" /> Admin
                            </Badge>
                          )}
                          {r.is_solution && (
                            <Badge
                              variant="outline"
                              className="gap-1 border-emerald-500/40 text-[10px] uppercase text-emerald-600 dark:text-emerald-400"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Solution
                            </Badge>
                          )}
                          <span className="text-muted-foreground">· {timeAgo(r.created_at)}</span>
                        </div>
                        <div className="mt-2 whitespace-pre-wrap">{r.content}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form onSubmit={postReply} className="space-y-2 border-t pt-4">
                <Textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply as Whispr Team…"
                  required
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={markSolution}
                      onChange={(e) => setMarkSolution(e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    Mark as solution & resolve
                  </label>
                  <Button type="submit" disabled={posting} className="gap-2">
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send reply
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
