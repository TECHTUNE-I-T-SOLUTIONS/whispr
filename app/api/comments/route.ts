import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
<<<<<<< HEAD
  const postId = searchParams.get("postId")
=======
  const postId = searchParams.get("post_id") // ✅ fixed here
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

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

<<<<<<< HEAD
    return NextResponse.json(data)
=======
    return NextResponse.json({ comments: data })
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
<<<<<<< HEAD
    const { postId, authorName, authorEmail, content } = await request.json()

    if (!postId || !authorName || !authorEmail || !content) {
=======
    const { post_id, author_name, author_email, content, author_website } = await request.json()

    if (!post_id || !author_name || !author_email || !content) {
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const supabase = createSupabaseServer()
<<<<<<< HEAD
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_name: authorName,
        author_email: authorEmail,
        content: content,
        status: "pending", // Comments need approval
=======

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
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

<<<<<<< HEAD
    return NextResponse.json(data)
=======
    // return the created comment as `comment` for clarity
    return NextResponse.json({ comment: data })
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
