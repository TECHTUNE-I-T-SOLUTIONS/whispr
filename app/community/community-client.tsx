"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Search, Plus, MessageSquare, ThumbsUp, Loader2, Sparkles, Tag, Clock, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getVisitorToken } from "./visitor-token"

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

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "bug", label: "Bug / Glitch" },
  { value: "account", label: "Account" },
  { value: "content", label: "Content" },
  { value: "complaint", label: "Complaint" },
  { value: "suggestion", label: "Suggestion" },
  { value: "feature", label: "Feature Request" },
  { value: "other", label: "Other" },
]

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
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function CommunityClient() {
  const { toast } = useToast()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [sort, setSort] = useState<string>("recent")
  const [composerOpen, setComposerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    author_name: "",
    author_email: "",
    tags: "",
  })
  const tokenRef = useRef<string>("")

  useEffect(() => {
    tokenRef.current = getVisitorToken()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (debounced) params.set("q", debounced)
    if (statusFilter) params.set("status", statusFilter)
    if (categoryFilter) params.set("category", categoryFilter)
    if (sort) params.set("sort", sort)
    fetch(`/api/community/issues?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (j.ok) setIssues(j.issues)
        else toast({ title: "Could not load issues", description: j.error, variant: "destructive" })
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Network error", variant: "destructive" })
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debounced, statusFilter, categoryFilter, sort, toast])

  const hasResults = issues.length > 0
  const showSuggestionsHint = useMemo(() => debounced.length > 0 && hasResults, [debounced, hasResults])

  async function submitIssue(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/community/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          author_name: form.author_name,
          author_email: form.author_email,
          author_token: tokenRef.current,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not submit")
      toast({ title: "Submitted", description: "Our team has been notified." })
      setComposerOpen(false)
      setForm({ title: "", description: "", category: "general", author_name: "", author_email: "", tags: "" })
      setIssues((prev) => [j.issue, ...prev])
    } catch (err: any) {
      toast({ title: "Could not submit", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search + actions */}
      <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search issues, complaints, solutions…"
              className="h-11 pl-9 pr-9 text-sm"
              aria-label="Search community"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={() => setComposerOpen(true)} className="h-11 gap-2 sm:w-auto">
            <Plus className="h-4 w-4" /> New issue
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 sm:w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 sm:w-[170px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 col-span-2 sm:col-span-1 sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="active">Recently active</SelectItem>
              <SelectItem value="popular">Most upvoted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showSuggestionsHint && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span>
              Found {issues.length} similar {issues.length === 1 ? "issue" : "issues"} — please check below before
              creating a new one.
            </span>
          </div>
        )}
      </Card>

      {/* Issue list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !hasResults ? (
        <EmptyState query={debounced} onCreate={() => setComposerOpen(true)} />
      ) : (
        <ul className="space-y-3">
          {issues.map((it) => (
            <li key={it.id}>
              <IssueRow issue={it} />
            </li>
          ))}
        </ul>
      )}

      {/* Composer dialog */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Lodge a new issue</DialogTitle>
            <DialogDescription>
              Tell us what happened. The clearer the detail, the faster we can resolve it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitIssue} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                required
                minLength={5}
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short summary, e.g. ‘Cannot log in with Google’"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                required
                minLength={10}
                rows={6}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What happened? What did you expect? Steps to reproduce help us a lot."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tags <span className="text-muted-foreground">(optional)</span></label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="comma, separated, tags"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Your name <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  value={form.author_name}
                  onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                  placeholder="Anonymous"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Email <span className="text-muted-foreground">(optional, never shown)</span>
                </label>
                <Input
                  type="email"
                  value={form.author_email}
                  onChange={(e) => setForm({ ...form, author_email: e.target.value })}
                  placeholder="for follow-ups only"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setComposerOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit issue
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function IssueRow({ issue }: { issue: Issue }) {
  const meta = STATUS_META[issue.status]
  return (
    <Link
      href={`/community/${issue.id}`}
      className="group block rounded-xl border border-border/60 bg-card/60 p-4 transition hover:border-primary/40 hover:bg-card sm:p-5"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="hidden flex-shrink-0 flex-col items-center justify-center rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground sm:flex">
          <ThumbsUp className="h-4 w-4" />
          <span className="mt-1 font-semibold text-foreground">{issue.upvote_count}</span>
        </div>
        <div className="min-w-0 flex-1">
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
          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-foreground transition group-hover:text-primary sm:text-lg">
            {issue.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{issue.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(issue.created_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {issue.reply_count} {issue.reply_count === 1 ? "reply" : "replies"}
            </span>
            <span className="inline-flex items-center gap-1 sm:hidden">
              <ThumbsUp className="h-3 w-3" />
              {issue.upvote_count}
            </span>
            {issue.author_name && <span className="truncate">by {issue.author_name}</span>}
            {issue.tags?.length > 0 && (
              <span className="inline-flex items-center gap-1 truncate">
                <Tag className="h-3 w-3" />
                {issue.tags.slice(0, 3).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ query, onCreate }: { query: string; onCreate: () => void }) {
  return (
    <Card className="border-dashed bg-card/40 p-8 text-center sm:p-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {query ? "No matching issues found" : "No issues yet — be the first"}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {query
          ? "Looks like nobody has reported this yet. Lodge a new issue and our team will reply."
          : "When someone raises an issue, it will show up here."}
      </p>
      <Button className="mt-5 gap-2" onClick={onCreate}>
        <Plus className="h-4 w-4" /> Create new issue
      </Button>
    </Card>
  )
}
