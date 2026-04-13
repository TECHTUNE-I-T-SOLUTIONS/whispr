import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { admin } = await requireAuthFromRequest(req)
  const supabase = createSupabaseServer()

  const { response } = await req.json()

  if (!response) {
    return NextResponse.json({ error: "Response cannot be empty" }, { status: 400 })
  }

  const { error } = await supabase
    .from("whispr_wall")
    .update({ response, admin_id: admin.id })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
