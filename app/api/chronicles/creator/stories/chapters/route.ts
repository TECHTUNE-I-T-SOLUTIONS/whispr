import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server-client"
import { checkContentCompliance } from "@/lib/stories"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get("storyId")
    const includeDrafts = searchParams.get("includeDrafts") === "true"

    if (!storyId) {
      return NextResponse.json({ error: "storyId parameter is required" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    let query = supabase
      .from("chronicles_story_chapters")
      .select("*")
      .eq("story_id", storyId)
      .order("sequence", { ascending: true })

    if (!includeDrafts) {
      query = query.eq("status", "published")
    }

    const { data: chapters, error } = await query
    if (error) throw error

    return NextResponse.json({ chapters, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load chapters" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { storyId, title, content, status = "published" } = body

    if (!storyId || !title || !content) {
      return NextResponse.json({ error: "Story ID, Title, and Content are required" }, { status: 400 })
    }

    // 1. STRICT SAFETY COMPLIANCE CHECK
    const compliance = checkContentCompliance(title, content)
    if (!compliance.compliant) {
      return NextResponse.json({
        error: `Inappropriate Content Detected: Content contains text similar to "${compliance.offendingWord}", which violates our Safe Writing guidelines. Erotica/R-rated contents are strictly prohibited.`
      }, { status: 422 })
    }

    // Determine sequence
    const { count, error: countError } = await supabase
      .from("chronicles_story_chapters")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)

    if (countError) throw countError
    const nextSequence = (count || 0) + 1

    // Generate slug
    const cleanSlug = `chapter-${nextSequence}-` + title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50)

    const payload = {
      story_id: storyId,
      title,
      slug: cleanSlug,
      content,
      sequence: nextSequence,
      status
    }

    const { data: chapter, error: insertError } = await supabase
      .from("chronicles_story_chapters")
      .insert([payload])
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ chapter, success: true })
  } catch (error: any) {
    console.error("Chapter creation failed:", error)
    return NextResponse.json({ error: error.message || "Failed to publish chapter" }, { status: 500 })
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
    const { chapterId, title, content, sequence, status } = body

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 })
    }

    // 1. STRICT SAFETY COMPLIANCE CHECK
    const compliance = checkContentCompliance(title || "", content || "")
    if (!compliance.compliant) {
      return NextResponse.json({
        error: `Inappropriate Content Detected: Text matching "${compliance.offendingWord}" violates our Safe literature guidelines. Erotic or R-rated contents are prohibited.`
      }, { status: 422 })
    }

    const payload: any = {}
    if (title) payload.title = title
    if (content) payload.content = content
    if (sequence) payload.sequence = sequence
    if (status) payload.status = status

    payload.updated_at = new Date().toISOString()

    const { data: updatedChapter, error: updateError } = await supabase
      .from("chronicles_story_chapters")
      .update(payload)
      .eq("id", chapterId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ chapter: updatedChapter, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update chapter" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")

    if (!chapterId) {
      return NextResponse.json({ error: "Missing chapterId parameter" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("chronicles_story_chapters")
      .delete()
      .eq("id", chapterId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete chapter" }, { status: 500 })
  }
}
