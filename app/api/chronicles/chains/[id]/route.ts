import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

// GET details or POST new entry
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data, error } = await supabase
      .from('chronicles_writing_chains')
      .select(`
        *,
        entries:chronicles_chain_entries(*, post:chronicles_posts(id,title,slug,excerpt,published_at))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Chain detail error', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch chain' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const body = await request.json();
    const { post_id } = body;

    // require authenticated creator
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (creatorError || !creator) {
      return NextResponse.json({ success: false, error: 'Creator record missing' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('chronicles_chain_entries')
      .insert({ chain_id: id, post_id, added_by: creator.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Chain entry error', err);
    return NextResponse.json({ success: false, error: 'Failed to add entry' }, { status: 500 });
  }
}
