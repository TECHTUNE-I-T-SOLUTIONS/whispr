import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET creator profile
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: creator, error } = await supabase
      .from('chronicles_creators')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return NextResponse.json(creator);
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      { status: 400 }
    );
  }
}

// PUT update creator profile
export async function PUT(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const userId = req.headers.get('x-user-id');
    const updates = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: creator, error } = await supabase
      .from('chronicles_creators')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(creator);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 400 }
    );
  }
}
