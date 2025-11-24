import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator profile with all stats
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select(
        `id, 
         total_posts, 
         total_engagement, 
         streak_count, 
         longest_streak, 
         points, 
         badges,
         total_followers,
         profile_image_url,
         bio,
         pen_name`
      )
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      console.log('Creator error:', creatorError);
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    return NextResponse.json({
      totalPosts: creator.total_posts || 0,
      totalEngagement: creator.total_engagement || 0,
      currentStreak: creator.streak_count || 0,
      longestStreak: creator.longest_streak || 0,
      points: creator.points || 0,
      badges: creator.badges || [],
      totalFollowers: creator.total_followers || 0,
      profileImageUrl: creator.profile_image_url,
      bio: creator.bio,
      penName: creator.pen_name,
    });
  } catch (error) {
    console.error('Get creator stats error:', error);
    return NextResponse.json(
      {
        totalPosts: 0,
        totalEngagement: 0,
        currentStreak: 0,
        longestStreak: 0,
        points: 0,
        badges: [],
        totalFollowers: 0,
      },
      { status: 500 }
    );
  }
}
