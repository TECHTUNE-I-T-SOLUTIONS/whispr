import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server-client"

export async function GET(_request: NextRequest) {
  try {
    // First check for admin session (for admin pages)
    const cookieStore = await cookies()
    const isAdminAuthenticated = cookieStore.get("whispr-admin-auth")?.value === "true"
    const adminDataCookie = cookieStore.get("whispr-admin-data")?.value

    if (isAdminAuthenticated && adminDataCookie) {
      try {
        const adminData = JSON.parse(decodeURIComponent(adminDataCookie))
        return NextResponse.json({ 
          authenticated: true, 
          admin: adminData,
          type: 'admin'
        })
      } catch (error) {
        console.error("Error parsing admin cookie:", error)
      }
    }

    // Check for Chronicles/Supabase session (for creator pages)
    const supabase = await createSupabaseServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json({ 
        authenticated: false, 
        admin: null,
        creator: null,
        type: null 
      })
    }

    // Get creator profile
    const { data: creator } = await supabase
      .from('chronicles_creators')
      .select('id, pen_name, email, profile_image_url, is_verified')
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({ 
      authenticated: true, 
      admin: null,
      creator,
      type: 'creator'
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ 
      authenticated: false, 
      admin: null,
      creator: null,
      type: null,
      error: 'Session check failed'
    }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest) {
  const response = NextResponse.json({ success: true })
  // Clear admin cookies
  response.cookies.set("whispr-admin-auth", "", { maxAge: 0, path: "/" })
  response.cookies.set("whispr-admin-data", "", { maxAge: 0, path: "/" })
  // Clear Supabase cookies
  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')
  return response
}
