import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"

    const supabase = createSupabaseServer()

    const now = new Date()
    const daysBack = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("view_count, reading_time, created_at")
      .eq("status", "published")

    if (postsError || !posts) throw new Error("Failed to fetch posts")

    // Reactions
    const { count: totalReactions } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())

    // Comments
    const { count: totalComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("created_at", startDate.toISOString())

    // Whispr Wall Posts
    const { count: totalWallPosts } = await supabase
      .from("whispr_wall")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())

    // Wall Comments
    const { count: totalWallComments } = await supabase
      .from("wall_comments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())

    // Wall Reactions
    const { count: totalWallReactions } = await supabase
      .from("wall_reactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())

    const totalViews = posts.reduce((sum, post) => sum + (post.view_count || 0), 0)
    const avgReadingTime =
      posts.reduce((sum, post) => sum + (post.reading_time || 0), 0) / (posts.length || 1)

    const viewsOverTimeMap: Record<string, { views: number; reactions: number }> = {}

    posts.forEach((post) => {
      const dateKey = new Date(post.created_at!).toISOString().split("T")[0]
      if (!viewsOverTimeMap[dateKey]) {
        viewsOverTimeMap[dateKey] = { views: 0, reactions: 0 }
      }
      viewsOverTimeMap[dateKey].views += post.view_count || 0
    })

    const viewsOverTime = Object.entries(viewsOverTimeMap).map(([date, { views, reactions }]) => ({
      date,
      views,
      reactions,
    }))

    const { data: topPosts, error: topPostsError } = await supabase
      .from("posts")
      .select("title, view_count, type")
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .limit(5)

    if (topPostsError || !topPosts) throw new Error("Failed to fetch top posts")

    const topPostsFormatted = topPosts.map((post) => ({
      title: post.title.length > 20 ? post.title.substring(0, 20) + "..." : post.title,
      views: post.view_count || 0,
      reactions: 0,
      type: post.type,
    }))

    const { data: reactionRows } = await supabase
      .from("reactions")
      .select("type")
      .gte("created_at", startDate.toISOString())

    const reactionBreakdownMap: Record<string, number> = {}
    const colors: Record<string, string> = {
      Like: "#3b82f6",
      Love: "#ef4444",
      Wow: "#f59e0b",
      Haha: "#10b981",
    }

    reactionRows?.forEach((reaction) => {
      const type = reaction.type || "Other"
      reactionBreakdownMap[type] = (reactionBreakdownMap[type] || 0) + 1
    })

    const reactionBreakdown = Object.entries(reactionBreakdownMap).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || "#8884d8",
    }))

    const trafficSources: { source: string; visits: number }[] = []

    const analyticsData = {
      overview: {
        totalViews,
        totalReactions: (totalReactions || 0) + (totalWallReactions || 0),
        totalComments: (totalComments || 0) + (totalWallComments || 0),
        totalWallPosts: totalWallPosts || 0,
        avgReadingTime: Math.round(avgReadingTime),
        viewsGrowth: 0,
        reactionsGrowth: 0,
      },
      viewsOverTime,
      topPosts: topPostsFormatted,
      reactionBreakdown,
      trafficSources,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
