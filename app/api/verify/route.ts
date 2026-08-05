import { type NextRequest, NextResponse } from "next/server"
import { CopyrightService } from "@/lib/services/copyright.service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const identifier = searchParams.get('id') || searchParams.get('hash')

    if (!identifier) {
      return NextResponse.json(
        { error: "Missing identifier parameter. Provide 'id' or 'hash'." },
        { status: 400 }
      )
    }

    // Verify content
    const result = await CopyrightService.verifyContent(identifier)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error verifying content:", error)
    return NextResponse.json(
      { error: "Failed to verify content" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier } = body

    if (!identifier) {
      return NextResponse.json(
        { error: "Missing identifier in request body" },
        { status: 400 }
      )
    }

    // Verify content
    const result = await CopyrightService.verifyContent(identifier)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error verifying content:", error)
    return NextResponse.json(
      { error: "Failed to verify content" },
      { status: 500 }
    )
  }
}
