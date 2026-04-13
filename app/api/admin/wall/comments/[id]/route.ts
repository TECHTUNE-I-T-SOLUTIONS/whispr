import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { admin } = await requireAuthFromRequest(req)
  const supabase = createSupabaseServer()

  const { admin_response } = await req.json()

  if (!admin_response || !admin_response.trim()) {
    return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 })
  }

  const { error } = await supabase
    .from("wall_comments")
    .update({
      admin_response: admin_response.trim(),
      admin_response_updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
