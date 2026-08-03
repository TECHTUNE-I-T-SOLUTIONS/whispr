import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim()
    const status = searchParams.get("status") || ""
    const category = searchParams.get("category") || ""
    const sort = searchParams.get("sort") || "popular"
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100)
    const supabase = createSupabaseServer()

    let query = supabase.from("feature_requests").select("*").limit(limit)
    if (status) query = query.eq("status", status)
    if (category) query = query.eq("category", category)
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

    if (sort === "recent") query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false })
    else if (sort === "active") query = query.order("updated_at", { ascending: false })
    else query = query.order("is_pinned", { ascending: false }).order("upvote_count", { ascending: false }).order("created_at", { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ ok: true, requests: data || [] })
  } catch (e: any) {
    console.error("feature-requests GET error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, category, author_name, author_email, author_token, tags } = body || {}

    if (!title || typeof title !== "string" || title.trim().length < 5) {
      return NextResponse.json({ ok: false, error: "Title must be at least 5 characters." }, { status: 400 })
    }
    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json({ ok: false, error: "Please describe your idea in at least 10 characters." }, { status: 400 })
    }

    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("feature_requests")
      .insert([
        {
          title: title.trim().slice(0, 200),
          description: description.trim().slice(0, 8000),
          category: category || "feature",
          author_name: author_name?.trim()?.slice(0, 80) || null,
          author_email: author_email?.trim()?.slice(0, 200) || null,
          author_token: author_token?.slice(0, 120) || null,
          tags: Array.isArray(tags) ? tags.slice(0, 8).map((t: string) => String(t).slice(0, 30)) : [],
        },
      ])
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, request: data })
  } catch (e: any) {
    console.error("feature-requests POST error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
