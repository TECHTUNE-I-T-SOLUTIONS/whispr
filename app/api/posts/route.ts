import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") // 'blog' or 'poem'
  const featured = searchParams.get("featured")
  const limit = searchParams.get("limit")

  try {
    const supabase = createSupabaseServer()

    let query = supabase
      .from("posts")
      .select(`
        *,
        admin (
          full_name,
          username,
          avatar_url
        )
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (type) {
      query = query.eq("type", type)
    }

    if (featured === "true") {
      query = query.eq("featured", true)
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit))
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedData =
      data?.map((post) => ({
        ...post,
        authors: {
          name: post.admin?.full_name || post.admin?.username || "Prayce",
          avatar_url: post.admin?.avatar_url,
        },
      })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
