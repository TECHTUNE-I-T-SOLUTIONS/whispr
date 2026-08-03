"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Search,
  Plus,
  ThumbsUp,
  Loader2,
  Sparkles,
  Tag,
  Clock,
  X,
  Lightbulb,
  Rocket,
} from "lucide-react"
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
import { getVisitorToken } from "../community/visitor-token"

type FeatureRequest = {
  id: string
  title: string
  description: string
  category: string
  status: "open" | "under_review" | "planned" | "in_progress" | "shipped" | "declined"
  tags: string[]
  author_name: string | null
  upvote_count: number
  is_pinned: boolean
  admin_note: string | null
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: "feature", label: "New feature" },
  { value: "improvement", label: "Improvement" },
  { value: "integration", label: "Integration" },
  { value: "ui_ux", label: "Design / UX" },
  { value: "content", label: "Content idea" },
  { value: "suggestion", label: "Suggestion" },
  { value: "other", label: "Other" },
]

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]))

const STATUS_META: Record<
  FeatureRequest["status"],
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  under_review: {
    label: "Under review",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  planned: {
    label: "Planned",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
  },
  in_progress: {
    label: "In progress",
    className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  },
  shipped: {
    label: "Shipped",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  declined: { label: "Not planned", className: "bg-muted text-muted-foreground border-border" },
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

export function FeatureRequestsClient() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [sort, setSort] = useState<string>("popular")
  const [composerOpen, setComposerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [votes, setVotes] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "feature",
    author_name: "",
    author_email: "",
    tags: "",
  })
  const tokenRef = useRef<string>("")

  useEffect(() => {
    tokenRef.current = getVisitorToken()
    try {
      const raw = window.localStorage.getItem("whispr-feature-votes")
      if (raw) setVotes(JSON.parse(raw))
    } catch {}
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
    fetch(`/api/feature-requests?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (j.ok) setRequests(j.requests)
        else toast({ title: "Could not load requests", description: j.error, variant: "destructive" })
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Network error", variant: "destructive" })
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debounced, statusFilter, categoryFilter, sort, toast])

  const hasResults = requests.length > 0
  const showSuggestionsHint = useMemo(() => debounced.length > 0 && hasResults, [debounced, hasResults])

  function persistVotes(next: Record<string, boolean>) {
    setVotes(next)
    try {
      window.localStorage.setItem("whispr-feature-votes", JSON.stringify(next))
    } catch {}
  }

  async function toggleUpvote(id: string) {
    const currentlyVoted = !!votes[id]
    // optimistic update
    persistVotes({ ...votes, [id]: !currentlyVoted })
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, upvote_count: Math.max(0, r.upvote_count + (currentlyVoted ? -1 : 1)) } : r,
      ),
    )
    try {
      const res = await fetch(`/api/feature-requests/${id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voter_token: tokenRef.current }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "Vote failed")
      // reconcile with server truth
      persistVotes({ ...votes, [id]: j.upvoted })
    } catch (err: any) {
      // rollback
      persistVotes({ ...votes, [id]: currentlyVoted })
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, upvote_count: Math.max(0, r.upvote_count + (currentlyVoted ? 1 : -1)) } : r,
        ),
      )
      toast({ title: "Could not register vote", description: err.message, variant: "destructive" })
    }
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/feature-requests", {
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
      toast({ title: "Thanks for the idea!", description: "Our team will review your request." })
      setComposerOpen(false)
      setForm({ title: "", description: "", category: "feature", author_name: "", author_email: "", tags: "" })
      setRequests((prev) => [j.request, ...prev])
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
              placeholder="Search ideas and suggestions…"
              className="h-11 pl-9 pr-9 text-sm"
              aria-label="Search feature requests"
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
            <Plus className="h-4 w-4" /> Request feature
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 sm:w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="under_review">Under review</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="declined">Not planned</SelectItem>
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
            <SelectTrigger className="h-9 col-span-2 sm:col-span-1 sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most upvoted</SelectItem>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="active">Recently active</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showSuggestionsHint && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span>
              Found {requests.length} similar {requests.length === 1 ? "idea" : "ideas"} — upvote instead of creating a
              duplicate.
            </span>
          </div>
        )}
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !hasResults ? (
        <EmptyState query={debounced} onCreate={() => setComposerOpen(true)} />
      ) : (
        <ul className="space-y-3">
          {requests.map((it) => (
            <li key={it.id}>
              <RequestRow request={it} voted={!!votes[it.id]} onUpvote={() => toggleUpvote(it.id)} />
            </li>
          ))}
        </ul>
      )}

      {/* Composer dialog */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Request a feature</DialogTitle>
            <DialogDescription>
              Describe what you'd like to see and why it matters. The clearer the idea, the more likely it gets built.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRequest} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                required
                minLength={5}
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. ‘Dark mode for the reading view’"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Describe your idea</label>
              <Textarea
                required
                minLength={10}
                rows={6}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What should it do? Who benefits? What problem does it solve?"
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
                <label className="text-sm font-medium">
                  Tags <span className="text-muted-foreground">(optional)</span>
                </label>
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
                Submit request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RequestRow({
  request,
  voted,
  onUpvote,
}: {
  request: FeatureRequest
  voted: boolean
  onUpvote: () => void
}) {
  const meta = STATUS_META[request.status]
  return (
    <div className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition hover:border-primary/40 hover:bg-card sm:gap-4 sm:p-5">
      {/* Upvote pill */}
      <button
        type="button"
        onClick={onUpvote}
        aria-pressed={voted}
        aria-label={voted ? "Remove upvote" : "Upvote this idea"}
        className={`flex flex-shrink-0 flex-col items-center justify-center rounded-lg border px-3 py-2 text-xs transition ${
          voted
            ? "border-primary bg-primary/10 text-primary"
            : "border-border/60 bg-background/80 text-muted-foreground hover:border-primary/40 hover:text-primary"
        }`}
      >
        <ThumbsUp className={`h-4 w-4 ${voted ? "fill-primary/20" : ""}`} />
        <span className="mt-1 font-semibold text-foreground">{request.upvote_count}</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${meta.className}`}>
            {meta.label}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {CATEGORY_LABEL[request.category] || request.category}
          </Badge>
          {request.is_pinned && (
            <Badge variant="outline" className="border-primary/40 text-[10px] uppercase tracking-wide text-primary">
              Pinned
            </Badge>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-foreground sm:text-lg">
          {request.title}
        </h3>
        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{request.description}</p>

        {request.admin_note && (
          <div className="mt-2 flex items-start gap-1.5 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs text-foreground">
            <Rocket className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span>
              <span className="font-medium">Whispr team:</span> {request.admin_note}
            </span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(request.created_at)}
          </span>
          {request.author_name && <span className="truncate">by {request.author_name}</span>}
          {request.tags?.length > 0 && (
            <span className="inline-flex items-center gap-1 truncate">
              <Tag className="h-3 w-3" />
              {request.tags.slice(0, 3).join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ query, onCreate }: { query: string; onCreate: () => void }) {
  return (
    <Card className="border-dashed bg-card/40 p-8 text-center sm:p-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lightbulb className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {query ? "No matching ideas found" : "No requests yet — be the first"}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {query
          ? "Nobody has suggested this yet. Share your idea and the community can vote on it."
          : "Got an idea that would make Whispr better? Be the first to suggest it."}
      </p>
      <Button className="mt-5 gap-2" onClick={onCreate}>
        <Plus className="h-4 w-4" /> Request a feature
      </Button>
    </Card>
  )
}
