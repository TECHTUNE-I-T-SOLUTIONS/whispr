import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { email, password, pen_name, bio, content_type, categories, profile_picture_url } = await req.json();

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUpWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    // 2. Create creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .insert({
        user_id: authData.user!.id,
        email,
        pen_name,
        bio,
        content_type,
        categories,
        profile_picture_url,
        profile_visibility: 'public',
        push_notifications_enabled: false,
      })
      .select()
      .single();

    if (creatorError) throw creatorError;

    return NextResponse.json(creator, { status: 201 });
  } catch (error) {
    console.error('Creator signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed' },
      { status: 400 }
    );
  }
}

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
    console.error('Fetch creator error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch' },
      { status: 400 }
    );
  }
}

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
    console.error('Update creator error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 400 }
    );
  }
}
