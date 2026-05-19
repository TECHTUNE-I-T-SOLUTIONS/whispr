import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server-client"
import { getStoryComments, addStoryComment } from "@/lib/stories"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get("storyId")
    const authorType = searchParams.get("authorType") as 'admin' | 'chronicle'

    if (!storyId || !authorType) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const comments = await getStoryComments(supabase, storyId, authorType)

    return NextResponse.json({ comments, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login to comment." }, { status: 401 })
    }

    const { storyId, authorType, content, commenterName, parentCommentId } = await request.json()
    if (!storyId || !authorType || !content || !commenterName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Try fetching if the user is a creator
    let creatorId: string | undefined = undefined
    if (authorType === 'chronicle') {
      const { data: creator } = await supabase
        .from("chronicles_creators")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (creator) {
        creatorId = creator.id
      }
    }

    const result = await addStoryComment(supabase, {
      storyId,
      commenterName,
      content,
      authorType,
      userId: user.id,
      creatorId,
      parentCommentId
    })

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to insert comment")
    }

    return NextResponse.json({ comment: result.data, success: true })
  } catch (error: any) {
    console.error("API comment post failed:", error)
    return NextResponse.json({ error: error.message || "Failed to add comment" }, { status: 500 })
  }
}
