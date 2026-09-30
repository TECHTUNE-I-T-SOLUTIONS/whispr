import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('chronicles_leaderboard_winners')
      .select(`
        *,
        chronicles_creators(pen_name, profile_image_url)
      `)
      .order('total_wins', { ascending: false });

    if (error) throw error;

    const leaderboard = data?.map(entry => ({
      ...entry,
      pen_name: entry.chronicles_creators?.pen_name,
      profile_image_url: entry.chronicles_creators?.profile_image_url
    })) || [];

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
