import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server-client"
import { getChapterComments, addChapterComment } from "@/lib/stories"

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
    const comments = await getChapterComments(supabase, chapterId, storyId, authorType)

    return NextResponse.json({ comments, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch chapter comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { chapterId, storyId, authorType, content, commenterName, commenterEmail, parentCommentId } = await request.json()

    if (!chapterId || !storyId || !authorType || !content || !commenterName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    const result = await addChapterComment(supabase, {
      chapterId,
      storyId,
      commenterName,
      commenterEmail: commenterEmail || user?.email || undefined,
      content,
      authorType,
      userId: user?.id || undefined,
      creatorId,
      parentCommentId
    })

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to insert chapter comment")
    }

    return NextResponse.json({ comment: result.data, success: true })
  } catch (error: any) {
    console.error("API chapter comment post failed:", error)
    return NextResponse.json({ error: error.message || "Failed to add chapter comment" }, { status: 500 })
  }
}