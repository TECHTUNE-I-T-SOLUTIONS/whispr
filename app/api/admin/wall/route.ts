import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(req: NextRequest) {
  const { admin } = await requireAuthFromRequest(req) // ✅ Removed 'user'
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from("whispr_wall")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
