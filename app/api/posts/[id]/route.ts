import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (error || !data) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 })
    }

    await supabase
      .from("posts")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id)

    const transformedData = {
      ...data,
      authors: {
        name: data.admin?.full_name || data.admin?.username || "Anonymous",
        bio: data.admin?.bio,
        avatar_url: data.admin?.avatar_url,
      },
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
