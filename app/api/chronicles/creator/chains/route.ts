import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    let supabase;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    } else {
      supabase = await createSupabaseServerClient();
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: creator } = await supabase.from('chronicles_creators').select('id').eq('user_id', user.id).single();
    if (!creator) return NextResponse.json({ data: [] });

    const { data: chains } = await supabase
      .from('chronicles_writing_chains')
      .select('*, entries:chronicles_chain_entries(*, post:chain_entry_post_id(*))')
      .order('created_at', { ascending: false });

    const filtered = (chains ?? [])
      .filter((chain: any) => {
        if (chain.created_by === creator.id) return true;
        return (chain.entries ?? []).some((entry: any) => {
          const post = entry.post;
          return post?.creator_id === creator.id || entry.added_by === creator.id;
        });
      })
      .map((chain: any) => {
        const isOwner = chain.created_by === creator.id;
        const contributedEntries = (chain.entries ?? []).filter((entry: any) => {
          const post = entry.post;
          return post?.creator_id === creator.id || entry.added_by === creator.id;
        });

        return {
          ...chain,
          is_owner: isOwner,
          is_contributor: !isOwner && contributedEntries.length > 0,
          can_edit: isOwner || contributedEntries.length > 0,
          can_delete: isOwner,
          contribution_count: contributedEntries.length,
        };
      });

    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error('My writings error:', error);
    return NextResponse.json({ error: 'Failed to fetch my writings', data: [] }, { status: 500 });
  }
}
