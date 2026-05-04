import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    let supabase;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    } else {
      supabase = await createSupabaseServerClient();
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: creator } = await supabase.from('chronicles_creators').select('id').eq('user_id', user.id).single();
    if (!creator) return NextResponse.json({ posts: [] });

    const { data: posts } = await supabase
      .from('chronicles_posts')
      .select('id, title, slug, status, created_at, published_at, excerpt')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false });

    const slugs = (posts ?? []).map((p) => p.slug);
    const { data: flags } = await supabase
      .from('chronicles_flagged_reviews')
      .select('post_id, status, reason, description')
      .in('post_id', (posts ?? []).map((p) => p.id))
      .in('status', ['pending', 'under_review', 'resolved', 'dismissed']);

    const flagMap = new Map((flags ?? []).map((f: any) => [f.post_id, f]));

    return NextResponse.json({
      posts: (posts ?? []).map((p) => ({
        ...p,
        isFlagged: flagMap.has(p.id),
        flagStatus: flagMap.get(p.id)?.status ?? null,
        flagReason: flagMap.get(p.id)?.reason ?? null,
        flagDescription: flagMap.get(p.id)?.description ?? null,
        slug: p.slug,
      })),
      slugs,
    });
  } catch (error) {
    console.error('Creator reviews error:', error);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}
