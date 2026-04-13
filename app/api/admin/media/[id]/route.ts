// app/api/admin/media/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
  }

  try {
    const admin = await requireAuthFromRequest(request)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = createSupabaseServer()

    // Get the media file path
    const { data: file, error: fetchError } = await supabase
      .from("media")
      .select("file_path")
      .eq("id", id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Delete from Supabase storage
    const { error: storageError } = await supabase
      .storage
      .from("media")
      .remove([file.file_path])

    if (storageError) {
      console.error("Storage error:", storageError)
    }

    // Delete from DB
    const { error: dbError } = await supabase
      .from("media")
      .delete()
      .eq("id", id)

    if (dbError) {
      return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Media delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
