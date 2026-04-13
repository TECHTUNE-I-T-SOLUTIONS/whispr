import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer()

    // Get single error
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching error log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error log' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer()
    const body = await request.json()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: admin } = await supabase
      .from('admin')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Update error log
    const { data, error } = await supabase
      .from('error_logs')
      .update({
        resolved: body.resolved || false,
        resolved_at: body.resolved ? new Date().toISOString() : null,
        resolved_by: body.resolved ? session.user.id : null,
        notes: body.notes || null,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log(`✅ Error ${params.id} marked as ${body.resolved ? 'resolved' : 'unresolved'}`)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating error log:', error)
    return NextResponse.json(
      { error: 'Failed to update error log' },
      { status: 500 }
    )
  }
}
