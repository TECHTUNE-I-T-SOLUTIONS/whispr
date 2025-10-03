import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, page_url, name, email, metadata, user_agent } = body || {}

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message is required' }, { status: 400 })
    }

    const supabase = createSupabaseServer()
    const { data, error } = await supabase.from('feedback').insert([{ message, page_url, name: name || null, email: email || null, metadata: metadata || null, user_agent: user_agent || null }]).select('*').single()

    if (error) {
      console.error('Feedback insert error', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, feedback: data })
  } catch (e) {
    console.error('Feedback route error', e)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
