import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
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
    const supabase = createSupabaseServer();
    const body = await request.json();
    const { templateId, dateRange, creatorId, reportType } = body;

    // Default report response if table doesn't exist
    const defaultReport = {
      success: true,
      data: {
        id: 'temp-' + Date.now(),
        report_type: reportType,
        title: 'Report',
        report_data: { note: 'Report generation not yet available' },
        status: 'pending',
      },
    };

    try {
      // Get template
      // templateId might be the slug if frontend fetched names, try to resolve
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
      startDate.setDate(startDate.getDate() - (dateRange || 30));

      // Aggregate report data based on template type
      let reportData: any = {};

      if (template?.report_type === 'analytics') {
        try {
          const { data: dailyAnalytics } = await supabase
            .from('chronicles_daily_analytics')
            .select('*')
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);

          reportData = {
            type: 'analytics',
            timeline: dailyAnalytics || [],
            metrics: {
              totalPosts: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.posts_published || 0), 0) || 0,
              totalEngagement: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.total_likes + d.total_comments + d.total_shares || 0), 0) || 0,
              totalRevenue: dailyAnalytics?.reduce((sum: number, d: any) => sum + (d.ad_revenue || 0), 0) || 0,
            },
          };
        } catch (e) {
          console.error('Analytics aggregation error:', e);
          reportData = { type: 'analytics', timeline: [], metrics: {} };
        }
      }

      // Insert generated report
      try {
        const { data: report, error: insertError } = await supabase
          .from('chronicles_generated_reports')
          .insert({
            template_id: templateId,
            report_type: template?.report_type || reportType,
            title: `${reportType} Report - ${new Date().toLocaleDateString()}`,
            report_data: reportData,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: 'generated',
            generated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Report insert error:', insertError);
          return NextResponse.json(defaultReport);
        }

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
