import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url, source = 'web', utm, user_agent } = body || {}
    const supabase = createSupabaseServer()

    // Insert into shares table (id, url, source, utm, user_agent, created_at)
    const { data, error } = await supabase.from('shares').insert([{ url, source, utm: utm || null, user_agent: user_agent || null }]).select().single()
    if (error) {
      console.error('Failed to record share', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, share: data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
