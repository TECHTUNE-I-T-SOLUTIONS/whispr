import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getAdminFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const conversationId = url.searchParams.get('conversation_id')
    if (!conversationId) return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 })

    const supabase = createSupabaseServer()

    // ensure participant
    const part = await supabase.from('conversation_participants').select('*').eq('conversation_id', conversationId).eq('admin_id', session.admin.id).single()
    if (part.error || !part.data) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // support incremental fetches using an optional `since` ISO timestamp
    const since = url.searchParams.get('since')

    let query = supabase
      .from('messages')
      .select(`*, attachments:message_attachments(*), admin:admin_id(id, full_name, username, avatar_url)`)
      .eq('conversation_id', conversationId)

    if (since) {
      // fetch messages created strictly after the provided timestamp
      query = query.gt('created_at', since)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })

    return NextResponse.json({ messages: data || [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
    const { conversation_id, content, attachments = [], references = null, tags = [] } = body
    if (!conversation_id) return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 })

    const supabase = createSupabaseServer()

    // ensure participant
    const part = await supabase.from('conversation_participants').select('*').eq('conversation_id', conversation_id).eq('admin_id', session.admin.id).single()
    if (part.error || !part.data) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase.from('messages').insert({
      conversation_id,
      admin_id: session.admin.id,
      content,
      references_json: references ? references : null,
      tags
    }).select('*, attachments:message_attachments(*), admin:admin_id(id, full_name, username, avatar_url)').single()

    if (error || !data) {
      console.error('Failed to insert message:', error)
      return NextResponse.json({ error: 'Failed to send message', details: error }, { status: 500 })
    }

  // attachments array of { media_file_id?, file_url, file_type, file_size }
  let messageRow: any = data
  if (attachments.length) {
      const attachRows = attachments.map((a: any) => ({ message_id: data.id, media_file_id: a.media_file_id || null, file_url: a.file_url || null, file_type: a.file_type || null, file_size: a.file_size || null }))
      const { error: attachError } = await supabase.from('message_attachments').insert(attachRows)
      if (attachError) {
        console.error('Failed to insert attachments:', attachError)
        return NextResponse.json({ error: 'Failed to save attachments', details: attachError }, { status: 500 })
      }
      // re-select the message with attachments and admin nested (in case attachments were just inserted)
      const { data: refreshed } = await supabase
        .from('messages')
        .select('*, attachments:message_attachments(*), admin:admin_id(id, full_name, username, avatar_url)')
        .eq('id', data.id)
        .single()
      messageRow = refreshed || data
    }

    // Fire-and-forget: send admin-targeted push notifications for other participants
    const adminId = session!.admin.id
    const senderName = session!.admin?.full_name || session!.admin?.username || 'Admin'
    ;(async () => {
      try {
        const participantRes = await supabase
          .from('conversation_participants')
          .select('admin_id')
          .eq('conversation_id', conversation_id)

        const participantIds = (participantRes.data || []).map((p: any) => p.admin_id).filter((id: string) => id)
        const recipientIds = participantIds.filter((id: string) => id && id !== adminId)
        if (!recipientIds.length) return

        // fetch push subscriptions for those admin ids (only subscriptions linked to user_id)
        const { data: subs, error: subsErr } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', recipientIds)
          .eq('is_active', true)
          .not('user_id', 'is', null)
          // Exclude placeholder anonymous IDs used for regular users
          .neq('user_id', '00000000-0000-0000-0000-000000000000')

        if (subsErr) {
          console.error('Error fetching admin push subscriptions:', subsErr)
          return
        }
        if (!subs || !subs.length) return

        console.info(`admin message: will send push to ${subs.length} admin subscriptions`)

        const webpush = (await import('web-push')).default
  // Use main VAPID keys to match subscriptions created for regular users
  const vapidPublic = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_REALTIME_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY || process.env.NEXT_PUBLIC_VAPID_REALTIME_PRIVATE_KEY
  const vapidSubject = (process.env.VAPID_SUBJECT || process.env.NEXT_PUBLIC_VAPID_REALTIME_SUBJECT || 'mailto:admin@whispr.com') as string
        if (!vapidPublic || !vapidPrivate) return

        webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

        const payload = JSON.stringify({
          title: `New message from ${senderName}`,
          body: (messageRow.content || '').slice(0, 180),
          url: `/admin/messages?conversation_id=${conversation_id}`,
          type: 'general',
          actions: [
            { action: 'open', title: 'Open', icon: '/logotype.png' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        })

        await Promise.allSettled(subs.map(async (s: any) => {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any, payload)
          } catch (e) {
            // ignore per-subscriber failures
          }
        }))
      } catch (notifyErr) {
        console.error('Failed to send admin push notifications', notifyErr)
      }
    })()

    // helper: publish broadcast with small retries
    const publishWithRetries = async (channelName: string, payload: any, attempts = 3) => {
      for (let i = 0; i < attempts; i++) {
        try {
          // use channel publish (server client)
          try {
            await supabase.channel(channelName).send({ type: 'broadcast', event: 'message', payload })
            return true
          } catch (sendErr) {
            // try realtime.publish if available
            try {
              // @ts-ignore
              await supabase.realtime?.publish?.(channelName, { type: 'broadcast', event: 'message', payload })
              return true
            } catch (_) {
              // continue to retry
            }
          }
        } catch (e) {
          // continue
        }
        // backoff
        await new Promise((r) => setTimeout(r, 200 * Math.pow(2, i)))
      }
      return false
    }

    // update conversation last_message_preview and last_message_at
    try {
      const preview = (messageRow.content && String(messageRow.content).slice(0, 500)) || (attachments && attachments.length ? '[Attachment]' : null)
      const { data: convData } = await supabase
        .from('conversations')
        .update({ last_message_preview: preview, last_message_at: messageRow.created_at })
        .eq('id', conversation_id)
        .select('id, title, is_direct, created_by, created_at, last_message_preview, last_message_at')
        .single()

      // server-side broadcast fallback: publish to the per-conversation channel so realtime clients receive it
      try {
        const channelName = `public:messages:conversation=${conversation_id}`
        await publishWithRetries(channelName, messageRow, 4)
      } catch (bErr) {
        // ignore
      }

      // Also broadcast a conversation update so conversation lists update immediately across clients
      try {
        const convCh = supabase.channel('public:conversations')
        await convCh.send({ type: 'broadcast', event: 'conversation:updated', payload: convData })
      } catch (bErr) {
        console.error('Failed to broadcast conversation update on public:conversations', bErr)
        // fallback: try using publishWithRetries in case channel send fails
        try { await publishWithRetries('public:conversations', convData, 4) } catch (_) {}
      }

      return NextResponse.json({ message: messageRow, conversation: convData || null })
    } catch (e) {
      // if updating conversation fails, still return message
      console.error('Failed to update conversation preview', e)
      return NextResponse.json({ message: messageRow })
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
