import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import type { Database } from "@/types/supabase"

type Admin = Database["public"]["Tables"]["admin"]["Row"]

// ✅ GET handler
export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request) as { admin: Admin }

    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("admin")
      .select("*")
      .eq("id", admin.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json({ admin: data })
  } catch (error) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }
}

// ✅ PUT handler (your existing one)
export async function PUT(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request) as { admin: Admin }

    const body = await request.json()
    const supabase = createSupabaseServer()

    const { data, error } = await supabase
      .from("admin")
      .update({
        username: body.username,
        email: body.email,
        full_name: body.full_name,
        bio: body.bio,
        phone: body.phone,
        date_of_birth: body.date_of_birth,
      })
      .eq("id", admin.id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, admin: data })
  } catch (error) {
    console.error("Error updating profile:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
