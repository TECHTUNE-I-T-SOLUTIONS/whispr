import { type NextRequest, NextResponse } from "next/server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function PUT(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const settings = await request.json()

    // In a real app, you'd save these settings to the database
    console.log("Updating admin settings:", settings)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
