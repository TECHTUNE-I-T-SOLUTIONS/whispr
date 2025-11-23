import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();

    // Get the feature enabled setting
    const { data, error } = await supabase
      .from('chronicles_settings')
      .select('setting_value')
      .eq('setting_key', 'feature_enabled')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const featureEnabled = data?.setting_value === 'true';

    return NextResponse.json({ featureEnabled });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: adminData } = await supabase
      .from('admin')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }

    const { setting_key, setting_value } = await req.json();

    // Update setting
    const { data, error } = await supabase
      .from('chronicles_settings')
      .upsert({
        setting_key,
        setting_value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
