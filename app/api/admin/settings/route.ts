import { type NextRequest, NextResponse } from "next/server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import { createSupabaseServer } from "@/lib/supabase-server"
import type { Database } from "@/types/supabase"

type Admin = Database["public"]["Tables"]["admin"]["Row"]

export async function GET(request: NextRequest) {
  const { admin } = await requireAuthFromRequest(request) as { admin: Admin }

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServer()

  const { data: settings, error } = await supabase
    .from("settings")
    .select("*")
    .eq("admin_id", admin.id)
    .single()

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: "Failed to fetch settings." }, { status: 500 })
  }

  return NextResponse.json({
    settings: settings || {
      theme: "system",
      auto_save: true,
      email_notifications: true,
      push_notifications: false,
      two_factor_auth: false,
      session_timeout: 24,
      backup_frequency: "weekly",
      analytics_enabled: true,
    },
  })
}

export async function PUT(request: NextRequest) {
  const { admin } = await requireAuthFromRequest(request) as { admin: Admin }

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const supabase = createSupabaseServer()

  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .eq("admin_id", admin.id)
    .single()

  let result

  if (existing) {
    result = await supabase
      .from("settings")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("admin_id", admin.id)
  } else {
    result = await supabase
      .from("settings")
      .insert({
        admin_id: admin.id,
        ...body,
      })
  }

  if (result.error) {
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
