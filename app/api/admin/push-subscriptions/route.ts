import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createSupabaseServer()
    const { data, error } = await supabase.from('push_subscriptions').select('*').order('created_at', { ascending: false }).limit(200)
    if (error) return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })

    return NextResponse.json({ subscriptions: data || [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
