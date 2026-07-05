// Analytics Engine
// Measures platform intelligence following docs/V2/ section 35

import { createSupabaseServer } from '../supabase-server';

class AnalyticsEngine {
  async trackEvent(event: {
    type: 'view' | 'read' | 'like' | 'comment' | 'share' | 'bookmark' | 'search';
    userId?: string;
    contentId?: string;
    contentType?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const supabase = createSupabaseServer();

      switch (event.type) {
        case 'view':
          await this.trackView(event);
          break;
        case 'search':
          await this.trackSearch(event);
          break;
        default:
          await this.trackGenericEvent(event);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  private async trackView(event: any): Promise<void> {
    const supabase = createSupabaseServer();

    // Update post analytics if it's a post
    if (event.contentId && event.contentType === 'post') {
      await supabase
        .from('posts')
        .update({ view_count: (await this.getCurrentViewCount(event.contentId)) + 1 })
        .eq('id', event.contentId);
    }

    // Record in analytics table
    await supabase.from('post_analytics').insert({
      post_id: event.contentId,
      event_type: 'view',
      event_data: event.metadata || {},
      user_ip: event.metadata?.ip,
      user_agent: event.metadata?.userAgent,
    });
  }

  private async trackSearch(event: any): Promise<void> {
    const supabase = createSupabaseServer();

    await supabase.from('search_analytics').insert({
      query: event.metadata?.query || '',
      result_count: event.metadata?.resultCount || 0,
      has_results: (event.metadata?.resultCount || 0) > 0,
      search_type: event.metadata?.searchType || 'general',
      user_id: event.userId,
      session_id: event.metadata?.sessionId,
      metadata: event.metadata,
    });

    // Update user search history
    if (event.userId) {
      await supabase.from('user_search_history').insert({
        user_id: event.userId,
        query: event.metadata?.query || '',
        results_count: event.metadata?.resultCount || 0,
        clicked_result_id: event.metadata?.clickedResultId,
        clicked_result_type: event.metadata?.clickedResultType,
        metadata: event.metadata,
      });
    }
  }

  private async trackGenericEvent(event: any): Promise<void> {
    const supabase = createSupabaseServer();

    // For chronicles engagement
    if (event.contentType?.startsWith('chronicles')) {
      await supabase.from('chronicles_engagement').insert({
        post_id: event.contentId,
        user_id: event.userId,
        engagement_type: event.type,
        content: event.metadata?.content,
      });
    }
  }

  private async getCurrentViewCount(postId: string): Promise<number> {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', postId)
      .single();

    return data?.view_count || 0;
  }

  async getAnalytics(userId?: string, options?: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
  }): Promise<{
    views: number;
    reads: number;
    likes: number;
    comments: number;
    shares: number;
    searches: number;
    topContent: Array<{ id: string; title: string; views: number }>;
    topSearches: Array<{ query: string; count: number }>;
  }> {
    try {
      const supabase = createSupabaseServer();

      const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = options?.endDate || new Date();

      // Get view counts
      const { data: views } = await supabase
        .from('post_analytics')
        .select('post_id')
        .eq('event_type', 'view')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get search counts
      const { data: searches } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Get top content
      const { data: topPosts } = await supabase
        .from('posts')
        .select('id, title, view_count')
        .order('view_count', { ascending: false })
        .limit(10);

      // Get top searches
      const { data: topSearches } = await supabase
        .from('search_analytics')
        .select('query')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      const searchCounts: Record<string, number> = {};
      if (topSearches) {
        for (const search of topSearches) {
          searchCounts[search.query] = (searchCounts[search.query] || 0) + 1;
        }
      }

      return {
        views: views?.length || 0,
        reads: 0, // Would need read completion tracking
        likes: 0, // Would need to aggregate from reactions
        comments: 0, // Would need to aggregate from comments
        shares: 0, // Would need to aggregate from shares
        searches: searches?.length || 0,
        topContent: topPosts?.map((p: any) => ({
          id: p.id,
          title: p.title,
          views: p.view_count,
        })) || [],
        topSearches: Object.entries(searchCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([query, count]) => ({ query, count })),
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        views: 0,
        reads: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        searches: 0,
        topContent: [],
        topSearches: [],
      };
    }
  }

  async getProviderAnalytics(): Promise<{
    gemini: { requests: number; avgLatency: number; successRate: number };
    providers: Array<{
      name: string;
      requests: number;
      avgLatency: number;
      successRate: number;
      cacheHitRate: number;
    }>;
  }> {
    try {
      const supabase = createSupabaseServer();

      // Get AI logs
      const { data: aiLogs } = await supabase
        .from('ai_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get provider logs
      const { data: providerLogs } = await supabase
        .from('provider_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get provider health
      const { data: providerHealth } = await supabase
        .from('provider_health')
        .select('*');

      // Calculate Gemini stats
      const geminiLogs = aiLogs?.filter((log: any) => log.provider === 'gemini') || [];
      const geminiSuccess = geminiLogs.filter((log: any) => log.success).length;
      const geminiAvgLatency = geminiLogs.length > 0
        ? geminiLogs.reduce((sum: number, log: any) => sum + (log.latency_ms || 0), 0) / geminiLogs.length
        : 0;

      // Calculate provider stats
      const providerStats: Record<string, any> = {};
      if (providerLogs) {
        for (const log of providerLogs) {
          if (!providerStats[log.provider]) {
            providerStats[log.provider] = {
              name: log.provider,
              requests: 0,
              success: 0,
              totalLatency: 0,
              cacheHits: 0,
            };
          }
          providerStats[log.provider].requests++;
          if (log.success) providerStats[log.provider].success++;
          providerStats[log.provider].totalLatency += log.response_time_ms || 0;
          if (log.cache_hit) providerStats[log.provider].cacheHits++;
        }
      }

      const providers = Object.values(providerStats).map((stat: any) => ({
        name: stat.name,
        requests: stat.requests,
        avgLatency: stat.requests > 0 ? stat.totalLatency / stat.requests : 0,
        successRate: stat.requests > 0 ? (stat.success / stat.requests) * 100 : 0,
        cacheHitRate: stat.requests > 0 ? (stat.cacheHits / stat.requests) * 100 : 0,
      }));

      // Add cache hit rates from health table
      if (providerHealth) {
        for (const health of providerHealth) {
          const provider = providers.find((p: any) => p.name === health.provider);
          if (provider) {
            provider.cacheHitRate = health.cache_hit_rate || provider.cacheHitRate;
          }
        }
      }

      return {
        gemini: {
          requests: geminiLogs.length,
          avgLatency: geminiAvgLatency,
          successRate: geminiLogs.length > 0 ? (geminiSuccess / geminiLogs.length) * 100 : 0,
        },
        providers,
      };
    } catch (error) {
      console.error('Failed to get provider analytics:', error);
      return {
        gemini: { requests: 0, avgLatency: 0, successRate: 0 },
        providers: [],
      };
    }
  }
}

export const analyticsEngine = new AnalyticsEngine();
