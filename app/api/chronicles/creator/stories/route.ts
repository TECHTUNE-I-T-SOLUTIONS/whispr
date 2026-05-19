import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server-client"
import { checkContentCompliance, createOrLinkHashtags } from "@/lib/stories"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get Creator ID
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json({ error: "Creator profile not found. Please join Chronicles first." }, { status: 404 })
    }

    const { data: stories, error } = await supabase
      .from("chronicles_stories")
      .select(`
        *,
        chapters:chronicles_story_chapters(count)
      `)
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Map counts
    const storiesWithCounts = stories.map((s: any) => ({
      ...s,
      chapters_count: s.chapters?.[0]?.count || 0
    }))

    return NextResponse.json({ stories: storiesWithCounts, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load stories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: creator } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found." }, { status: 404 })
    }

    const body = await request.json()
    const { title, excerpt, description, genre, coverImageUrl, hashtags = [], status = "draft" } = body

    if (!title || !genre) {
      return NextResponse.json({ error: "Title and Genre are required" }, { status: 400 })
    }

    // 1. STRICT PG-13 SAFETY COMPLIANCE CHECK
    const compliance = checkContentCompliance(title, excerpt || "", description || "")
    if (!compliance.compliant) {
      return NextResponse.json({
        error: `Inappropriate Content Detected: Words matching or similar to "${compliance.offendingWord}" violate Whispr safe guidelines. We prohibit erotic, R-rated, or adult story outlines.`
      }, { status: 422 })
    }

    // Generate unique slug
    const cleanSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80) + "-" + Math.random().toString(36).substring(2, 7)

    const payload: any = {
      creator_id: creator.id,
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
      .from("chronicles_stories")
      .insert([payload])
      .select()
      .single()

    if (insertError) throw insertError

    // Handle hashtags
    if (hashtags.length > 0 && story) {
      const tagIds = await createOrLinkHashtags(supabase, hashtags)
      if (tagIds.length > 0) {
        const junctions = tagIds.map(tid => ({ story_id: story.id, hashtag_id: tid }))
        await supabase.from("chronicles_story_hashtags").insert(junctions)
      }
    }

    return NextResponse.json({ story, success: true })
  } catch (error: any) {
    console.error("Story outline creation failed:", error)
    return NextResponse.json({ error: error.message || "Failed to create story outline" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { storyId, title, excerpt, description, genre, coverImageUrl, hashtags = [], status } = body

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    // Verify creator ownership or admin status
    const { data: storyOwner } = await supabase
      .from("chronicles_stories")
      .select("id, creator_id, status")
      .eq("id", storyId)
      .single()

    if (!storyOwner) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // 1. STRICT SAFETY CHECK
    const compliance = checkContentCompliance(title || "", excerpt || "", description || "")
    if (!compliance.compliant) {
      return NextResponse.json({
        error: `Inappropriate Content Detected: Words matching "${compliance.offendingWord}" violate Whispr Safe terms. PG-13 themes only.`
      }, { status: 422 })
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
      .from("chronicles_stories")
      .update(payload)
      .eq("id", storyId)
      .select()
      .single()

    if (updateError) throw updateError

    // Re-link hashtags if provided
    if (hashtags.length > 0) {
      // Clear old junctions
      await supabase.from("chronicles_story_hashtags").delete().eq("story_id", storyId)
      
      const tagIds = await createOrLinkHashtags(supabase, hashtags)
      if (tagIds.length > 0) {
        const junctions = tagIds.map(tid => ({ story_id: storyId, hashtag_id: tid }))
        await supabase.from("chronicles_story_hashtags").insert(junctions)
      }
    }

    return NextResponse.json({ story: updatedStory, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update story outline" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get("storyId")

    if (!storyId) {
      return NextResponse.json({ error: "Missing storyId parameter" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete query
    const { error } = await supabase
      .from("chronicles_stories")
      .delete()
      .eq("id", storyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete story outline" }, { status: 500 })
  }
}
