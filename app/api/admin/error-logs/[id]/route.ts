import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAuthFromRequest } from '@/lib/auth-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { admin } = await requireAuthFromRequest(request as any)
    const supabase = createSupabaseServer()
    const { id } = await params

    // Get single error
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching error log:', error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch error log' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { admin } = await requireAuthFromRequest(request as any)
    const supabase = createSupabaseServer()
    const body = await request.json()
    const { id } = await params

    // Update error log
    const { data, error } = await supabase
      .from('error_logs')
      .update({
        resolved: body.resolved || false,
        resolved_at: body.resolved ? new Date().toISOString() : null,
        resolved_by: body.resolved ? admin.id : null,
        notes: body.notes || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log(`✅ Error ${id} marked as ${body.resolved ? 'resolved' : 'unresolved'}`)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating error log:', error)
    return NextResponse.json(
      { error: 'Failed to update error log' },
      { status: 500 }
    )
  }
}