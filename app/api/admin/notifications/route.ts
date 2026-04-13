import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getAdminFromRequest } from "@/lib/auth-server"

/**
 * GET /api/admin/notifications
 * Fetch admin notifications from both notifications and chronicles_admin_notifications tables
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN-NOTIFICATIONS] GET called')
    
    const adminData = await getAdminFromRequest(request)
    console.log('[ADMIN-NOTIFICATIONS] Admin data:', adminData)
    
    if (!adminData?.admin) {
      console.log('[ADMIN-NOTIFICATIONS] No admin found, returning 401')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createSupabaseServer()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") || "all"
    const adminId = adminData.admin.id

    // Fetch from general notifications table
    let generalQuery = supabase
      .from("notifications")
      .select("id, type, title, message, read, created_at")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false })

    if (type !== "all" && type !== "chronicle") {
      generalQuery = generalQuery.eq("type", type)
    }

    const { data: generalNotifications, error: generalError } = await generalQuery

    if (generalError) {
      console.error("[ADMIN-NOTIFICATIONS] Error fetching general notifications:", generalError)
      return NextResponse.json(
        { error: "Failed to fetch general notifications" },
        { status: 500 }
      )
    }

    // Fetch from chronicles_admin_notifications table
    let chroniclesQuery = supabase
      .from("chronicles_admin_notifications")
      .select(
        "id, notification_type, title, message, creator_id, post_id, comment_id, priority, read, read_at, read_by, action_taken, data, created_at"
      )
      .order("created_at", { ascending: false })

    if (type !== "all" && type !== "general") {
      chroniclesQuery = chroniclesQuery.eq("notification_type", type)
    }

    const { data: chroniclesNotifications, error: chroniclesError } = await chroniclesQuery

    if (chroniclesError) {
      console.error("[ADMIN-NOTIFICATIONS] Error fetching chronicles notifications:", chroniclesError)
      return NextResponse.json(
        { error: "Failed to fetch chronicles notifications" },
        { status: 500 }
      )
    }

    // Transform general notifications to match the common structure
    const transformedGeneral = (generalNotifications || []).map((n: any) => ({
      id: n.id,
      notification_type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      created_at: n.created_at,
      source: 'general'
    }))

    // Add source to chronicles notifications
    const transformedChronicles = (chroniclesNotifications || []).map((n: any) => ({
      ...n,
      source: 'chronicles'
    }))

    // Combine and sort notifications by created_at (newest first)
    const combinedNotifications = [
      ...transformedGeneral,
      ...transformedChronicles
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply pagination after combining
    const paginatedNotifications = combinedNotifications.slice(offset, offset + limit)
    const totalCount = combinedNotifications.length

    // Get unread counts from both tables
    const { count: generalUnreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("admin_id", adminId)
      .eq("read", false)

    const { count: chroniclesUnreadCount } = await supabase
      .from("chronicles_admin_notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false)

    const totalUnreadCount = (generalUnreadCount || 0) + (chroniclesUnreadCount || 0)

    return NextResponse.json({
      success: true,
      notifications: paginatedNotifications,
      unread_count: totalUnreadCount,
      total: totalCount,
    })
  } catch (error) {
    console.error("[ADMIN-NOTIFICATIONS] GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/notifications
 * Mark notifications as read in either notifications or chronicles_admin_notifications table
 */
export async function PUT(request: NextRequest) {
  try {
    const adminData = await getAdminFromRequest(request)
    if (!adminData?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createSupabaseServer()
    const body = await request.json()
    const { notification_id, source, read, all } = body

    if (all === true && read === true) {
      // Mark all as read in both tables
      const [generalError, chroniclesError] = await Promise.all([
        supabase
          .from("notifications")
          .update({
            read: true,
          })
          .eq("admin_id", adminData.admin.id)
          .eq("read", false),
        supabase
          .from("chronicles_admin_notifications")
          .update({
            read: true,
            read_at: new Date().toISOString(),
          })
          .eq("read", false),
      ])

      if (generalError && chroniclesError) {
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      })
    } else if (notification_id && source) {
      // Update specific notification in the appropriate table
      const updateData: any = {}

      if (read !== undefined) {
        updateData.read = read
        if (source === "chronicles" && read) {
          updateData.read_at = new Date().toISOString()
        }
      }

      const tableName = source === "general" ? "notifications" : "chronicles_admin_notifications"
      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", notification_id)
        .select()
        .single()

      if (error) {
        console.error(`[ADMIN-NOTIFICATIONS] Error updating ${source} notification:`, error)
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        notification: { ...data, source },
      })
    } else {
      return NextResponse.json(
        { error: "Missing notification_id, source, or all parameter" },
        { status: 400 }
      )
    }
  } catch (e) {
    console.error("[ADMIN-NOTIFICATIONS] PUT error:", e)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
