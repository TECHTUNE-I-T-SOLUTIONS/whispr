import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const url = new URL(request.url)

    // Get query parameters
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const resolved = url.searchParams.get('resolved')
    const source = url.searchParams.get('source')
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    // Build query
    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' })

    // Apply filters
    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true')
    }

    if (source) {
      query = query.eq('source', source)
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: errors, count, error } = await query

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      errors,
      total: count,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0),
    })
  } catch (error) {
    console.error('Error fetching error logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    )
  }
}
