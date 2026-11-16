import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Resolves the Supabase user from an `Authorization: Bearer <access_token>`
 * header. This is the auth path for the Flutter app and any other non-browser
 * client — those cannot carry the admin cookies that getAdminFromRequest reads.
 *
 * Returns null for a missing, malformed or expired token. Never throws, so
 * routes can treat null as "not signed in" without a try/catch.
 */
export async function getUserFromBearer(request: NextRequest) {
  const header = request.headers.get("authorization")
  if (!header || !header.startsWith("Bearer ")) return null

  const token = header.substring(7).trim()
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  try {
    // Built with the anon key plus the caller's token: getUser() validates the
    // JWT against Supabase, it does not trust the token's contents.
    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data, error } = await client.auth.getUser()
    if (error || !data.user) return null
    return data.user
  } catch (error) {
    console.error("Bearer auth check error:", error)
    return null
  }
}

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
    return null
  }
}

export async function requireAuthFromRequest(request: NextRequest) {
  const session = await getAdminFromRequest(request)
  if (!session) {
    throw new Error("Authentication required")
  }
  return session
}
