import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    // Get total posts
    const { count: totalPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")

    // Get total reactions
    const { count: totalReactions } = await supabase.from("reactions").select("*", { count: "exact", head: true })

    // Get total comments
    const { count: totalComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")

    // Get pending comments
    const { count: pendingComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    // Get total views (sum of view_count from posts)
    const { data: viewData } = await supabase.from("posts").select("view_count").eq("status", "published")

    const totalViews = viewData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0

    // Get posts this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: postsThisMonth } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", startOfMonth.toISOString())

    return NextResponse.json({
      totalPosts: totalPosts || 0,
      totalReactions: totalReactions || 0,
      totalComments: totalComments || 0,
      totalViews,
      postsThisMonth: postsThisMonth || 0,
      pendingComments: pendingComments || 0,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
