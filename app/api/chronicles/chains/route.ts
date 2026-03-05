import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

// list or create chains
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const term = searchParams.get('q');

    let query = supabase
      .from('chronicles_writing_chains')
      .select('*, entries:chronicles_chain_entries(count)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (term) {
      query = query.ilike('title', `%${term}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [], count });
  } catch (err) {
    console.error('Chains GET error', err);
    return NextResponse.json({ success: false, error: 'Failed to list chains' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const body = await request.json();
    const { title, description, creator_id } = body;

    const { data, error } = await supabase
      .from('chronicles_writing_chains')
      .insert({ title, description, created_by: creator_id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Chains POST error', err);
    return NextResponse.json({ success: false, error: 'Failed to create chain' }, { status: 500 });
  }
}
