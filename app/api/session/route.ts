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
