import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createSupabaseServer } from "@/lib/supabase-server"
import { IssueClient } from "./issue-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = createSupabaseServer()
    const { data } = await supabase.from("community_issues").select("title, description").eq("id", id).single()
    if (data) {
      return {
        title: `${data.title} — Whispr Community`,
        description: data.description?.slice(0, 160),
      }
    }
  } catch {}
  return { title: "Community Issue — Whispr" }
}

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createSupabaseServer()
  const { data: issue } = await supabase.from("community_issues").select("*").eq("id", id).single()
  const { data: replies } = await supabase
    .from("community_replies")
    .select("*")
    .eq("issue_id", id)
    .order("created_at", { ascending: true })

  if (!issue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Issue not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed.</p>
        <Link href="/community" className="mt-6 inline-block text-primary underline">
          Back to community
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/community"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to community
        </Link>
        <IssueClient initialIssue={issue} initialReplies={replies || []} />
      </div>
    </div>
  )
}
