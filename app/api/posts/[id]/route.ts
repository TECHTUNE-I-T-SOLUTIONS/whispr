import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const supabase = createSupabaseServer()

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        admin (
          full_name,
          username,
          bio,
          avatar_url
        )
      `)
      .eq("id", id)
      .eq("status", "published")
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedData = {
      ...data,
      authors: {
        name: data.admin?.full_name || data.admin?.username || "Prayce",
        bio: data.admin?.bio,
        avatar_url: data.admin?.avatar_url,
      },
    }

    // Increment view count
    await supabase
      .from("posts")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id)

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
