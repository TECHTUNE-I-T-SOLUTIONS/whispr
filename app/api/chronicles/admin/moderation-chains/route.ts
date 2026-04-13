import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('chronicles_writing_chains')
      .select(`*,
        creator:chronicles_creators(id,pen_name,profile_image_url),
        entries:chronicles_chain_entry_posts(count)`
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    
    // Map entries count to a more useful format
    const mappedData = (data || []).map((chain: any) => ({
      ...chain,
      entries_count: chain.entries?.[0]?.count || 0
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: mappedData, 
      count,
      contentType: 'chain'
    });
  } catch (err) {
    console.error('Admin chains list error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const url = new URL(request.url);
    const chainId = url.pathname.split('/').pop();

    if (!chainId) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('chronicles_writing_chains')
      .delete()
      .eq('id', chainId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin delete chain error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
