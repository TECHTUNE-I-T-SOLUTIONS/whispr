import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from("whispr_wall")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  const { content } = await req.json()

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("whispr_wall")
    .insert({ content })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create a notification for the admin
  await supabase.from("notifications").insert({
    type: "whispr_wall",
    title: "🧱 New Anonymous Post",
    message: content.slice(0, 200) + "...",
  })

  return NextResponse.json(data)
}
