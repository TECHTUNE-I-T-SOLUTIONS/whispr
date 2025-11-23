import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateRange = searchParams.get('dateRange') || '30'; // days
    const metricType = searchParams.get('metricType') || 'all'; // all, engagement, creators, monetization
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    // Fetch daily analytics
    const { data: dailyAnalytics, error: dailyError } = await supabase
      .from('chronicles_daily_analytics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (dailyError) throw dailyError;

    // Fetch hourly analytics for today
    const { data: hourlyAnalytics, error: hourlyError } = await supabase
      .from('chronicles_hourly_analytics')
      .select('*')
      .gte('timestamp', new Date().toISOString().split('T')[0])
      .order('hour_of_day', { ascending: true });

    if (hourlyError) throw hourlyError;

    // Calculate aggregated metrics
    const aggregated = {
      totalCreators: dailyAnalytics?.[dailyAnalytics.length - 1]?.total_creators || 0,
      newCreators: dailyAnalytics?.reduce((sum, d) => sum + (d.new_creators || 0), 0) || 0,
      totalPosts: dailyAnalytics?.reduce((sum, d) => sum + (d.new_posts || 0), 0) || 0,
      totalEngagement: dailyAnalytics?.reduce((sum, d) => sum + (d.total_likes + d.total_comments + d.total_shares || 0), 0) || 0,
      totalLikes: dailyAnalytics?.reduce((sum, d) => sum + (d.total_likes || 0), 0) || 0,
      totalComments: dailyAnalytics?.reduce((sum, d) => sum + (d.total_comments || 0), 0) || 0,
      totalShares: dailyAnalytics?.reduce((sum, d) => sum + (d.total_shares || 0), 0) || 0,
      totalRevenue: dailyAnalytics?.reduce((sum, d) => sum + (d.total_ad_revenue || 0), 0) || 0,
      avgEngagementPerPost: dailyAnalytics?.[dailyAnalytics.length - 1]?.avg_engagement_per_post || 0,
    };

    // Get peak hours
    const peakHours = hourlyAnalytics
      ?.sort((a, b) => (b.active_users || 0) - (a.active_users || 0))
      .slice(0, 5) || [];

    // Get trending hashtags
    const { data: trendingHashtags, error: hashtagError } = await supabase
      .from('chronicles_hashtag_analytics')
      .select('*')
      .eq('is_trending', true)
      .order('trending_rank', { ascending: true })
      .limit(10);

    if (hashtagError) throw hashtagError;

    return NextResponse.json({
      success: true,
      data: {
        aggregated,
        timeline: dailyAnalytics,
        hourly: hourlyAnalytics,
        peakHours,
        trendingHashtags,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
