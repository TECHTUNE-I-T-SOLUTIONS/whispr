import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { generateVideoPlan } from "@/lib/services/video-studio"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    await requireAuth()
    const body = await req.json()
    const { title, content, contentType, authorName, postUrl, targetSeconds } = body || {}

    if (!content || typeof content !== "string" || content.trim().length < 20) {
      return NextResponse.json({ ok: false, error: "Content must be at least 20 characters." }, { status: 400 })
    }

    const plan = await generateVideoPlan({ title, content, contentType, authorName, postUrl, targetSeconds })
    return NextResponse.json({ ok: true, plan })
  } catch (e: any) {
    if (e?.message === "Authentication required") {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 })
    }
    console.error("ai-studio video-plan error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
