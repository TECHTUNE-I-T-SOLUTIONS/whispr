import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()

    const { data: sysRow, error: sysErr } = await supabase
      .from('chronicles_system_settings')
      .select('maintenance_mode')
      .limit(1)
      .maybeSingle()

    if (sysErr) console.error('Error fetching system settings:', sysErr)

    const { data: kvData, error: kvErr } = await supabase
      .from('chronicles_settings')
      .select('setting_key, setting_value')
      .eq('setting_key', 'maintenance_message')
      .limit(1)
      .maybeSingle()

    if (kvErr) console.error('Error fetching maintenance message:', kvErr)

    return NextResponse.json({
      maintenance_mode: !!sysRow?.maintenance_mode,
      maintenance_message: kvData?.setting_value ?? null,
    })
  } catch (err) {
    console.error('Maintenance API error:', err)
    return NextResponse.json({ maintenance_mode: false, maintenance_message: null })
  }
}
