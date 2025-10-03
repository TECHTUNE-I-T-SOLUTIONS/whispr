import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  const { wall_id } = await req.json()
  const userIp = req.headers.get("x-forwarded-for") || "unknown"

  if (!wall_id) return NextResponse.json({ error: "wall_id is required" }, { status: 400 })

  const supabase = createSupabaseServer()

  // Check if user already reacted
  const { data: existing, error: fetchError } = await supabase
    .from("wall_reactions")
    .select("*")
    .eq("wall_id", wall_id)
    .eq("user_ip", userIp)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Fetch error:", fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (existing) {
    // Remove existing reaction
    const { error: deleteError } = await supabase
      .from("wall_reactions")
      .delete()
      .eq("id", existing.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ action: "removed" })
  }

  // Add new reaction
  const { error: insertError } = await supabase
    .from("wall_reactions")
    .insert({ wall_id, user_ip: userIp })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ action: "added" })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wallId = searchParams.get("wall_id")
  const userIp = request.headers.get("x-forwarded-for") || "unknown"

  if (!wallId) {
    return NextResponse.json({ error: "wall_id is required" }, { status: 400 })
  }

  const supabase = createSupabaseServer()

  const { data: reactions, error } = await supabase
    .from("wall_reactions")
    .select("user_ip")
    .eq("wall_id", wallId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = reactions.length
  const userReacted = reactions.some((r) => r.user_ip === userIp)

  return NextResponse.json({ count, reacted: userReacted })
}
