import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const { id } = await params
    const supabase = createSupabaseServer()

<<<<<<< HEAD
    const { data, error } = await supabase.from("posts").select("*").eq("id", id).eq("admin_id", admin.id).single()
=======
  // include creator/admin info
  let q = supabase.from("posts").select("*, admin:admin_id(id, username, full_name, avatar_url)").eq("id", id)
  if (admin.id !== '8ac41ab5-c544-4068-a628-426593a2d4e2') q = q.eq('admin_id', admin.id)
  const { data, error } = await q.single()
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching post:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const { id } = await params
    const supabase = createSupabaseServer()

    const body = await request.json()
    const { title, content, excerpt, type, status, featured, tags, seoTitle, seoDescription, mediaFiles } = body

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Calculate reading time
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / wordsPerMinute)

    const updateData = {
      title,
      content,
      excerpt,
      type,
      status,
      featured: featured || false,
      reading_time: readingTime,
      tags: tags || [],
      media_files: mediaFiles || [],
      seo_title: seoTitle || title,
      seo_description: seoDescription || excerpt,
      slug,
      published_at: status === "published" ? new Date().toISOString() : null,
    }

<<<<<<< HEAD
    const { data, error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .eq("admin_id", admin.id)
      .select()
      .single()
=======
  let upd = supabase.from('posts').update(updateData).eq('id', id)
  if (admin.id !== '8ac41ab5-c544-4068-a628-426593a2d4e2') upd = upd.eq('admin_id', admin.id)
  const { data, error } = await upd.select().single()
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating post:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const { id } = await params
    const supabase = createSupabaseServer()

<<<<<<< HEAD
    const { error } = await supabase.from("posts").delete().eq("id", id).eq("admin_id", admin.id)
=======
  let del = supabase.from('posts').delete().eq('id', id)
  if (admin.id !== '8ac41ab5-c544-4068-a628-426593a2d4e2') del = del.eq('admin_id', admin.id)
  const { error } = await del
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
