import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();

    // Get total creators
    const { count: totalCreators } = await supabase
      .from('chronicles_creators')
      .select('*', { count: 'exact', head: true });

    // Get total posts
    const { count: totalPosts } = await supabase
      .from('chronicles_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Get total engagement
    const { data: engagementData } = await supabase
      .from('chronicles_engagement')
      .select('id', { count: 'exact' });

    // Get active creators today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: activeToday } = await supabase
      .from('chronicles_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Get top creator
    const { data: topCreators } = await supabase
      .from('chronicles_creators')
      .select('id, pen_name, post_count:chronicles_posts(count)')
      .order('post_count', { ascending: false })
      .limit(1);

    const topCreator = topCreators?.[0]
      ? {
          name: topCreators[0].pen_name,
          posts: topCreators[0].post_count?.length || 0,
        }
      : null;

    // Calculate average posts per creator
    const totalCreatorsNum = totalCreators || 0;
    const totalPostsNum = totalPosts || 0;
    const avgPostsPerCreator = totalCreatorsNum > 0 ? totalPostsNum / totalCreatorsNum : 0;

    // Get verified and banned creators
    const { count: verifiedCount } = await supabase
      .from('chronicles_creators')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    const { count: bannedCount } = await supabase
      .from('chronicles_creators')
      .select('*', { count: 'exact', head: true })
      .eq('is_banned', true);

    return NextResponse.json({
      total_creators: totalCreatorsNum,
      verified_creators: verifiedCount || 0,
      banned_creators: bannedCount || 0,
      total_posts: totalPostsNum,
      total_engagement: engagementData?.length || 0,
      active_today: activeToday || 0,
      avg_posts_per_creator: avgPostsPerCreator,
      top_creator: topCreator,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 400 }
    );
  }
}
