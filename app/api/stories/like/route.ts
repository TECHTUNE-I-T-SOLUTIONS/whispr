import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server-client"
import { getStoryLikeStatus, likeStory, unlikeStory } from "@/lib/stories"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login to like stories." }, { status: 401 })
    }

    const { storyId, authorType } = await request.json()
    if (!storyId || !authorType) {
      return NextResponse.json({ error: "Missing storyId or authorType parameter" }, { status: 400 })
    }

    // Toggle liking state
    const isLiked = await getStoryLikeStatus(supabase, storyId, user.id, authorType)
    
    if (isLiked) {
      const res = await unlikeStory(supabase, storyId, user.id, authorType)
      if (!res.success) throw new Error("Database failed on unlike")
      return NextResponse.json({ action: "unliked", success: true })
    } else {
      const res = await likeStory(supabase, storyId, user.id, authorType)
      if (!res.success) throw new Error("Database failed on like")
      return NextResponse.json({ action: "liked", success: true })
    }
  } catch (error: any) {
    console.error("API story like failed:", error)
    return NextResponse.json({ error: error.message || "Failed to toggle story reaction" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get("storyId")
    const authorType = searchParams.get("authorType") as 'admin' | 'chronicle'

    if (!storyId || !authorType) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let isLiked = false
    if (user) {
      isLiked = await getStoryLikeStatus(supabase, storyId, user.id, authorType)
    }

    return NextResponse.json({ isLiked, success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to read reaction state" }, { status: 500 })
  }
}
