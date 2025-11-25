import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get all posts for this creator
    const { data: posts, error: postsError } = await supabase
      .from('chronicles_posts')
      .select('*')
      .eq('creator_id', creator.id)
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    // Calculate analytics
    const totalPosts = posts?.length || 0;
    const publishedPosts = posts?.filter((p) => p.status === 'published') || [];
    const draftPosts = posts?.filter((p) => p.status === 'draft') || [];

    // Calculate engagement metrics
    const totalViews = publishedPosts.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
    const totalComments = publishedPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
    const totalShares = publishedPosts.reduce((sum, p) => sum + (p.shares_count || 0), 0);
    const totalEngagement = totalLikes + totalComments + totalShares;

    // Calculate trending posts (most engaged)
    const trendingPosts = publishedPosts
      .map((p) => ({
        ...p,
        engagement: (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // Calculate daily/weekly analytics
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentPosts = publishedPosts.filter(
      (p) => new Date(p.published_at) > last30Days
    );

    const dailyAnalytics: Record<string, any> = {};
    recentPosts.forEach((post) => {
      const date = new Date(post.published_at).toLocaleDateString('en-US');
      if (!dailyAnalytics[date]) {
        dailyAnalytics[date] = {
          posts: 0,
          views: 0,
          engagement: 0,
        };
      }
      dailyAnalytics[date].posts += 1;
      dailyAnalytics[date].views += post.views_count || 0;
      dailyAnalytics[date].engagement +=
        (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0);
    });

    // Category breakdown
    const categoryBreakdown: Record<string, any> = {};
    publishedPosts.forEach((post) => {
      const category = post.category || 'Uncategorized';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          count: 0,
          views: 0,
          engagement: 0,
        };
      }
      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].views += post.views_count || 0;
      categoryBreakdown[category].engagement +=
        (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0);
    });

    return NextResponse.json({
      summary: {
        totalPosts,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        totalEngagement,
        avgEngagementPerPost: publishedPosts.length > 0 ? totalEngagement / publishedPosts.length : 0,
        avgViewsPerPost: publishedPosts.length > 0 ? totalViews / publishedPosts.length : 0,
      },
      trendingPosts,
      dailyAnalytics: Object.entries(dailyAnalytics)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        ...data,
      })),
    });
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
