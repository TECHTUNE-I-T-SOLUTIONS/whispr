import { type NextRequest, NextResponse } from "next/server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("admin_id", admin.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 })
    }

    return NextResponse.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("POST error:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 500 })
  }
}
