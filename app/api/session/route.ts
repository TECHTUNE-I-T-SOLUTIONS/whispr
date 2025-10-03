<<<<<<< HEAD
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    // Try to get session token from cookie
    const cookieStore = await cookies()
    const sessionToken =
      cookieStore.get("whispr-admin-session")?.value || request.cookies.get("whispr-admin-session")?.value

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, admin: null })
    }

    const supabase = createSupabaseServer()
    const { data: session, error } = await supabase
      .from("admin_sessions")
      .select(`
        *,
        admin (
          id,
          username,
          email,
          full_name,
          bio,
          avatar_url,
          phone,
          date_of_birth,
          profile_image_url,
          is_active,
          created_at,
          last_login
        )
      `)
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error || !session || !session.admin?.is_active) {
      // Clean up invalid session
      if (sessionToken) {
        await supabase.from("admin_sessions").delete().eq("session_token", sessionToken)
        cookieStore.delete("whispr-admin-session")
      }
      return NextResponse.json({ authenticated: false, admin: null })
    }

    // Update last accessed
    await supabase
      .from("admin_sessions")
      .update({ last_accessed: new Date().toISOString() })
      .eq("session_token", sessionToken)

    return NextResponse.json({
      authenticated: true,
      admin: session.admin,
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ authenticated: false, admin: null })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken =
      cookieStore.get("whispr-admin-session")?.value || request.cookies.get("whispr-admin-session")?.value

    if (sessionToken) {
      const supabase = createSupabaseServer()
      await supabase.from("admin_sessions").delete().eq("session_token", sessionToken)
    }

    cookieStore.delete("whispr-admin-session")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
=======
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies()

  const isAuthenticated = cookieStore.get("whispr-admin-auth")?.value === "true"
  const adminDataCookie = cookieStore.get("whispr-admin-data")?.value

  if (!isAuthenticated || !adminDataCookie) {
    return NextResponse.json({ authenticated: false, admin: null })
  }

  try {
    const adminData = JSON.parse(decodeURIComponent(adminDataCookie))
    return NextResponse.json({ authenticated: true, admin: adminData })
  } catch (error) {
    console.error("Error parsing admin cookie:", error)
    const response = NextResponse.json({ authenticated: false, admin: null })
    response.cookies.set("whispr-admin-auth", "", { maxAge: 0, path: "/" })
    response.cookies.set("whispr-admin-data", "", { maxAge: 0, path: "/" })
    return response
  }
}

export async function DELETE(_request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.set("whispr-admin-auth", "", { maxAge: 0, path: "/" })
  response.cookies.set("whispr-admin-data", "", { maxAge: 0, path: "/" })
  return response
}
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
