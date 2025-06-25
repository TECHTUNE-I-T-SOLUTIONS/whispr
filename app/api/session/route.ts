import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Check if admin is authenticated
    const isAuthenticated = cookieStore.get("whispr-admin-auth")?.value === "true"
    const adminDataCookie = cookieStore.get("whispr-admin-data")?.value

    if (!isAuthenticated || !adminDataCookie) {
      return NextResponse.json({ authenticated: false, admin: null })
    }

    try {
      const adminData = JSON.parse(adminDataCookie)

      return NextResponse.json({
        authenticated: true,
        admin: adminData,
      })
    } catch (parseError) {
      console.error("Error parsing admin data from cookie:", parseError)
      // Clear invalid cookies
      cookieStore.delete("whispr-admin-auth")
      cookieStore.delete("whispr-admin-data")
      return NextResponse.json({ authenticated: false, admin: null })
    }
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ authenticated: false, admin: null })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Clear all admin cookies
    cookieStore.delete("whispr-admin-auth")
    cookieStore.delete("whispr-admin-data")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
