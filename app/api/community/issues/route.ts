import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim()
    const status = searchParams.get("status") || ""
    const category = searchParams.get("category") || ""
    const sort = searchParams.get("sort") || "recent"
    const limit = Math.min(Number(searchParams.get("limit") || 30), 100)
    const supabase = createSupabaseServer()

    if (q) {
      const { data, error } = await supabase.rpc("search_community_issues", { q, lim: limit })
      if (error) throw error
      let rows = data || []
      if (status) rows = rows.filter((r: any) => r.status === status)
      if (category) rows = rows.filter((r: any) => r.category === category)
      return NextResponse.json({ ok: true, issues: rows })
    }

    let query = supabase.from("community_issues").select("*").limit(limit)
    if (status) query = query.eq("status", status)
    if (category) query = query.eq("category", category)
    if (sort === "popular") query = query.order("upvote_count", { ascending: false }).order("created_at", { ascending: false })
    else if (sort === "active") query = query.order("updated_at", { ascending: false })
    else query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ ok: true, issues: data || [] })
  } catch (e: any) {
    console.error("community issues GET error", e)
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
      return NextResponse.json({ ok: false, error: "Description must be at least 10 characters." }, { status: 400 })
    }
    if (!author_token || typeof author_token !== "string") {
      return NextResponse.json({ ok: false, error: "Missing visitor token." }, { status: 400 })
    }

    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("community_issues")
      .insert([
        {
          title: title.trim().slice(0, 200),
          description: description.trim().slice(0, 8000),
          category: category || "general",
          author_name: author_name?.trim()?.slice(0, 80) || null,
          author_email: author_email?.trim()?.slice(0, 200) || null,
          author_token,
          tags: Array.isArray(tags) ? tags.slice(0, 8).map((t: string) => String(t).slice(0, 30)) : [],
        },
      ])
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, issue: data })
  } catch (e: any) {
    console.error("community issues POST error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
