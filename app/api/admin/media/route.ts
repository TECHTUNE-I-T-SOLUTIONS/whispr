import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const admin = await requireAuthFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const type = searchParams.get("type") // image, video, audio, etc.
    const search = searchParams.get("search")

    const supabase = createSupabaseServer()

    let query = supabase.from("media").select("*", { count: "exact" }).order("created_at", { ascending: false })

    // Apply filters
    if (type) {
      query = query.like("file_type", `${type}%`)
    }

    if (search) {
      query = query.ilike("original_name", `%${search}%`)
    }

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

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const admin = await requireAuthFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("id")

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Get media info first
    const { data: media, error: fetchError } = await supabase
      .from("media")
      .select("file_path")
      .eq("id", mediaId)
      .single()

    if (fetchError || !media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage.from("media").remove([media.file_path])

    if (storageError) {
      console.error("Storage delete error:", storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase.from("media").delete().eq("id", mediaId)

    if (dbError) {
      console.error("Database delete error:", dbError)
      return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Media delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
