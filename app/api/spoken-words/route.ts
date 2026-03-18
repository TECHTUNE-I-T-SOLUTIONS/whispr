import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const offset = (page - 1) * limit

    let query = supabase
      .from("spoken_words")
      .select(`
        *,
        media_file:media (
          id,
          original_name,
          file_name,
          file_path,
          file_url,
          file_type,
          file_size
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: spokenWords, error, count } = await query

    if (error) {
      console.error("Error fetching spoken words:", error)
      return NextResponse.json({ error: "Failed to fetch spoken words" }, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    return NextResponse.json({
      spokenWords: spokenWords || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (spokenWords?.length || 0) === limit
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error("Error in GET /api/spoken-words:", error)
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }
}
