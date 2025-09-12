import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const session = await getAdminFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { conversation_id } = body
  if (!conversation_id) return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 })

  const supabase = createSupabaseServer()
  try {
    // First, get current last_read_at for this participant so we can compute how many
    // messages were unread for this conversation prior to marking it read.
    const partRes = await supabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', conversation_id)
      .eq('admin_id', session.admin.id)
      .limit(1)

    const prevLastRead = (partRes.data && partRes.data[0] && partRes.data[0].last_read_at) || null

    // count unread messages for this conversation (not sent by this admin)
    let unreadForConv = 0
    try {
      const q = supabase
        .from('messages')
        .select('id', { count: 'exact', head: false })
        .eq('conversation_id', conversation_id)
        .neq('admin_id', session.admin.id)

      if (prevLastRead) q.gt('created_at', prevLastRead)

      const cntRes = await q
      if (!cntRes.error) unreadForConv = cntRes.count || 0
    } catch (e) {
      // ignore counting errors
    }

    // Now update last_read_at
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversation_id)
      .eq('admin_id', session.admin.id)

    if (error) return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })

    // compute total unread messages for this admin across all conversations (best-effort)
    let totalUnread = 0
    try {
      const partsRes = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('admin_id', session.admin.id)

      const parts = partsRes.data || []
      const ids = (parts || []).map((p: any) => p.conversation_id).filter(Boolean)
      if (ids.length) {
        const lastReads = (parts || []).map((p: any) => new Date(p.last_read_at || 0))
        const minLastRead = new Date(Math.min(...lastReads.map((d: Date) => d.getTime())))

        const { data: msgs, error: mErr } = await supabase
          .from('messages')
          .select('id, created_at, conversation_id')
          .in('conversation_id', ids)
          .gt('created_at', minLastRead.toISOString())
          .neq('admin_id', session.admin.id)
          .limit(10000)

        if (!mErr) {
          const lastReadMap = new Map((parts || []).map((p: any) => [p.conversation_id, new Date(p.last_read_at || 0)]))
          const byConv = new Map<string, number>()
          for (const m of msgs || []) {
            const convId = (m as any).conversation_id
            const created = new Date((m as any).created_at)
            const lastReadForConv = lastReadMap.get(convId) || new Date(0)
            if (created.getTime() > lastReadForConv.getTime()) {
              byConv.set(convId, (byConv.get(convId) || 0) + 1)
            }
          }
          for (const v of byConv.values()) totalUnread += v
        }
      }
    } catch (e) {
      // ignore
    }

    // Broadcast both a per-conversation read event and a refreshed totals event
    try {
      const ch = supabase.channel('public:conversations')
      await ch.send({ type: 'broadcast', event: 'conversation:read', payload: { admin_id: session.admin.id, conversation_id, unread_for_conversation: unreadForConv } })
      await ch.send({ type: 'broadcast', event: 'conversations:refreshed', payload: { admin_id: session.admin.id, conversation_id, unread_count: totalUnread } })
    } catch (bErr) {
      console.error('Failed to broadcast conversation read/refresh', bErr)
    }

    return NextResponse.json({ ok: true, unread_count: totalUnread, unread_for_conversation: unreadForConv })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal' }, { status: 500 })
  }
}
