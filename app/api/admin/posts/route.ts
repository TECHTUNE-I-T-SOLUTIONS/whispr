import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import { sendPushNotificationToSubscribers } from "@/lib/push-notifications"

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("admin_id", admin.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching posts:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const body = await request.json()
    const { title, content, excerpt, type, status, featured, tags, seoTitle, seoDescription, mediaFiles } = body

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Calculate reading time (rough estimate)
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / wordsPerMinute)

    const postData = {
      title,
      content,
      excerpt,
      type,
      status,
      admin_id: admin.id,
      featured: featured || false,
      reading_time: readingTime,
      tags: tags || [],
      media_files: mediaFiles || [],
      seo_title: seoTitle || title,
      seo_description: seoDescription || excerpt,
      slug,
      published_at: status === "published" ? new Date().toISOString() : null,
    }

    const { data, error } = await supabase.from("posts").insert(postData).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send push notification if post is published
    if (status === "published") {
      try {
        const postType = type === "blog" ? "blog post" : "poem";
        await sendPushNotificationToSubscribers({
          title: `New ${postType}: ${title}`,
          body: excerpt || `Check out this new ${postType} by ${admin.full_name || admin.username || 'Whispr'}`,
          url: `/${type}/${data.id}`,
          type: type as 'blog' | 'poem',
          image: data.media_files?.[0]?.file_url || '/logotype.png'
        });
      } catch (pushError) {
        console.error("Error sending push notification:", pushError);
        // Don't fail the post creation if push notification fails
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating post:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
