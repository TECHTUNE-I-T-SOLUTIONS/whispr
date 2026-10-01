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

    // Fetch entries
    let query = supabase
      .from('chronicles_prompt_entries')
      .select('*')
      .eq('prompt_id', id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: entries, error: entriesError } = await query;

    if (entriesError) throw entriesError;

    // Fetch all challenge winners for this prompt
    const { data: winners } = await supabase
      .from('chronicles_challenge_winners')
      .select('*')
      .eq('prompt_id', id);

    // Create a map of entry_id to rank
    const entryRankMap = (winners || []).reduce((acc, winner) => {
      acc[winner.entry_id] = winner.rank;
      return acc;
    }, {} as Record<string, number>);

    // Fetch creator and post data for each entry separately
    const enrichedEntries = await Promise.all(
      (entries || []).map(async (entry) => {
        // Fetch creator data
        let creatorData = null;
        if (entry.creator_id) {
          const { data: creator } = await supabase
            .from('chronicles_creators')
            .select('id, pen_name, display_name, profile_image_url, avatar_url, bio')
            .eq('id', entry.creator_id)
            .maybeSingle();
          creatorData = creator;
        }

        // Fetch post data based on entry_type
        let postData = null;
        if (entry.entry_type === 'chronicles_post' && entry.post_id) {
          const { data: post } = await supabase
            .from('chronicles_posts')
            .select('id, title, slug, excerpt, content, post_type, category, tags, status, published_at, cover_image_url')
            .eq('id', entry.post_id)
            .maybeSingle();
          postData = post;
        } else if (entry.entry_type === 'post' && entry.admin_post_id) {
          const { data: post } = await supabase
            .from('posts')
            .select('id, title, slug, excerpt, content, post_type, category, tags, status, published_at, cover_image_url')
            .eq('id', entry.admin_post_id)
            .maybeSingle();
          postData = post;
        }

        return {
          ...entry,
          creator: creatorData,
          post: postData,
          rank: entryRankMap[entry.id] || null,
        };
      })
    );

    return NextResponse.json({ entries: enrichedEntries });
  } catch (error) {
    console.error('Error fetching prompt entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt entries' },
      { status: 500 }
    );
  }
}
