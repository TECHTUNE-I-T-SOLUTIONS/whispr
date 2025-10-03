import type { NextRequest } from "next/server"
<<<<<<< HEAD
import { createSupabaseServer } from "@/lib/supabase-server"

export async function getSessionFromRequest(request: NextRequest) {
  try {
    // Get session token from request cookies
    const sessionToken = request.cookies.get("whispr-admin-session")?.value

    if (!sessionToken) {
      console.log("No session token found in request")
      return null
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

    if (error) {
      console.error("Session query error:", error)
      return null
    }

    if (!session || !session.admin?.is_active) {
      console.log("Invalid session or inactive admin")
      return null
    }

    // Update last accessed
    await supabase
      .from("admin_sessions")
      .update({ last_accessed: new Date().toISOString() })
      .eq("session_token", sessionToken)

    return { admin: session.admin }
  } catch (error) {
    console.error("Session check error:", error)
=======

export async function getAdminFromRequest(request: NextRequest) {
  try {
    const isAuthenticated = request.cookies.get("whispr-admin-auth")?.value === "true"
    const adminDataCookie = request.cookies.get("whispr-admin-data")?.value

    if (!isAuthenticated || !adminDataCookie) {
      return null
    }

    try {
      const decoded = decodeURIComponent(adminDataCookie)
      const adminData = JSON.parse(decoded)

      if (!adminData.is_active) {
        return null
      }

      return { admin: adminData }
    } catch (parseError) {
      console.error("Error parsing admin data from cookie:", parseError)
      return null
    }
  } catch (error) {
    console.error("Auth check error:", error)
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    return null
  }
}

export async function requireAuthFromRequest(request: NextRequest) {
<<<<<<< HEAD
  const session = await getSessionFromRequest(request)
=======
  const session = await getAdminFromRequest(request)
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
  if (!session) {
    throw new Error("Authentication required")
  }
  return session
}
