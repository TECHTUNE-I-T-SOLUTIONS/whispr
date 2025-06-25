import { type NextRequest, NextResponse } from "next/server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    // Mock settings (in a real app, you'd store this in the database)
    const mockSettings = {
      emailNotifications: true,
      commentNotifications: true,
      reactionNotifications: true,
      milestoneNotifications: true,
      systemNotifications: true,
    }

    return NextResponse.json(mockSettings)
  } catch (error) {
    console.error("Error fetching notification settings:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const settings = await request.json()

    // In a real app, you'd save these settings to the database
    console.log("Updating notification settings:", settings)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notification settings:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
