import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import { createOrLinkHashtags } from "@/lib/stories"

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { data: stories, error } = await supabase
      .from("admin_stories")
      .select(`
        *,
        chapters:admin_story_chapters(count)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    const storiesWithCounts = stories.map((s: any) => ({
      ...s,
      chapters_count: s.chapters?.[0]?.count || 0
    }))

    return NextResponse.json({ stories: storiesWithCounts, success: true })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to load admin stories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const body = await request.json()
    const { title, excerpt, description, genre, coverImageUrl, hashtags = [], status = "draft" } = body

    if (!title || !genre) {
      return NextResponse.json({ error: "Title and Genre are required" }, { status: 400 })
    }

    const cleanSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80) + "-" + Math.random().toString(36).substring(2, 7)

    const payload: any = {
      admin_id: admin.id,
      title,
      slug: cleanSlug,
      genre,
      excerpt: excerpt || null,
      description: description || null,
      cover_image_url: coverImageUrl || null,
      status,
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0
    }

    if (status === "published") {
      payload.published_at = new Date().toISOString()
    }

    const { data: story, error: insertError } = await supabase
      .from("admin_stories")
      .insert([payload])
      .select()
      .single()

    if (insertError) throw insertError

    // Link hashtags
    if (hashtags.length > 0 && story) {
      const tagIds = await createOrLinkHashtags(supabase, hashtags)
      if (tagIds.length > 0) {
        const junctions = tagIds.map(tid => ({ story_id: story.id, hashtag_id: tid }))
        await supabase.from("admin_story_hashtags").insert(junctions)
      }
    }

    return NextResponse.json({ story, success: true })
  } catch (error: any) {
    console.error("Admin story creation failed:", error)
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to create admin story outline" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const body = await request.json()
    const { storyId, title, excerpt, description, genre, coverImageUrl, hashtags = [], status } = body

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    const { data: storyOwner } = await supabase
      .from("admin_stories")
      .select("id, status")
      .eq("id", storyId)
      .single()

    if (!storyOwner) {
      return NextResponse.json({ error: "Story outline not found" }, { status: 404 })
    }

    const payload: any = {}
    if (title) payload.title = title
    if (genre) payload.genre = genre
    if (excerpt !== undefined) payload.excerpt = excerpt
    if (description !== undefined) payload.description = description
    if (coverImageUrl !== undefined) payload.cover_image_url = coverImageUrl
    
    if (status) {
      payload.status = status
      if (status === "published" && storyOwner.status !== "published") {
        payload.published_at = new Date().toISOString()
      }
    }

    payload.updated_at = new Date().toISOString()

    const { data: updatedStory, error: updateError } = await supabase
      .from("admin_stories")
      .update(payload)
      .eq("id", storyId)
      .select()
      .single()

    if (updateError) throw updateError

    // Re-link hashtags
    if (hashtags.length > 0) {
      await supabase.from("admin_story_hashtags").delete().eq("story_id", storyId)
      const tagIds = await createOrLinkHashtags(supabase, hashtags)
      if (tagIds.length > 0) {
        const junctions = tagIds.map(tid => ({ story_id: storyId, hashtag_id: tid }))
        await supabase.from("admin_story_hashtags").insert(junctions)
      }
    }

    return NextResponse.json({ story: updatedStory, success: true })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to update admin story outline" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get("storyId")

    if (!storyId) {
      return NextResponse.json({ error: "Missing storyId parameter" }, { status: 400 })
    }

    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { error } = await supabase
      .from("admin_stories")
      .delete()
      .eq("id", storyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to delete admin story outline" }, { status: 500 })
  }
}
