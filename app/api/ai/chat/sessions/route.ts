import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(
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

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Auth verification failed:', userError);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const creatorQuery = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    const creatorId = creatorQuery.data?.id;

    // If user doesn't have a creator record yet, return empty list
    if (!creatorId) {
      console.warn(`User ${userData.user.id} has no creator record yet`);
      return NextResponse.json({ success: true, data: [] });
    }

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseService
      .from('ai_chat_sessions')
      .select('id, title, mode, output_type, chain_id, status, creator_id, created_at, updated_at')
      .eq('creator_id', creatorId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('AI sessions list error', error);
      return NextResponse.json({ success: false, error: 'Failed to list sessions' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('AI sessions GET error', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
