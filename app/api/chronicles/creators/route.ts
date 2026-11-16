import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';

/**
 * Public creator lookup.
 *
 * The mobile app resolves a portfolio link (which carries a pen name) to a
 * creator id through this endpoint. It did not exist, so every portfolio
 * opened from a share link answered "No creator goes by @…".
 *
 * Query parameters:
 *   pen_name  exact pen name, case-insensitive
 *   q         partial match on pen name or display name
 *   limit     default 20, max 50
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const supabase =
      authHeader && authHeader.startsWith('Bearer ')
        ? createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader } } }
          )
        : await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const penName = searchParams.get('pen_name');
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50);

    let builder = supabase
      .from('chronicles_creators')
      .select(
        `id,
         user_id,
         pen_name,
         display_name,
         bio,
         profile_image_url,
         avatar_url,
         is_verified,
         is_banned,
         total_posts,
         total_engagement,
         total_followers,
         profile_visibility,
         content_type,
         categories,
         location,
         current_streak,
         total_points,
         created_at,
         updated_at`
      )
      .eq('is_banned', false)
      .limit(limit);

    if (penName) {
      builder = builder.ilike('pen_name', penName);
    } else if (query) {
      builder = builder.or(`pen_name.ilike.%${query}%,display_name.ilike.%${query}%`);
    }

    const { data: creators, error } = await builder;

    if (error) {
      console.error('[CREATORS] lookup error:', error);
      return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
    }

    return NextResponse.json({ creators: creators || [] });
  } catch (error) {
    console.error('[CREATORS] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
