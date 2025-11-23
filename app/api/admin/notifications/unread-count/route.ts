import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getAdminFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const adminSession = await getAdminFromRequest(request)
    
    // If not authenticated, return 0 unread count instead of error
    if (!adminSession) {
      return NextResponse.json({ count: 0 })
    }

    const supabase = createSupabaseServer()
    const adminId = adminSession.admin?.id

    if (!adminId) {
      return NextResponse.json({ count: 0 })
    }

    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false)
        .or(`admin_id.eq.${adminId},admin_id.is.null`)

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ count: 0 })
      }

      return NextResponse.json({ count: count || 0 })
    } catch (dbError) {
      console.error("Database query error:", dbError)
      return NextResponse.json({ count: 0 })
    }
  } catch (error) {
    console.error("Error fetching unread notifications count:", error)
    return NextResponse.json({ count: 0 })
  }
}
