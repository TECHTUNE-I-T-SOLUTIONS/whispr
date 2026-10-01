import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const body = await request.json();
    const { prompt_id, entry_id, creator_id, rank, prize_awarded, prize_value, badge_awarded } = body;

    // Insert into chronicles_challenge_winners
    const { data, error } = await supabase
      .from('chronicles_challenge_winners')
      .insert({
        prompt_id,
        entry_id,
        creator_id,
        rank,
        prize_awarded: prize_awarded || 'Recognition',
        prize_value: prize_value || 0,
        badge_awarded: badge_awarded || 'Challenge Winner',
        announced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting winner:', error);
      // If duplicate (23505), it's okay - might already exist
      if (error.code !== '23505') {
        throw error;
      }
    }

    // Update leaderboard winners
    const { data: existingWinner } = await supabase
      .from('chronicles_leaderboard_winners')
      .select('*')
      .eq('creator_id', creator_id)
      .single();

    if (existingWinner) {
      await supabase
        .from('chronicles_leaderboard_winners')
        .update({
          total_wins: existingWinner.total_wins + 1,
          [rank === 1 ? 'first_place_wins' : rank === 2 ? 'second_place_wins' : 'third_place_wins']:
            existingWinner[rank === 1 ? 'first_place_wins' : rank === 2 ? 'second_place_wins' : 'third_place_wins'] + 1,
          total_points_earned: existingWinner.total_points_earned + (4 - rank) * 100,
          last_win_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', creator_id);
    } else {
      await supabase
        .from('chronicles_leaderboard_winners')
        .insert({
          creator_id,
          total_wins: 1,
          first_place_wins: rank === 1 ? 1 : 0,
          second_place_wins: rank === 2 ? 1 : 0,
          third_place_wins: rank === 3 ? 1 : 0,
          total_points_earned: (4 - rank) * 100,
          last_win_at: new Date().toISOString(),
          best_rank_achievement: `${rank}${rank === 1 ? 'st' : rank === 2 ? 'nd' : 'rd'} Place`,
        });
    }

    // Send notification to winner
    await supabase
      .from('chronicles_notifications')
      .insert({
        creator_id,
        type: 'challenge_won',
        title: `You won ${rank}${rank === 1 ? 'st' : rank === 2 ? 'nd' : 'rd'} place!`,
        message: `Congratulations! You've achieved ${rank}${rank === 1 ? 'st' : rank === 2 ? 'nd' : 'rd'} place in the writing challenge.`,
        data: {
          prompt_id,
          entry_id,
          rank,
          prize_awarded: prize_awarded || 'Recognition',
        },
      });

    return NextResponse.json({ success: true, winner: data });
  } catch (error) {
    console.error('Error saving winner:', error);
    return NextResponse.json(
      { error: 'Failed to save winner' },
      { status: 500 }
    );
  }
}