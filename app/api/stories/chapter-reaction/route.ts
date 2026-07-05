import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server-client"
import { getChapterReactionStatus, toggleChapterReaction, getChapterReactionCounts } from "@/lib/stories"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")
    const storyId = searchParams.get("storyId")
    const authorType = searchParams.get("authorType") as 'admin' | 'chronicle'

    if (!chapterId || !storyId || !authorType) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Get counts
    const counts = await getChapterReactionCounts(supabase, chapterId, storyId, authorType)

    // Get user's reaction status — supports both authenticated (user_id) and anonymous (user_ip)
    let userReaction: string | null = null
    if (user) {
      userReaction = await getChapterReactionStatus(supabase, chapterId, storyId, authorType, user.id)
    } else {
      userReaction = await getChapterReactionStatus(supabase, chapterId, storyId, authorType, undefined, userIp)
    }

    return NextResponse.json({ ...counts, userReaction, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch chapter reactions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const { chapterId, storyId, authorType, reactionType } = await request.json()

    if (!chapterId || !storyId || !authorType || !reactionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!['like', 'dislike'].includes(reactionType)) {
      return NextResponse.json({ error: "Invalid reaction type. Must be 'like' or 'dislike'." }, { status: 400 })
    }

    // Try fetching creator id if signed in
    let creatorId: string | undefined = undefined
    if (user && authorType === 'chronicle') {
      const { data: creator } = await supabase
        .from("chronicles_creators")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (creator) {
        creatorId = creator.id
      }
    }

    const result = await toggleChapterReaction(
      supabase,
      chapterId,
      storyId,
      reactionType as 'like' | 'dislike',
      authorType,
      user?.id || undefined,
      user?.id ? undefined : userIp, // only pass userIp for anonymous users
      creatorId
    )

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to toggle chapter reaction")
    }

    return NextResponse.json({ action: result.action, success: true })
  } catch (error: any) {
    console.error("API chapter reaction failed:", error)
    return NextResponse.json({ error: error.message || "Failed to toggle chapter reaction" }, { status: 500 })
  }
}