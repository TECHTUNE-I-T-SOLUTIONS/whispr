import type { NextRequest } from "next/server"

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
