import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// GET creator profile
export async function GET(req: NextRequest) {
  try {
    let supabase;

    // Check for Authorization header (for mobile app)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      // Fallback to cookie-based auth for web
      supabase = await createSupabaseServerClient();
    }

    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: creator, error } = await supabase
      .from('chronicles_creators')
      .select('*')
      .eq('user_id', user.id)
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
    let supabase;

    // Check for Authorization header (for mobile app)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      // Fallback to cookie-based auth for web
      supabase = await createSupabaseServerClient();
    }

    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();

    const { data: creator, error } = await supabase
      .from('chronicles_creators')
      .update(updates)
      .eq('user_id', user.id)
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
