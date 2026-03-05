import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { searchParams } = request.nextUrl;
    const chainId = searchParams.get('chain_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('chronicles_chain_entries')
      .select(`*,
        chain:chronicles_writing_chains(id,title),
        post:chronicles_posts(id,title,slug),
        added:chronicles_creators(id,pen_name)`
      )
      .order('added_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (chainId) {
      query = query.eq('chain_id', chainId);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [], count });
  } catch (err) {
    console.error('Admin chain entries list error', err);
    return NextResponse.json({ success: false, error: 'Failed to list entries' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const url = new URL(request.url);
    const entryId = url.pathname.split('/').pop();
    if (!entryId) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    const { error } = await supabase
      .from('chronicles_chain_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin delete entry error', err);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
