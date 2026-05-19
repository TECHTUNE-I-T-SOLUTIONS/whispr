import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server-client"
import { shareStory } from "@/lib/stories"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { storyId, sharedTo, authorType } = await request.json()

    if (!storyId || !sharedTo || !authorType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Try finding creator id if signed in
    const { data: { user } } = await supabase.auth.getUser()
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

    const result = await shareStory(supabase, storyId, sharedTo, authorType, creatorId)
    return NextResponse.json({ success: result.success })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log share" }, { status: 500 })
  }
}
