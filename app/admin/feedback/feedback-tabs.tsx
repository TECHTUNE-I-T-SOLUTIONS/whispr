"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ThumbsUp, Loader2, Pin, Trash2, Tag } from "lucide-react"

type Feedback = {
  id: string
  message: string
  page_url: string | null
  user_agent: string | null
  name: string | null
  email: string | null
  created_at: string
}

type FeatureRequest = {
  id: string
  title: string
  description: string
  category: string
  status: string
  tags: string[]
  author_name: string | null
  author_email: string | null
  upvote_count: number
  is_pinned: boolean
  admin_note: string | null
  created_at: string
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under review" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "shipped", label: "Shipped" },
  { value: "declined", label: "Not planned" },
]

const STATUS_CLASS: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  under_review: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  planned: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  in_progress: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  shipped: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  declined: "bg-muted text-muted-foreground border-border",
}

export function AdminFeedbackTabs({
  feedback,
  featureRequests,
}: {
  feedback: Feedback[]
  featureRequests: FeatureRequest[]
}) {
  const [requests, setRequests] = useState<FeatureRequest[]>(featureRequests)

  return (
    <Tabs defaultValue="requests" className="w-full">
      <TabsList>
        <TabsTrigger value="requests" className="gap-2">
          Feature requests
          <Badge variant="secondary" className="ml-1">{requests.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="feedback" className="gap-2">
          Feedback
          <Badge variant="secondary" className="ml-1">{feedback.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="requests" className="mt-4">
        {requests.length === 0 ? (
          <div className="text-sm text-muted-foreground">No feature requests yet.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <FeatureRequestCard
                key={r.id}
                request={r}
                onChange={(updated) =>
                  setRequests((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                }
                onDelete={(id) => setRequests((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="feedback" className="mt-4">
        {feedback.length === 0 ? (
          <div className="text-sm text-muted-foreground">No feedback yet.</div>
        ) : (
          <div className="space-y-2">
            {feedback.map((f) => (
              <div key={f.id} className="border rounded-md p-3 bg-background shadow-sm">
                <div className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm">{f.message}</div>
                {(f.name || f.email) && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {f.name && <span>From: {f.name} </span>}
                    {f.email && <span>&lt;{f.email}&gt;</span>}
                  </div>
                )}
                {f.page_url && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Page:{" "}
                    <a className="underline" href={f.page_url} target="_blank" rel="noreferrer">
                      {f.page_url}
                    </a>
                  </div>
                )}
                {f.user_agent && <div className="text-xs text-muted-foreground mt-1">UA: {f.user_agent}</div>}
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

function FeatureRequestCard({
  request,
  onChange,
  onDelete,
}: {
  request: FeatureRequest
  onChange: (r: FeatureRequest) => void
  onDelete: (id: string) => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState(request.admin_note || "")
  const [noteDirty, setNoteDirty] = useState(false)

  async function patch(body: Record<string, any>, successMsg?: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/feature-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "Update failed")
      onChange(j.request)
      if (successMsg) toast({ title: successMsg })
    } catch (err: any) {
      toast({ title: "Could not update", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm("Delete this feature request permanently?")) return
    setSaving(true)
    try {
      const res = await fetch(`/api/feature-requests/${request.id}`, { method: "DELETE" })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "Delete failed")
      onDelete(request.id)
      toast({ title: "Deleted" })
    } catch (err: any) {
      toast({ title: "Could not delete", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-md border bg-background p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center rounded-lg border bg-muted/40 px-3 py-2 text-xs">
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          <span className="mt-1 font-semibold">{request.upvote_count}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_CLASS[request.status] || ""}`}>
              {STATUS_OPTIONS.find((s) => s.value === request.status)?.label || request.status}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase">{request.category}</Badge>
            {request.is_pinned && (
              <Badge variant="outline" className="border-primary/40 text-[10px] uppercase text-primary">Pinned</Badge>
            )}
            <span className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleString()}</span>
          </div>
          <h3 className="mt-2 text-base font-semibold">{request.title}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{request.description}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {request.author_name && <span>by {request.author_name}</span>}
            {request.author_email && <span>&lt;{request.author_email}&gt;</span>}
            {request.tags?.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {request.tags.join(", ")}
              </span>
            )}
          </div>

          {/* Admin controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Select value={request.status} onValueChange={(v) => patch({ status: v }, "Status updated")}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={saving}
              onClick={() => patch({ is_pinned: !request.is_pinned })}
            >
              <Pin className="h-3.5 w-3.5" />
              {request.is_pinned ? "Unpin" : "Pin"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
              disabled={saving}
              onClick={remove}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Public note */}
          <div className="mt-3">
            <label className="text-xs font-medium text-muted-foreground">
              Public team note (shown on the request)
            </label>
            <Textarea
              value={note}
              rows={2}
              className="mt-1 text-sm"
              placeholder="Optional reply visible to everyone…"
              onChange={(e) => {
                setNote(e.target.value)
                setNoteDirty(true)
              }}
            />
            {noteDirty && (
              <div className="mt-1 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setNote(request.admin_note || "")
                    setNoteDirty(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={saving}
                  onClick={() => patch({ admin_note: note.trim() || null }, "Note saved").then(() => setNoteDirty(false))}
                >
                  Save note
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
