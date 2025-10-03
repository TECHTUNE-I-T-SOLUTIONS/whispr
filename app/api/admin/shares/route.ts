import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAuthFromRequest } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()
    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '30d'
    const now = new Date()
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // total shares
    const totalRes = await supabase.from('shares').select('*', { count: 'exact', head: true })
    const totalShares = totalRes.count || 0

    // daily counts (simple JS aggregation)
    const { data: rows } = await supabase.from('shares').select('created_at, url, utm').gte('created_at', startDate.toISOString())
    const countsMap: Record<string, number> = {}
    ;(rows || []).forEach((r: any) => {
      const day = new Date(r.created_at).toISOString().split('T')[0]
      countsMap[day] = (countsMap[day] || 0) + 1
    })
    const daily = Object.entries(countsMap).map(([date, count]) => ({ date, count }))

    // top referrers / user agents - show most recent 50
    const { data: topReferrers } = await supabase.from('shares').select('utm, user_agent, created_at').order('created_at', { ascending: false }).limit(50)

    return NextResponse.json({ totalShares, daily, topReferrers: topReferrers || [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
