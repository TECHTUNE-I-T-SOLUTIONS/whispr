import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = cookies() // ✅ removed await

  const isAuthenticated = (await cookieStore).get("whispr-admin-auth")?.value === "true"
  const adminDataCookie = (await cookieStore).get("whispr-admin-data")?.value

  if (!isAuthenticated || !adminDataCookie) {
    return NextResponse.json({ authenticated: false, admin: null })
  }

  try {
    const adminData = JSON.parse(adminDataCookie)
    return NextResponse.json({ authenticated: true, admin: adminData })
  } catch (parseError) {
    console.error("Error parsing admin data from cookie:", parseError)
    // Clear corrupted cookies
    ;(await
      // Clear corrupted cookies
      cookieStore).delete("whispr-admin-auth")
    ;(await cookieStore).delete("whispr-admin-data")
    return NextResponse.json({ authenticated: false, admin: null })
  }
}

export async function DELETE(request: NextRequest) {
  const cookieStore = cookies()
  ;(await cookieStore).delete("whispr-admin-auth")
  ;(await cookieStore).delete("whispr-admin-data")
  return NextResponse.json({ success: true })
}
