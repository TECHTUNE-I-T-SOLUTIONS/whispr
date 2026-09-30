import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('chronicles_prompt_entries')
      .select(`
        *,
        chronicles_creators(pen_name, profile_image_url),
        posts!chronicles_prompt_entries_admin_post_id_fkey(id, title, content, excerpt, created_at)
      `)
      .eq('prompt_id', id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ entries: data });
  } catch (error) {
    console.error('Error fetching prompt entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt entries' },
      { status: 500 }
    );
  }
}
