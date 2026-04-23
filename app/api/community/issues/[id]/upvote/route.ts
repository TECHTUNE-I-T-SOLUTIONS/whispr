import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { voter_token } = await req.json()
    if (!voter_token) return NextResponse.json({ ok: false, error: "Missing voter token." }, { status: 400 })

    const supabase = createSupabaseServer()
    const { data: existing } = await supabase
      .from("community_upvotes")
      .select("id")
      .eq("issue_id", id)
      .eq("voter_token", voter_token)
      .maybeSingle()

    if (existing) {
      await supabase.from("community_upvotes").delete().eq("id", existing.id)
      return NextResponse.json({ ok: true, upvoted: false })
    }

    const { error } = await supabase.from("community_upvotes").insert([{ issue_id: id, voter_token }])
    if (error) throw error
    return NextResponse.json({ ok: true, upvoted: true })
  } catch (e: any) {
    console.error("community upvote error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
