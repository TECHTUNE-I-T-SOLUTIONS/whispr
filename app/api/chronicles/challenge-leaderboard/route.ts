import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch leaderboard with creator info
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('chronicles_leaderboard_winners')
      .select(`
        *,
        chronicles_creators(id, pen_name, display_name, profile_image_url, avatar_url)
      `)
      .order('total_wins', { ascending: false })
      .limit(100);

    if (leaderboardError) throw leaderboardError;

    // Fetch all challenge winners separately
    const { data: allWinners, error: winnersError } = await supabase
      .from('chronicles_challenge_winners')
      .select('*')
      .order('announced_at', { ascending: false });

    if (winnersError) throw winnersError;

    // Group winners by creator_id
    const winnersByCreator = (allWinners || []).reduce((acc, winner) => {
      if (!acc[winner.creator_id]) {
        acc[winner.creator_id] = [];
      }
      acc[winner.creator_id].push(winner);
      return acc;
    }, {} as Record<string, any[]>);

    // Fetch post details for each winning entry
    const leaderboardWithDetails = await Promise.all(
      (leaderboardData || []).map(async (entry) => {
        const creatorWinners = winnersByCreator[entry.creator_id] || [];
        
        const winnersWithPosts = await Promise.all(
          creatorWinners.map(async (winner: any) => {
            // Fetch post details based on entry_id
            const { data: promptEntry, error: entryError } = await supabase
              .from('chronicles_prompt_entries')
              .select('entry_type, post_id, admin_post_id')
              .eq('id', winner.entry_id)
              .maybeSingle(); // Use maybeSingle to handle not found gracefully

            let postData = null;
            if (promptEntry) {
              try {
                if (promptEntry.entry_type === 'chronicles_post' && promptEntry.post_id) {
                  const { data: post } = await supabase
                    .from('chronicles_posts')
                    .select('id, title, slug, post_type, cover_image_url')
                    .eq('id', promptEntry.post_id)
                    .maybeSingle();
                  postData = post;
                } else if (promptEntry.entry_type === 'post' && promptEntry.admin_post_id) {
                  const { data: post } = await supabase
                    .from('posts')
                    .select('id, title, slug, post_type, cover_image_url')
                    .eq('id', promptEntry.admin_post_id)
                    .maybeSingle();
                  postData = post;
                }
              } catch (postError) {
                console.error('Error fetching post for winner:', winner.entry_id, postError);
              }
            } else if (entryError && entryError.code !== 'PGRST116') {
              console.error('Error fetching prompt entry for winner:', winner.entry_id, entryError);
            }

            return {
              ...winner,
              post: postData,
              promptEntry: promptEntry,
              entryNotFound: !promptEntry,
            };
          })
        );

        return {
          ...entry,
          pen_name: entry.chronicles_creators?.pen_name,
          display_name: entry.chronicles_creators?.display_name,
          profile_image_url: entry.chronicles_creators?.profile_image_url || entry.chronicles_creators?.avatar_url,
          winners: winnersWithPosts,
        };
      })
    );

    return NextResponse.json({ leaderboard: leaderboardWithDetails });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
