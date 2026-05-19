import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { data: stories, error } = await supabase
      .from("chronicles_stories")
      .select(`
        *,
        creator:chronicles_creators!creator_id(id, pen_name, display_name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ stories, success: true })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to load chronicles stories" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const body = await request.json()
    const { storyId, status } = body

    if (!storyId || !status) {
      return NextResponse.json({ error: "Story ID and Status are required" }, { status: 400 })
    }

    const { data: story, error } = await supabase
      .from("chronicles_stories")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", storyId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ story, success: true })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to moderate story status" }, { status: 500 })
  }
}
