import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createSupabaseServer()
    const { data: issue, error } = await supabase.from("community_issues").select("*").eq("id", id).single()
    if (error || !issue) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })

    const { data: replies } = await supabase
      .from("community_replies")
      .select("*")
      .eq("issue_id", id)
      .order("created_at", { ascending: true })

    // best-effort view increment (non-blocking)
    supabase.from("community_issues").update({ view_count: (issue.view_count || 0) + 1 }).eq("id", id).then(() => {})

    return NextResponse.json({ ok: true, issue, replies: replies || [] })
  } catch (e: any) {
    console.error("community issue GET error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session?.admin) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const allowed: Record<string, any> = {}
    for (const k of ["status", "priority", "category", "is_pinned", "tags"]) {
      if (k in body) allowed[k] = body[k]
    }
    if (body.status === "resolved") {
      allowed.resolved_at = new Date().toISOString()
      allowed.resolved_by = session.admin.id
    }
    if (body.status && body.status !== "resolved") {
      allowed.resolved_at = null
      allowed.resolved_by = null
    }

    const supabase = createSupabaseServer()
    const { data, error } = await supabase.from("community_issues").update(allowed).eq("id", id).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, issue: data })
  } catch (e: any) {
    console.error("community issue PATCH error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
