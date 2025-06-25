import { type NextRequest, NextResponse } from "next/server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)

    // Mock notifications data (in a real app, you'd have a notifications table)
    const mockNotifications = [
      {
        id: "1",
        type: "comment",
        title: "New comment on your post",
        message: "Someone commented on 'The Art of Silent Expression'",
        read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        id: "2",
        type: "reaction",
        title: "Your poem received reactions",
        message: "5 people loved 'Whispers in the Wind'",
        read: false,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      },
      {
        id: "3",
        type: "milestone",
        title: "Milestone reached!",
        message: "Your blog has reached 1,000 total views",
        read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        id: "4",
        type: "system",
        title: "Welcome to Whispr Admin",
        message: "Your admin account has been successfully set up",
        read: true,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      },
    ]

    return NextResponse.json(mockNotifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
