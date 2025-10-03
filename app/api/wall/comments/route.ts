import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

// GET /api/wall/comments?wall_id=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const wallId = searchParams.get("wall_id")

  if (!wallId) {
    return NextResponse.json({ error: "wall_id is required" }, { status: 400 })
  }

  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from("wall_comments")
    .select("*")
    .eq("wall_id", wallId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/wall/comments
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  const body = await req.json()
  const { wall_id, content } = body

  if (!wall_id || !content?.trim()) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("wall_comments")
    .insert({ wall_id, content })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
