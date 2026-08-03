import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session?.admin) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const allowed: Record<string, any> = {}
    for (const k of ["status", "category", "is_pinned", "tags", "admin_note"]) {
      if (k in body) allowed[k] = body[k]
    }

    const supabase = createSupabaseServer()
    const { data, error } = await supabase.from("feature_requests").update(allowed).eq("id", id).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, request: data })
  } catch (e: any) {
    console.error("feature-request PATCH error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session?.admin) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const supabase = createSupabaseServer()
    const { error } = await supabase.from("feature_requests").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("feature-request DELETE error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
