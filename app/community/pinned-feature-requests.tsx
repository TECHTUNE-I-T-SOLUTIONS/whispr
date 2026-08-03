import Link from "next/link"
import { createSupabaseServer } from "@/lib/supabase-server"
import { Lightbulb, ThumbsUp, ArrowRight } from "lucide-react"

const STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  under_review: { label: "Under review", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  planned: { label: "Planned", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  in_progress: { label: "In progress", className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30" },
  shipped: { label: "Shipped", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  declined: { label: "Not planned", className: "bg-muted text-muted-foreground border-border" },
}

type PinnedRequest = {
  id: string
  title: string
  description: string
  status: string
  upvote_count: number
}

// Server component — renders a small preview of admin-pinned feature requests.
export async function PinnedFeatureRequests() {
  let pinned: PinnedRequest[] = []
  try {
    const supabase = createSupabaseServer()
    const { data } = await supabase
      .from("feature_requests")
      .select("id, title, description, status, upvote_count")
      .eq("is_pinned", true)
      .order("upvote_count", { ascending: false })
      .limit(4)
    pinned = data || []
  } catch {
    // table may not exist yet (migration not run) — fail silent, hide the section
    return null
  }

  if (!pinned.length) return null

  return (
    <section className="mb-8 sm:mb-10" aria-labelledby="pinned-feature-requests-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="pinned-feature-requests-heading"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <Lightbulb className="h-4 w-4 text-primary" />
          Featured requests
        </h2>
        <Link
          href="/feature-requests"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:gap-1.5"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {pinned.map((r) => {
          const meta = STATUS_META[r.status] || STATUS_META.open
          return (
            <Link
              key={r.id}
              href="/feature-requests"
              className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition hover:border-primary/40 hover:bg-card"
            >
              <span className="flex flex-shrink-0 flex-col items-center rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5 text-xs text-muted-foreground">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="mt-0.5 font-semibold text-foreground">{r.upvote_count}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${meta.className}`}
                >
                  {meta.label}
                </span>
                <span className="mt-1.5 block line-clamp-1 text-sm font-semibold text-foreground transition group-hover:text-primary">
                  {r.title}
                </span>
                <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">{r.description}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
