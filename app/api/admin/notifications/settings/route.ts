import { type NextRequest, NextResponse } from "next/server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { data, error } = await supabase
      .from("admin_notification_settings")
      .select("*")
      .eq("admin_id", admin.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      throw error
    }

    // If no settings exist, return defaults
    const settings = data ?? {
      email_notifications: true,
      comment_notifications: true,
      reaction_notifications: true,
      milestone_notifications: true,
      system_notifications: true,
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching notification settings:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const body = await request.json()

    const { error } = await supabase
      .from("admin_notification_settings")
      .upsert(
        {
          admin_id: admin.id,
          email_notifications: body.email_notifications ?? true,
          comment_notifications: body.comment_notifications ?? true,
          reaction_notifications: body.reaction_notifications ?? true,
          milestone_notifications: body.milestone_notifications ?? true,
          system_notifications: body.system_notifications ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "admin_id" } // ensures it updates if exists
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notification settings:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
