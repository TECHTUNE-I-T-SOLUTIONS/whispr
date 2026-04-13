import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer()

    // Get error statistics
    const { data: stats, error: statsError } = await supabase
      .from('error_stats')
      .select('*')

    if (statsError) {
      throw statsError
    }

    // Get total error count
    const { count: totalErrors } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })

    // Get unresolved error count
    const { count: unresolvedErrors } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false)

    // Get unique error count (24hrs)
    const { data: uniqueErrors } = await supabase
      .from('error_logs')
      .select('error_hash', { count: 'exact' })
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Get errors by source
    const { data: errorsBySource } = await supabase
      .from('error_logs')
      .select('source')
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const sourceCount: Record<string, number> = {}
    errorsBySource?.forEach((err: any) => {
      sourceCount[err.source] = (sourceCount[err.source] || 0) + 1
    })

    return NextResponse.json({
      summary: {
        totalErrors,
        unresolvedErrors,
        unique24h: uniqueErrors?.length || 0,
      },
      bySource: sourceCount,
      timeline: stats,
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error statistics' },
      { status: 500 }
    )
  }
}
