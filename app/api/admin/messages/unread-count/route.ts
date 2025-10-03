import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const session = await getAdminFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createSupabaseServer()
  try {
    // Try to fetch participant rows. If last_read_at doesn't exist yet in the schema
    // fall back to joined_at. We'll compute unread counts by fetching relevant messages
    // in a single query and comparing timestamps client-side.
    let partsRes = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('admin_id', session.admin.id)

    let parts = partsRes.data

    if (partsRes.error) {
      // fallback: try joined_at if last_read_at column is not present
      console.warn('conversation_participants missing last_read_at or other error, falling back to joined_at:', partsRes.error.message)
      const fallback = await supabase
        .from('conversation_participants')
        .select('conversation_id, joined_at')
        .eq('admin_id', session.admin.id)

      if (fallback.error) {
        console.error('Failed to fetch conversation_participants for unread count:', fallback.error)
        return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
      }

      // normalize shape so we always have last_read_at
      parts = (fallback.data || []).map((r: any) => ({ conversation_id: r.conversation_id, last_read_at: r.joined_at }))
    }

    const ids = (parts || []).map((p:any) => p.conversation_id).filter(Boolean)
    if (!ids.length) return NextResponse.json({ count: 0 })

    // determine earliest last_read to reduce fetched rows
    const lastReads = (parts || []).map((p:any) => new Date(p.last_read_at || 0))
    const minLastRead = new Date(Math.min(...lastReads.map(d => d.getTime())))

    // fetch messages in these conversations newer than the earliest last_read
    const { data: msgs, error: mErr } = await supabase
      .from('messages')
      .select('id, created_at, admin_id, conversation_id')
      .in('conversation_id', ids)
      .gt('created_at', minLastRead.toISOString())
      .neq('admin_id', session.admin.id)
      .limit(10000)

    if (mErr) {
      console.error('Failed to fetch messages for unread count:', mErr)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // count messages that are newer than the participant's last_read_at for that conversation
    const byConv = new Map<string, number>()
    const lastReadMap = new Map((parts || []).map((p:any) => [p.conversation_id, new Date(p.last_read_at || 0)]))

    for (const m of msgs || []) {
      const convId = (m as any).conversation_id
      const created = new Date((m as any).created_at)
      const lastReadForConv = lastReadMap.get(convId) || new Date(0)
      if (created.getTime() > lastReadForConv.getTime()) {
        byConv.set(convId, (byConv.get(convId) || 0) + 1)
      }
    }

    let total = 0
    for (const v of byConv.values()) total += v

    return NextResponse.json({ count: total })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal' }, { status: 500 })
  }
}
