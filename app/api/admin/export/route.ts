import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import type { Database } from "@/types/supabase"

type Admin = Database["public"]["Tables"]["admin"]["Row"]

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request) as { admin: Admin }

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createSupabaseServer()

    const { data: adminData, error: adminError } = await supabase
      .from("admin")
      .select("*")
      .eq("id", admin.id)
      .single()

    if (adminError || !adminData) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const { data: media } = await supabase
      .from("media")
      .select("*")

    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .eq("admin_id", admin.id)

    const exportData = {
      admin: adminData,
      media: media || [],
      settings: settings || [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="admin-export-${new Date().toISOString()}.json"`,
      },
    })
  } catch (error) {
    console.error("Export Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
