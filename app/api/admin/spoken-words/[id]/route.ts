import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = createSupabaseServer()
    const body = await request.json()

    const { title, description, type, media_id } = body

    if (!title || !media_id) {
      return NextResponse.json({ error: "Title and media_id are required" }, { status: 400 })
    }

    const { data: spokenWord, error } = await supabase
      .from("spoken_words")
      .update({
        title,
        description,
        type,
        media_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select(`
        *,
        media_file:media (
          id,
          original_name,
          file_name,
          file_path,
          file_url,
          file_type,
          file_size
        )
      `)
      .single()

    if (error) {
      console.error("Error updating spoken word:", error)
      return NextResponse.json({ error: "Failed to update spoken word" }, { status: 500 })
    }

    return NextResponse.json({ spokenWord })
  } catch (error) {
    console.error("Error in PUT /api/admin/spoken-words/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = createSupabaseServer()

    const { error } = await supabase
      .from("spoken_words")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting spoken word:", error)
      return NextResponse.json({ error: "Failed to delete spoken word" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/spoken-words/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
