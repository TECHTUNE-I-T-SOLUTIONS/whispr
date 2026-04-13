import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Use createServerClient with cookies for proper session handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type'); // all, analytics, monetization, engagement, creator_performance
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeTemplates = searchParams.get('includeTemplates') === 'true';

    // Default empty reports if table doesn't exist
    const defaultResponse = {
      success: true,
      data: [],
      pagination: {
        total: 0,
        limit,
        offset,
        hasMore: false,
      },
    };

    try {
      let query = supabase
        .from('chronicles_generated_reports')
        .select(`
          *,
          template:chronicles_report_templates(*)
        `, { count: 'exact' })
        .eq('status', 'generated')
        .order('created_at', { ascending: false });

      if (reportType && reportType !== 'all') {
        query = query.eq('report_type', reportType);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Reports query error:', error);
        return NextResponse.json(defaultResponse);
      }

      const responseObj: any = {
        success: true,
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (count || 0),
        },
      };

      // optionally include templates
      if (includeTemplates) {
        const { data: templates, error: templErr } = await supabase
          .from('chronicles_report_templates')
          .select('*')
          .eq('is_active', true);
        responseObj.templates = templates || [];
        if (templErr) console.error('Error fetching templates', templErr);
      }

      return NextResponse.json(responseObj);
    } catch (dbError) {
      console.error('Database error fetching reports:', dbError);
      return NextResponse.json(defaultResponse);
    }
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
        error: 'Failed to fetch reports',
      },
      { status: 200 } // Return 200 with empty data instead of 500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Use createServerClient with cookies for proper session handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const body = await request.json();
    const { templateId, dateRange = 30, creatorId, reportType } = body;

    // Default report response if table doesn't exist
    const defaultReport = {
      success: true,
      data: {
        id: 'temp-' + Date.now(),
        report_type: reportType,
        report_name: 'Report',
        report_data: { note: 'Report generation not yet available' },
        status: 'pending',
      },
    };

    try {
      // Get template
      let template: any = null;
      if (templateId) {
        // if templateId looks like a uuid use it, otherwise try slug lookup
        const uuidRegex = /^[0-9a-fA-F\-]{36}$/;
        if (uuidRegex.test(templateId)) {
          const { data: t, error: templateError } = await supabase
            .from('chronicles_report_templates')
            .select('*')
            .eq('id', templateId)
            .single();
          if (templateError) {
            console.error('Template fetch error by id:', templateError);
            return NextResponse.json(defaultReport);
          }
          template = t;
        } else {
          const { data: t, error: slugError } = await supabase
            .from('chronicles_report_templates')
            .select('*')
            .ilike('slug', templateId)
            .single();
          if (slugError) {
            console.error('Template fetch error by slug:', slugError);
            return NextResponse.json(defaultReport);
          }
          template = t;
        }
      }

      if (!template) {
        console.error('No template found for', templateId);
        return NextResponse.json(defaultReport);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      // Aggregate comprehensive report data based on template type
      let reportData: any = {
        type: template?.report_type || reportType,
        generatedAt: new Date().toISOString(),
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days: dateRange,
        },
      };

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // ===== ANALYTICS REPORT =====
      if (template?.report_type === 'analytics') {
        try {
          const { data: dailyAnalytics } = await supabase
            .from('chronicles_daily_analytics')
            .select('*')
            .gte('date', startDateStr)
            .lte('date', endDateStr)
            .order('date', { ascending: true });

          const { data: hourlyAnalytics } = await supabase
            .from('chronicles_hourly_analytics')
            .select('*')
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: true });

          reportData.timeline = dailyAnalytics || [];
          reportData.hourlyData = hourlyAnalytics || [];
          reportData.metrics = {
            totalPosts: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.new_posts || 0), 0) || 0,
            totalCreators: dailyAnalytics?.[0]?.total_creators || 0,
            activeCreators: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.active_creators || 0), 0) / (dailyAnalytics?.length || 1) || 0,
            totalEngagement:
              dailyAnalytics?.reduce((sum: number, d: any) => sum + ((d.total_likes || 0) + (d.total_comments || 0) + (d.total_shares || 0)), 0) || 0,
            totalRevenue: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.total_ad_revenue || 0), 0) || 0,
            avgEngagementPerPost:
              dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.avg_engagement_per_post || 0), 0) / (dailyAnalytics?.length || 1) || 0,
          };
        } catch (e) {
          console.error('Analytics aggregation error:', e);
          reportData.timeline = [];
          reportData.hourlyData = [];
          reportData.metrics = {};
        }
      }

      // ===== CREATOR PERFORMANCE REPORT =====
      if (template?.report_type === 'creator_performance') {
        try {
          let creatorsQuery = supabase
            .from('chronicles_creators')
            .select(`
              id,
              pen_name,
              display_name,
              total_followers,
              total_posts,
              status,
              joined_at
            `)
            .eq('status', 'active');

          if (creatorId) {
            creatorsQuery = creatorsQuery.eq('id', creatorId);
          }

          const { data: creators } = await creatorsQuery;

          const { data: creatorAnalytics } = await supabase
            .from('chronicles_creator_analytics')
            .select('*')
            .gte('date', startDateStr)
            .lte('date', endDateStr);

          const { data: creatorReportData } = await supabase
            .from('chronicles_creator_report_data')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          reportData.creators = creators || [];
          reportData.analytics = creatorAnalytics || [];
          reportData.reportData = creatorReportData || [];
          reportData.metrics = {
            totalCreators: creators?.length || 0,
            totalPosts: creatorAnalytics?.reduce((sum: number, d: any) => sum + (d.posts_created || 0), 0) || 0,
            totalEngagement:
              creatorAnalytics?.reduce(
                (sum: number, d: any) =>
                  sum + ((d.total_likes || 0) + (d.total_comments || 0) + (d.total_shares || 0)),
                0
              ) || 0,
            totalFollowers: creatorAnalytics?.reduce((sum: number, d: any) => sum + (d.new_followers || 0), 0) || 0,
            avgFollowersPerCreator: (creators?.reduce((sum: number, c: any) => sum + (c.total_followers || 0), 0) || 0) / (creators?.length || 1),
            totalEarnings: creatorAnalytics?.reduce((sum: number, d: any) => sum + (d.earnings || 0), 0) || 0,
          };
        } catch (e) {
          console.error('Creator performance aggregation error:', e);
          reportData.creators = [];
          reportData.analytics = [];
          reportData.reportData = [];
          reportData.metrics = {};
        }
      }

      // ===== ENGAGEMENT REPORT =====
      if (template?.report_type === 'engagement') {
        try {
          const { data: postAnalytics } = await supabase
            .from('chronicles_post_analytics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          const { data: engagementData } = await supabase
            .from('chronicles_engagement_report_data')
            .select('*')
            .gte('report_date', startDateStr)
            .lte('report_date', endDateStr);

          const { data: dailyAnalytics } = await supabase
            .from('chronicles_daily_analytics')
            .select('*')
            .gte('date', startDateStr)
            .lte('date', endDateStr);

          reportData.postAnalytics = postAnalytics || [];
          reportData.engagementData = engagementData || [];
          reportData.dailyData = dailyAnalytics || [];
          reportData.metrics = {
            totalLikes: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.total_likes || 0), 0) || 0,
            totalComments: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.total_comments || 0), 0) || 0,
            totalShares: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.total_shares || 0), 0) || 0,
            totalReactions: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.total_reactions || 0), 0) || 0,
            avgDailyEngagement: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.avg_engagement_per_post || 0), 0) / (dailyAnalytics?.length || 1) || 0,
            topPosts: postAnalytics?.sort((a: any, b: any) => (b.total_likes || 0) - (a.total_likes || 0)).slice(0, 10) || [],
          };
        } catch (e) {
          console.error('Engagement aggregation error:', e);
          reportData.postAnalytics = [];
          reportData.engagementData = [];
          reportData.dailyData = [];
          reportData.metrics = {};
        }
      }

      // ===== MONETIZATION REPORT =====
      if (template?.report_type === 'monetization') {
        try {
          const { data: earningsTransactions } = await supabase
            .from('chronicles_earnings_transactions')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          const { data: monetizationData } = await supabase
            .from('chronicles_monetization_report_data')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          const { data: adAnalytics } = await supabase
            .from('chronicles_ad_analytics')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          const { data: dailyAnalytics } = await supabase
            .from('chronicles_daily_analytics')
            .select('*')
            .gte('date', startDateStr)
            .lte('date', endDateStr);

          reportData.transactions = earningsTransactions || [];
          reportData.monetizationData = monetizationData || [];
          reportData.adAnalytics = adAnalytics || [];
          reportData.dailyData = dailyAnalytics || [];
          reportData.metrics = {
            totalEarnings: earningsTransactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0,
            totalAdRevenue: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.total_ad_revenue || 0), 0) || 0,
            totalTips: earningsTransactions?.filter((t: any) => t.transaction_type === 'tip').reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0,
            totalSubscriptions:
              earningsTransactions?.filter((t: any) => t.transaction_type === 'subscription').reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0,
            totalAdImpressions: adAnalytics?.reduce((sum: number, a: any) => sum + (a.impressions || 0), 0) || 0,
            totalAdClicks: adAnalytics?.reduce((sum: number, a: any) => sum + (a.clicks || 0), 0) || 0,
            avgCTR:
              adAnalytics?.reduce((sum: number, a: any) => sum + (a.impressions || 0), 0) > 0
                ? ((adAnalytics?.reduce((sum: number, a: any) => sum + (a.clicks || 0), 0) || 0) /
                    (adAnalytics?.reduce((sum: number, a: any) => sum + (a.impressions || 0), 0) || 1)) *
                  100
                : 0,
          };
        } catch (e) {
          console.error('Monetization aggregation error:', e);
          reportData.transactions = [];
          reportData.monetizationData = [];
          reportData.adAnalytics = [];
          reportData.dailyData = [];
          reportData.metrics = {};
        }
      }

      // ===== CONTENT REPORT =====
      if (template?.report_type === 'content') {
        try {
          const { data: contentReportData } = await supabase
            .from('chronicles_content_report_data')
            .select('*')
            .gte('publish_date', startDateStr)
            .lte('publish_date', endDateStr);

          const { data: postAnalytics } = await supabase
            .from('chronicles_post_analytics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          const { data: posts } = await supabase
            .from('chronicles_posts')
            .select(`
              id,
              title,
              slug,
              post_type,
              category,
              views_count,
              likes_count,
              comments_count,
              shares_count,
              published_at,
              creator:chronicles_creators(pen_name, display_name)
            `)
            .eq('status', 'published')
            .gte('published_at', startDate.toISOString())
            .lte('published_at', endDate.toISOString())
            .order('published_at', { ascending: false });

          reportData.contentData = contentReportData || [];
          reportData.postAnalytics = postAnalytics || [];
          reportData.posts = posts || [];
          reportData.metrics = {
            totalPosts: posts?.length || 0,
            totalViews: posts?.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0) || 0,
            totalLikes: posts?.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0) || 0,
            totalComments: posts?.reduce((sum: number, p: any) => sum + (p.comments_count || 0), 0) || 0,
            totalShares: posts?.reduce((sum: number, p: any) => sum + (p.shares_count || 0), 0) || 0,
            avgViewsPerPost: (posts?.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0) || 0) / (posts?.length || 1),
            topPosts: posts?.sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 10) || [],
            contentTypeBreakdown: {
              BlogPosts: posts?.filter((p: any) => p.post_type === 'blog').length || 0,
              Poems: posts?.filter((p: any) => p.post_type === 'poem').length || 0,
            },
          };
        } catch (e) {
          console.error('Content aggregation error:', e);
          reportData.contentData = [];
          reportData.postAnalytics = [];
          reportData.posts = [];
          reportData.metrics = {};
        }
      }

      // Get current user for generated_by_user_id
      let adminUserId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          adminUserId = user.id;
        }
      } catch (e) {
        console.warn('Could not get user from session:', e);
      }

      // Use service role key for inserts (bypasses RLS)
      const serviceSupabase = createSupabaseServer();

      // Insert generated report with all data
      try {
        const reportName = `${template?.name || reportType} Report - ${new Date().toLocaleDateString()}`;

        const { data: report, error: insertError } = await serviceSupabase
          .from('chronicles_generated_reports')
          .insert({
            template_id: templateId,
            creator_id: creatorId || null,
            report_name: reportName,
            report_type: template?.report_type || reportType,
            period_start: startDateStr,
            period_end: endDateStr,
            report_data: reportData,
            file_format: 'json',
            status: 'generated',
            generated_by_user_id: adminUserId || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Report insert error:', insertError);
          return NextResponse.json(defaultReport);
        }

        const reportId = report?.id;

        // ===== INSERT INTO RELATED REPORT DATA TABLES =====
        // These tables store detailed metrics broken down by dimension

        // 1. ENGAGEMENT REPORT DATA
        if (template?.report_type === 'engagement' && reportData.dailyData?.length > 0) {
          try {
            const engagementDataRows = reportData.dailyData.map((day: any) => ({
              report_id: reportId,
              report_date: day.date,
              likes: day.total_likes || 0,
              comments: day.total_comments || 0,
              shares: day.total_shares || 0,
              reposts: day.total_reposts || 0,
              follows: day.total_follows || 0,
              engagement_score: day.avg_engagement_per_post || 0,
              peak_engagement_time: day.date,
            }));

            await serviceSupabase
              .from('chronicles_engagement_report_data')
              .insert(engagementDataRows)
              .then(({ error }) => {
                if (error) console.error('Engagement report data insert error:', error);
              });
          } catch (e) {
            console.error('Engagement report data transaction error:', e);
          }
        }

        // 2. CREATOR REPORT DATA
        if (template?.report_type === 'creator_performance' && reportData.creators?.length > 0) {
          try {
            const creatorDataRows = reportData.creators.map((creator: any) => ({
              report_id: reportId,
              creator_id: creator.id,
              follower_growth: 0, // Calculate from daily data if available
              engagement_growth: 0,
              post_frequency: reportData.analytics?.find((a: any) => a.creator_id === creator.id)?.posts_created || 0,
              avg_engagement_per_post:
                reportData.analytics?.find((a: any) => a.creator_id === creator.id)?.avg_engagement_rate || 0,
              total_engagement:
                (reportData.analytics?.filter((a: any) => a.creator_id === creator.id)
                  ?.reduce((sum: number, a: any) => sum + ((a.total_likes || 0) + (a.total_comments || 0) + (a.total_shares || 0)), 0) || 0),
              total_earnings: reportData.analytics?.find((a: any) => a.creator_id === creator.id)?.earnings || 0,
              total_views:
                reportData.analytics?.filter((a: any) => a.creator_id === creator.id)
                  ?.reduce((sum: number, a: any) => sum + (a.total_views || 0), 0) || 0,
            }));

            await serviceSupabase
              .from('chronicles_creator_report_data')
              .insert(creatorDataRows)
              .then(({ error }) => {
                if (error) console.error('Creator report data insert error:', error);
              });
          } catch (e) {
            console.error('Creator report data transaction error:', e);
          }
        }

        // 3. CONTENT REPORT DATA
        if (template?.report_type === 'content' && reportData.posts?.length > 0) {
          try {
            const contentDataRows = reportData.posts.map((post: any) => ({
              report_id: reportId,
              post_id: post.id,
              creator_id: post.creator_id,
              views: post.views_count || 0,
              likes: post.likes_count || 0,
              comments: post.comments_count || 0,
              shares: post.shares_count || 0,
              engagement_rate: post.views_count > 0 ? ((post.likes_count + post.comments_count + post.shares_count) / post.views_count * 100) : 0,
              category: post.category || 'uncategorized',
              post_type: post.post_type || 'blog',
              publish_date: post.published_at ? post.published_at.split('T')[0] : startDateStr,
            }));

            await serviceSupabase
              .from('chronicles_content_report_data')
              .insert(contentDataRows)
              .then(({ error }) => {
                if (error) console.error('Content report data insert error:', error);
              });
          } catch (e) {
            console.error('Content report data transaction error:', e);
          }
        }

        // 4. MONETIZATION REPORT DATA
        if (template?.report_type === 'monetization') {
          try {
            const monetizationDataRows = reportData.monetizationData?.map((m: any) => ({
              report_id: reportId,
              creator_id: m.creator_id || null,
              total_earnings: m.total_earnings || 0,
              ad_revenue: m.ad_revenue || 0,
              subscription_revenue: m.subscription_revenue || 0,
              tip_revenue: m.tip_revenue || 0,
              payout_amount: 0,
              created_at: new Date().toISOString(),
            })) || [];

            if (monetizationDataRows.length > 0) {
              await serviceSupabase
                .from('chronicles_monetization_report_data')
                .insert(monetizationDataRows)
                .then(({ error }) => {
                  if (error) console.error('Monetization report data insert error:', error);
                });
            }
          } catch (e) {
            console.error('Monetization report data transaction error:', e);
          }
        }

        // 5. AUDIENCE REPORT DATA
        if (creatorId) {
          try {
            const audienceData = {
              report_id: reportId,
              total_followers: reportData.creators?.[0]?.total_followers || 0,
              new_followers: 0,
              lost_followers: 0,
              avg_age: null,
              top_countries: JSON.stringify([]),
              top_regions: JSON.stringify([]),
              device_breakdown: JSON.stringify({
                mobile: 0,
                desktop: 0,
                tablet: 0,
              }),
            };

            await serviceSupabase
              .from('chronicles_audience_report_data')
              .insert([audienceData])
              .then(({ error }) => {
                if (error) console.error('Audience report data insert error:', error);
              });
          } catch (e) {
            console.error('Audience report data transaction error:', e);
          }
        }

        // Log successful report generation
        console.log('✅ Report generated successfully:', reportId, template?.report_type);

        return NextResponse.json({ success: true, data: report });
      } catch (e) {
        console.error('Report insertion error:', e);
        return NextResponse.json(defaultReport);
      }
    } catch (e) {
      console.error('POST report error:', e);
      return NextResponse.json(defaultReport);
    }
  } catch (error) {
    console.error('Reports creation error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Failed to create report',
      },
      { status: 200 }
    );
  }
}
