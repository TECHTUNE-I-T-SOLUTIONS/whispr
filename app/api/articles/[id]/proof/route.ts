import { type NextRequest, NextResponse } from "next/server"
import { CopyrightService } from "@/lib/services/copyright.service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const articleId = id

    // Generate article proof
    const proof = await CopyrightService.generateArticleProof(articleId)

    if (!proof) {
      return NextResponse.json(
        { error: "Article not found or not published" },
        { status: 404 }
      )
    }

    return NextResponse.json(proof)
  } catch (error) {
    console.error("Error generating article proof:", error)
    return NextResponse.json(
      { error: "Failed to generate article proof" },
      { status: 500 }
    )
  }
}
