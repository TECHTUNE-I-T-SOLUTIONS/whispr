import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createSupabaseServer()

    // fetch conversation ids where the admin is a participant
    const idsRes = await supabase.from('conversation_participants').select('conversation_id').eq('admin_id', session.admin.id)
    const ids = (idsRes.data || []).map((r: any) => r.conversation_id)

    // fetch conversations by ids (if any) and also include conversations created by the admin
    let conversations: any[] = []
    const convIds = ids || []

    // fetch conversations where admin is participant or created_by admin
    const queries: any[] = []
    if (convIds.length > 0) queries.push(supabase.from('conversations').select('id, title, is_direct, created_by, created_at').in('id', convIds))
    queries.push(supabase.from('conversations').select('id, title, is_direct, created_by, created_at').eq('created_by', session.admin.id))

    // run queries sequentially and merge unique
    const allConvs: any[] = []
    for (const q of queries) {
      const { data, error } = await q
      if (error) continue
      (data || []).forEach((c: any) => {
        if (!allConvs.find((x) => x.id === c.id)) allConvs.push(c)
      })
    }

    // order by created_at desc
    allConvs.sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))

    if (allConvs.length > 0) {
      const idsList = allConvs.map((c) => c.id)

      // batch fetch participants with nested admin data
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, admin_id, joined_at, last_read_at, admin:admin_id(id, full_name, username, avatar_url)')
        .in('conversation_id', idsList)

      // group participants by conversation
      const partsByConv: Record<string, any[]> = {}
      ;(parts || []).forEach((p: any) => {
        partsByConv[p.conversation_id] = partsByConv[p.conversation_id] || []
        partsByConv[p.conversation_id].push(p)
      })

      // batch fetch recent messages and pick latest per conversation
      const { data: msgs } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', idsList)
        .order('created_at', { ascending: false })

      const latestByConv: Record<string, any> = {}
      ;(msgs || []).forEach((m: any) => {
        if (!latestByConv[m.conversation_id]) latestByConv[m.conversation_id] = m
      })

      conversations = allConvs.map((c: any) => ({
        ...c,
        participants: partsByConv[c.id] || [],
        last_message_preview: latestByConv[c.id]?.content || null,
        last_message_at: latestByConv[c.id]?.created_at || null
      }))
    }

    return NextResponse.json({ conversations })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, participantIds = [], is_direct = false } = body

    const supabase = createSupabaseServer()

    const { data, error } = await supabase
      .from('conversations')
      .insert({ title, is_direct, created_by: session.admin.id })
  .select()
  .single()

    if (error || !data) return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })

  // add participants (dedupe and include creator). Validate insert and rollback if it fails.
  try {
    const idsToInsert = Array.from(new Set([...(participantIds || []), session.admin.id]))
    const participants = idsToInsert.map((id: string) => ({ conversation_id: data.id, admin_id: id }))

    const { data: partsData, error: partsError } = await supabase.from('conversation_participants').insert(participants).select()
    if (partsError) {
      // cleanup the created conversation to avoid orphaned conversations
      try {
        await supabase.from('conversations').delete().eq('id', data.id)
      } catch (cleanupErr) {
        console.error('Failed to cleanup conversation after participant insert failure', cleanupErr)
      }
      console.error('Failed to insert participants:', partsError)
      return NextResponse.json({ error: 'Failed to save participants' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, conversation: data, participants: partsData })
  } catch (e) {
    console.error('Unexpected error inserting participants', e)
    try {
      await supabase.from('conversations').delete().eq('id', data.id)
    } catch (_) {}
    return NextResponse.json({ error: 'Failed to save participants' }, { status: 500 })
  }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuthFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, title } = body
    if (!id) return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 })

    const supabase = createSupabaseServer()

    // ensure admin is allowed to edit (creator only)
    const { data: conv } = await supabase.from('conversations').select('created_by').eq('id', id).single()
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (conv.created_by !== session.admin.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase.from('conversations').update({ title }).eq('id', id).select().single()
    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    // Broadcast update so other realtime clients can refresh their conversation lists
    try {
      const ch = supabase.channel('public:conversations')
      await ch.send({ type: 'broadcast', event: 'conversation:updated', payload: data })
    } catch (bErr) {
      console.error('Failed to broadcast conversation update', bErr)
    }

    return NextResponse.json({ conversation: data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuthFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 })

    const supabase = createSupabaseServer()

    // ensure admin is allowed to delete (creator only)
    const { data: conv } = await supabase.from('conversations').select('created_by').eq('id', id).single()
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (conv.created_by !== session.admin.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // delete messages, participants, and the conversation within a transaction if supported
    // supabase-js doesn't support multi-statement transactions simply here, but perform deletions sequentially
    await supabase.from('messages').delete().eq('conversation_id', id)
    await supabase.from('conversation_participants').delete().eq('conversation_id', id)
    const { error } = await supabase.from('conversations').delete().eq('id', id)
    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
