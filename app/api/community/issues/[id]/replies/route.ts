import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { content, author_name, author_email, author_token, parent_reply_id, is_solution } = body || {}

    if (!content || typeof content !== "string" || content.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "Reply is too short." }, { status: 400 })
    }

    const session = await getSession()
    const isAdmin = Boolean(session?.admin)

    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("community_replies")
      .insert([
        {
          issue_id: id,
          parent_reply_id: parent_reply_id || null,
          content: content.trim().slice(0, 5000),
          author_name: isAdmin
            ? session!.admin.full_name || session!.admin.username || "Whispr Team"
            : author_name?.trim()?.slice(0, 80) || null,
          author_email: isAdmin ? session!.admin.email || null : author_email?.trim()?.slice(0, 200) || null,
          author_token: isAdmin ? null : author_token || null,
          is_admin: isAdmin,
          admin_id: isAdmin ? session!.admin.id : null,
          is_solution: isAdmin ? Boolean(is_solution) : false,
        },
      ])
      .select("*")
      .single()

    if (error) throw error

    if (isAdmin && is_solution) {
      await supabase
        .from("community_issues")
        .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: session!.admin.id })
        .eq("id", id)
    }

    return NextResponse.json({ ok: true, reply: data })
  } catch (e: any) {
    console.error("community reply POST error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
