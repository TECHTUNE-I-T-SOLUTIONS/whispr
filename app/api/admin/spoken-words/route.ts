import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import { sendPushNotificationToSubscribers } from "@/lib/push-notifications"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const supabase = createSupabaseServer()

    const { data: spokenWords, error } = await supabase
      .from("spoken_words")
      .select(`
        *,
        media_file:media (
          id,
          original_name,
          file_name,
          file_path,
          file_url,
          file_type,
          file_size
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching spoken words:", error)
      return NextResponse.json({ error: "Failed to fetch spoken words" }, { status: 500 })
    }

    return NextResponse.json({ spokenWords: spokenWords || [] })
  } catch (error) {
    console.error("Error in GET /api/admin/spoken-words:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const supabase = createSupabaseServer()
    const body = await request.json()

    const { title, description, type, media_id } = body

    if (!title || !media_id) {
      return NextResponse.json({ error: "Title and media_id are required" }, { status: 400 })
    }

    // Use admin ID from session
    const adminId = session.admin.id

    const { data: spokenWord, error } = await supabase
      .from("spoken_words")
      .insert({
        title,
        description,
        type,
        media_id,
        admin_id: adminId
      })
      .select(`
        *,
        media_file:media (
          id,
          original_name,
          file_name,
          file_path,
          file_url,
          file_type,
          file_size
        )
      `)
      .single()

    if (error) {
      console.error("Error creating spoken word:", error)
      return NextResponse.json({ error: "Failed to create spoken word" }, { status: 500 })
    }

    // Send push notification for new spoken word
    try {
      const contentType = type === "audio" ? "audio" : "video";
      await sendPushNotificationToSubscribers({
        title: `New ${contentType}: ${title}`,
        body: description || `Check out this new ${contentType} spoken word content`,
        url: `/admin/spoken-words`,
        type: 'spoken_word',
        image: spokenWord.media_file?.file_url || '/placeholder-logo.png'
      });
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
      // Don't fail the spoken word creation if push notification fails
    }

    return NextResponse.json({ spokenWord })
  } catch (error) {
    console.error("Error in POST /api/admin/spoken-words:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
