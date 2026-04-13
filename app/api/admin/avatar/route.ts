import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import type { Database } from "@/types/supabase"

type Admin = Database["public"]["Tables"]["admin"]["Row"]

/**
 * GET /api/admin/avatar
 * Returns the public URL for an admin's avatar image.
 * Can fetch for current user or specific admin by ID (public endpoint).
 * Query params: ?adminId=<id> to fetch specific admin, otherwise uses current user
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const specificAdminId = url.searchParams.get("adminId")

    // If a specific admin ID is requested, fetch without auth (public data)
    if (specificAdminId) {
      const supabase = createSupabaseServer()
      const { data, error } = await supabase
        .from("admin")
        .select("avatar_url, username, full_name")
        .eq("id", specificAdminId)
        .single()

      if (error || !data || !data.avatar_url) {
        return NextResponse.json({
          avatar_url: null,
          fallback: "/placeholder.svg",
          message: "No avatar set"
        })
      }

      // Extract filename from stored path
      const filename = data.avatar_url.split("/").pop() || data.avatar_url

      // Since storage is public, construct the URL directly
      // File may be stored in nested path (avatars/filename), so try that first
      let { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(`avatars/${filename}`)

      // Fallback: try without the nested path
      if (!publicUrlData?.publicUrl || publicUrlData.publicUrl.includes("undefined")) {
        const { data: fallbackData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filename)
        publicUrlData = fallbackData
      }

      if (!publicUrlData?.publicUrl) {
        return NextResponse.json({
          avatar_url: null,
          fallback: "/placeholder.svg",
          error: "Failed to construct avatar URL"
        }, { status: 500 })
      }

      console.log("✅ Avatar endpoint - public URL for admin:", specificAdminId)

      return NextResponse.json({
        avatar_url: publicUrlData.publicUrl,
        filename: filename,
        username: data.username,
        full_name: data.full_name,
        success: true
      })
    }

    // Otherwise, get current user from auth
    const { admin } = (await requireAuthFromRequest(request)) as { admin: Admin }

    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("admin")
      .select("avatar_url, username, full_name")
      .eq("id", admin.id)
      .single()

    if (error || !data || !data.avatar_url) {
      return NextResponse.json({
        avatar_url: null,
        fallback: "/placeholder.svg",
        message: "No avatar set"
      })
    }

    // Extract filename from stored path
    const filename = data.avatar_url.split("/").pop() || data.avatar_url

    // Since storage is public, construct the URL directly
    // File may be stored in nested path (avatars/filename), so try that first
    let { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(`avatars/${filename}`)

    // Fallback: try without the nested path
    if (!publicUrlData?.publicUrl || publicUrlData.publicUrl.includes("undefined")) {
      const { data: fallbackData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filename)
      publicUrlData = fallbackData
    }

    if (!publicUrlData?.publicUrl) {
      console.error("❌ Failed to construct public URL")
      return NextResponse.json({
        avatar_url: null,
        fallback: "/placeholder.svg",
        error: "Failed to construct avatar URL"
      }, { status: 500 })
    }

    console.log("✅ Avatar endpoint - public URL for current user")

    return NextResponse.json({
      avatar_url: publicUrlData.publicUrl,
      filename: filename,
      username: data.username,
      full_name: data.full_name,
      success: true
    })
  } catch (error) {
    console.error("Avatar fetch error:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({
      avatar_url: null,
      fallback: "/placeholder.svg",
      error: "Failed to fetch avatar"
    }, { status: 500 })
  }
}
