import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("post_id") // ✅ fixed here

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "approved")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments: data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { post_id, author_name, author_email, content, author_website } = await request.json()

    if (!post_id || !author_name || !author_email || !content) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Try to capture user agent and IP from request headers
    const userAgent = request.headers.get('user-agent') || null
    const xff = request.headers.get('x-forwarded-for') || null
    const userIp = xff ? xff.split(',')[0].trim() : null

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id,
        author_name,
        author_email,
        author_website: author_website || null,
        content,
        status: "approved", // make visible immediately; admin can still remove
        user_agent: userAgent,
        user_ip: userIp,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // return the created comment as `comment` for clarity
    return NextResponse.json({ comment: data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
