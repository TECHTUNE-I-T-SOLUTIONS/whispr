import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "24")
    const type = searchParams.get("type") // image, video, audio, etc.
    const search = searchParams.get("search")
    const published = searchParams.get("published") === "true"

    const supabase = createSupabaseServer()

    let query = supabase.from("media").select("*", { count: "exact" }).order("created_at", { ascending: false })

    // Apply filters
    if (type) {
      query = query.like("file_type", `${type}%`)
    }

    if (search) {
      query = query.ilike("original_name", `%${search}%`)
    }

    // For public access, we might want to filter by some criteria
    // For now, we'll show all media, but in production you might want to add
    // a "public" flag to the media table

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: media, error, count } = await query

    if (error) {
      console.error("Media fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
    }

    return NextResponse.json({
      media: media || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Media API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
