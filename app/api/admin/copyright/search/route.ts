import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 }
      )
    }

    // Search by article_id (from metadata) or sha256_hash
    const { data: fingerprints, error } = await supabase
      .from('content_fingerprints')
      .select('*')
      .or(`sha256_hash.ilike.%${query}%,metadata->>article_id.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ fingerprints })
  } catch (error) {
    console.error("Error searching fingerprints:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
