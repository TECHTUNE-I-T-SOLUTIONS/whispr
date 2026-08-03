import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { searchImages } from "@/lib/services/video-studio"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const limit = Math.min(Number(searchParams.get("limit") || 12), 24)
    const images = await searchImages(q, limit)
    return NextResponse.json({ ok: true, images })
  } catch (e: any) {
    if (e?.message === "Authentication required") {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 })
    }
    console.error("ai-studio images error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
