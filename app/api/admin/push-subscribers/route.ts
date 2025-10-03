import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()

    // Query push_subscriptions with defensive error handling
    let subscribers = null
    try {
      const res = await supabase
        .from('push_subscriptions')
        .select('*')
        .order('subscribed_at', { ascending: false })

      if (res.error) {
        console.error('Supabase error fetching subscribers:', res.error)
        return NextResponse.json({ error: res.error.message || 'Failed to fetch subscribers from DB' }, { status: 500 })
      }

      subscribers = res.data || []
    } catch (e: any) {
      // This may surface undici/fetch failures
      console.error('Unexpected error querying push_subscriptions:', e)
      return NextResponse.json({ error: e?.message || 'Unexpected server error' }, { status: 500 })
    }

    return NextResponse.json({ subscribers, total: subscribers.length })

  } catch (error) {
  console.error('Unhandled error in push subscribers API:', error)
  return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 })
  }
}
