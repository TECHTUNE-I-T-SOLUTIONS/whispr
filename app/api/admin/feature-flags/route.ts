import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();

    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_name');

    if (error) throw error;

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Failed to fetch feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flag_name, enabled } = body;

    if (!flag_name) {
      return NextResponse.json(
        { error: 'flag_name is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServer();

    const { data, error } = await supabase
      .from('feature_flags')
      .update({ 
        enabled,
        updated_at: new Date().toISOString()
      })
      .eq('flag_name', flag_name)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ flag: data });
  } catch (error) {
    console.error('Failed to update feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}
