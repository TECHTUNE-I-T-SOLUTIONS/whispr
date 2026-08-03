import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { fetchImageBytes } from "@/lib/services/video-studio"

export const dynamic = "force-dynamic"

// Streams a remote image through our own origin. Without this, drawing a
// cross-origin image onto the canvas taints it and MediaRecorder export fails.
// Only allow a small allowlist of hosts to avoid becoming an open proxy.
const ALLOWED_HOSTS = [
  "picsum.photos",
  "fastly.picsum.photos",
  "i.picsum.photos",
  "openverse.org",
  "api.openverse.org",
  // common Openverse upstream hosts
  "upload.wikimedia.org",
  "live.staticflickr.com",
  "farm1.staticflickr.com",
  "images.unsplash.com",
  "images.pexels.com",
  "cdn.stocksnap.io",
]

function hostAllowed(host: string): boolean {
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
}

export async function GET(req: Request) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const target = searchParams.get("url")
    if (!target) return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 })

    let parsed: URL
    try {
      parsed = new URL(target)
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid url" }, { status: 400 })
    }
    if (parsed.protocol !== "https:" || !hostAllowed(parsed.hostname)) {
      return NextResponse.json({ ok: false, error: "Host not allowed" }, { status: 403 })
    }

    const { bytes, contentType } = await fetchImageBytes(parsed.toString())
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (e: any) {
    if (e?.message === "Authentication required") {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 })
    }
    console.error("ai-studio image-proxy error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
