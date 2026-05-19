import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()
    const { data: tags, error } = await supabase
      .from("hashtags")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json({ tags, success: true })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to load central hashtags" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { name } = await request.json()
    if (!name) {
      return NextResponse.json({ error: "Hashtag name is required" }, { status: 400 })
    }

    const cleanName = name.trim().replace(/^#/, "").toLowerCase()
    
    // Check if exists
    const { data: existing } = await supabase
      .from("hashtags")
      .select("*")
      .eq("name", cleanName)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ tag: existing, message: "Tag already exists" })
    }

    const { data: newTag, error: insertError } = await supabase
      .from("hashtags")
      .insert([{ name: cleanName }])
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ tag: newTag, success: true })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to create central hashtag" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tagId")

    if (!tagId) {
      return NextResponse.json({ error: "Missing tagId parameter" }, { status: 400 })
    }

    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const { error } = await supabase
      .from("hashtags")
      .delete()
      .eq("id", tagId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to delete hashtag" }, { status: 500 })
  }
}
