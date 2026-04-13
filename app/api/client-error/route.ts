import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { message, stack, url, userAgent, ts, source } = body

    console.error('Client-side error reported:', JSON.stringify(body))

    // Initialize Supabase client
    const supabase = await createSupabaseServer()

    // Extract useful information
    const nextVersion = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown'
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'unknown'
    const sessionId = req.headers.get('x-session-id') || undefined
    
    // Get current session user (if authenticated)
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // Insert error log using the upsert function
    const { data, error } = await supabase.rpc('upsert_error_log', {
      p_message: message || 'Unknown error',
      p_stack: stack || '',
      p_url: url || '',
      p_user_agent: userAgent || '',
      p_source: source || 'unknown',
      p_timestamp: ts || Date.now(),
      p_next_version: nextVersion,
      p_build_id: buildId,
      p_session_id: sessionId,
      p_user_id: userId,
    })

    if (error) {
      console.error('Failed to insert error log:', error)
      // Don't fail the response - just log it
      return NextResponse.json({ 
        ok: true,
        warning: 'Error logged but database insertion failed'
      })
    }

    console.log('✅ Error logged with ID:', data)

    return NextResponse.json({ 
      ok: true,
      errorId: data
    })
  } catch (err) {
    console.error('Failed to record client error', err)
    // Still return 200 to prevent error loops in production
    return NextResponse.json({ 
      ok: true,
      error: 'Failed to process error log'
    })
  }
}
