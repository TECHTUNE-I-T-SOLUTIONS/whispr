import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"

    const supabase = createSupabaseServer()

    // Calculate date range
    const now = new Date()
    const daysBack = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Get overview stats
    const { data: posts } = await supabase.from("posts").select("view_count, reading_time").eq("status", "published")

    const { count: totalReactions } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())

    const { count: totalComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("created_at", startDate.toISOString())

    const totalViews = posts?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0
    const avgReadingTime = posts?.reduce((sum, post) => sum + (post.reading_time || 0), 0) / (posts?.length || 1) || 0

    // Mock data for charts (in a real app, you'd calculate this from actual data)
    const viewsOverTime = Array.from({ length: daysBack }, (_, i) => {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      return {
        date: date.toISOString().split("T")[0],
        views: Math.floor(Math.random() * 100) + 50,
        reactions: Math.floor(Math.random() * 20) + 5,
      }
    })

    // Get top posts
    const { data: topPosts } = await supabase
      .from("posts")
      .select("title, view_count, type")
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .limit(5)

    const topPostsFormatted =
      topPosts?.map((post) => ({
        title: post.title.length > 20 ? post.title.substring(0, 20) + "..." : post.title,
        views: post.view_count || 0,
        reactions: Math.floor(Math.random() * 50),
        type: post.type,
      })) || []

    // Mock reaction breakdown
    const reactionBreakdown = [
      { name: "Like", value: 45, color: "#3b82f6" },
      { name: "Love", value: 30, color: "#ef4444" },
      { name: "Wow", value: 15, color: "#f59e0b" },
      { name: "Haha", value: 10, color: "#10b981" },
    ]

    // Mock traffic sources
    const trafficSources = [
      { source: "Direct", visits: 1250 },
      { source: "Social Media", visits: 890 },
      { source: "Search Engines", visits: 650 },
      { source: "Referrals", visits: 320 },
    ]

    const analyticsData = {
      overview: {
        totalViews,
        totalReactions: totalReactions || 0,
        totalComments: totalComments || 0,
        avgReadingTime: Math.round(avgReadingTime),
        viewsGrowth: Math.floor(Math.random() * 20) + 5, // Mock growth
        reactionsGrowth: Math.floor(Math.random() * 15) + 3, // Mock growth
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
