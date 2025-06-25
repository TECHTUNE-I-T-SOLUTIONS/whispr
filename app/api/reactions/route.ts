import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("postId")

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase.from("reactions").select("reaction_type").eq("post_id", postId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count reactions by type
    const reactionCounts = data.reduce((acc: Record<string, number>, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json(reactionCounts)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postId, reactionType } = await request.json()
    const userIp = request.headers.get("x-forwarded-for") || "unknown"

    if (!postId || !reactionType) {
      return NextResponse.json({ error: "Post ID and reaction type are required" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Check if user already reacted with this type
    const { data: existing } = await supabase
      .from("reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("user_ip", userIp)
      .eq("reaction_type", reactionType)
      .single()

    if (existing) {
      // Remove reaction if it already exists
      const { error } = await supabase.from("reactions").delete().eq("id", existing.id)

      if (error) {
        console.error("Database error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ action: "removed" })
    } else {
      // Add new reaction
      const { error } = await supabase.from("reactions").insert({
        post_id: postId,
        user_ip: userIp,
        reaction_type: reactionType,
      })

      if (error) {
        console.error("Database error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ action: "added" })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
