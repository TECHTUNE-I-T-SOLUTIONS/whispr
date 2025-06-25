import type { NextRequest } from "next/server"
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
    return null
  }
}

export async function requireAuthFromRequest(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) {
    throw new Error("Authentication required")
  }
  return session
}
