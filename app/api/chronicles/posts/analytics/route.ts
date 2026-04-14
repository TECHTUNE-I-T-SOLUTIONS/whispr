import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextRequest, NextResponse } from 'next/server';

interface PostData {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  published_at?: string;
  created_at?: string;
  status: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  type: 'regular' | 'chain';
}

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

    const creatorId = creator.id;

    // Fetch regular posts
    const { data: regularPosts, error: postsError } = await supabase
      .from('chronicles_posts')
      .select('*')
      .eq('creator_id', creatorId)
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching regular posts:', postsError);
    }

    // Fetch chain entry posts
    const { data: chainPosts, error: chainError } = await supabase
      .from('chronicles_chain_entry_posts')
      .select('*')
      .eq('creator_id', creatorId)
      .order('published_at', { ascending: false });

    if (chainError) {
      console.error('Error fetching chain posts:', chainError);
    }

    // Get actual engagement counts from tables for regular posts
    const postsWithActualCounts = await Promise.all(
      (regularPosts || []).map(async (post) => {
        const [
          { count: likesCount },
          { count: commentsCount },
        ] = await Promise.all([
          supabase
            .from('chronicles_engagement')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('engagement_type', 'like'),
          supabase
            .from('chronicles_comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('status', 'approved'),
        ]);

        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          category: post.category || 'Uncategorized',
          published_at: post.published_at || post.created_at,
          status: post.status,
          views_count: post.views_count || 0,
          likes_count: likesCount || post.likes_count || 0,
          comments_count: commentsCount || post.comments_count || 0,
          shares_count: post.shares_count || 0,
          type: 'regular' as const,
        };
      })
    );

    // Get actual engagement counts from tables for chain posts
    const chainPostsWithActualCounts = await Promise.all(
      (chainPosts || []).map(async (post) => {
        const [
          { count: likesCount },
          { count: commentsCount },
        ] = await Promise.all([
          supabase
            .from('chronicles_chain_entry_post_likes')
            .select('id', { count: 'exact', head: true })
            .eq('chain_entry_post_id', post.id),
          supabase
            .from('chronicles_chain_entry_post_comments')
            .select('id', { count: 'exact', head: true })
            .eq('chain_entry_post_id', post.id)
            .eq('status', 'approved'),
        ]);

        return {
          id: post.id,
          title: post.title,
          slug: `chain-${post.id}`,
          category: post.category || 'Uncategorized',
          published_at: post.published_at || post.created_at,
          status: post.status,
          views_count: post.views_count || 0,
          likes_count: likesCount || post.likes_count || 0,
          comments_count: commentsCount || post.comments_count || 0,
          shares_count: post.shares_count || 0,
          type: 'chain' as const,
        };
      })
    );

    // Combine all posts
    const allPosts: PostData[] = [...postsWithActualCounts, ...chainPostsWithActualCounts];
    
    // Filter published posts
    const publishedPosts = allPosts.filter((p) => p.status === 'published');
    const draftPosts = allPosts.filter((p) => p.status === 'draft');

    // Calculate engagement metrics
    const totalViews = publishedPosts.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
    const totalComments = publishedPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
    const totalShares = publishedPosts.reduce((sum, p) => sum + (p.shares_count || 0), 0);
    const totalEngagement = totalLikes + totalComments + totalShares;

    // Calculate trending posts (most engaged)
    const trendingPosts = publishedPosts
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug || p.id,
        views_count: p.views_count,
        likes_count: p.likes_count,
        comments_count: p.comments_count,
        shares_count: p.shares_count,
        engagement: (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0),
        type: (p as any).type || 'regular',
        chain_id: (p as any).chain_id,
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // Calculate daily/weekly analytics
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentPosts = publishedPosts.filter(
      (p) => new Date(p.published_at!) > last30Days
    );

    const dailyAnalytics: Record<string, any> = {};
    recentPosts.forEach((post) => {
      const date = new Date(post.published_at!).toLocaleDateString('en-US');
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
        totalPosts: allPosts.length,
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
