import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { listStudioContent, type ContentCategory, type ListContentInput } from "@/lib/services/video-studio"

export const dynamic = "force-dynamic"

const VALID_CATEGORIES: ContentCategory[] = ["admin_poem", "admin_blog", "story", "story_chapter", "chronicles_post"]

export async function GET(req: Request) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const rawCat = searchParams.get("category") || "all"
    const category = (VALID_CATEGORIES as string[]).includes(rawCat)
      ? (rawCat as ContentCategory)
      : "all"
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 40), 1), 100)

    const params: ListContentInput = { query: q, category, limit }
    const items = await listStudioContent(params)
    return NextResponse.json({ ok: true, items })
  } catch (e: any) {
    if (e?.message === "Authentication required") {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 })
    }
    console.error("ai-studio content error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
