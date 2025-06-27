import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

function extractIdFromUrl(url: string): string | null {
  const segments = url.split("/")
  return segments[segments.length - 1] || null
}

export async function PATCH(request: NextRequest) {
  const id = extractIdFromUrl(request.nextUrl.pathname)

  if (!id) {
    return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
  }

  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { error } = await supabase
      .from("notifications")
      .update({ read: true, admin_id: admin.id })
      .eq("id", id)
      .or(`admin_id.eq.${admin.id},admin_id.is.null`)


    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }

    return NextResponse.json({ message: "Notification marked as read" })
  } catch (error) {
    console.error("PATCH error:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = extractIdFromUrl(request.nextUrl.pathname)
  if (!id) {
    return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
  }

  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .or(`admin_id.eq.${admin.id},admin_id.is.null`)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
    }

    return NextResponse.json({ message: "Notification deleted" })
  } catch (error) {
    console.error("DELETE error:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 500 })
  }
}
