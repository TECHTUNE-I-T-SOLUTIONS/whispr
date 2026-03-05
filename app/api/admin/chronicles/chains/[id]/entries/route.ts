import { createSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chainId = params.id;
    const supabase = createSupabaseServer();

    // Fetch chain entries with post and creator info
    const { data: entries, error } = await supabase
      .from('chronicles_chain_entries')
      .select(`
        id,
        sequence,
        added_by,
        added_at,
        post:chronicles_posts!post_id(title, slug),
        contributor:chronicles_creators!added_by(pen_name)
      `)
      .eq('chain_id', chainId)
      .order('sequence', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      );
    }

    return NextResponse.json({ entries: entries || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
