import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { synthesizeSpeech } from "@/lib/services/video-studio"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    await requireAuth()
    const { text, voice } = (await req.json()) || {}
    if (!text || typeof text !== "string") {
      return NextResponse.json({ ok: false, error: "Text is required." }, { status: 400 })
    }
    const { base64, mimeType } = await synthesizeSpeech({ text, voice })
    return NextResponse.json({ ok: true, audio: `data:${mimeType};base64,${base64}`, mimeType })
  } catch (e: any) {
    if (e?.message === "Authentication required") {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 })
    }
    console.error("ai-studio tts error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
