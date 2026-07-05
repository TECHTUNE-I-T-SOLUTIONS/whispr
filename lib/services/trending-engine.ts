// Trending Engine
// Operates independently of AI following docs/V2/ section 21

import { googleNewsRSSAdapter } from '../providers/google-news-rss-adapter';
import { githubAdapter } from '../providers/github-adapter';
import { youtubeAdapter } from '../providers/youtube-adapter';
import { cacheEngine } from '../cache/cache-engine';
import { createSupabaseServer } from '../supabase-server';

class TrendingEngine {
  async getTrending(options?: {
    category?: string;
    region?: string;
    limit?: number;
  }): Promise<{
    news: any[];
    github: any[];
    youtube: any[];
    overall: any[];
  }> {
    const cacheKey = cacheEngine.generateCacheKey(
      'trending',
      options?.category || 'all',
      options?.region || 'US',
      options?.limit?.toString() || '20'
    );
    
    const cached = await cacheEngine.get(cacheKey, 'trending');
    if (cached) {
      return cached;
    }

    const limit = options?.limit || 20;

    // Fetch trending from all sources
    const [news, github, youtube] = await Promise.all([
      this.getTrendingNews(limit),
      this.getTrendingGitHub(limit),
      this.getTrendingYouTube(limit, options?.region),
    ]);

    // Combine and rank
    const overall = this.rankTrending([...news, ...github, ...youtube]);

    const result = {
      news,
      github,
      youtube,
      overall: overall.slice(0, limit),
    };

    // Cache for 30 minutes
    await cacheEngine.set(cacheKey, result, 'trending', 30 * 60);

    return result;
  }

  private async getTrendingNews(limit: number): Promise<any[]> {
    try {
      const result = await googleNewsRSSAdapter.trending();
      return (result.items || []).slice(0, limit).map((item: any) => ({
        id: item.guid,
        title: item.title,
        url: item.link,
        source: 'news',
        publishedAt: item.pubDate,
        score: this.calculateNewsScore(item),
      }));
    } catch (error) {
      console.error('Failed to get trending news:', error);
      return [];
    }
  }

  private async getTrendingGitHub(limit: number): Promise<any[]> {
    try {
      const result = await githubAdapter.trending();
      return (result.items || []).slice(0, limit).map((repo: any) => ({
        id: repo.id,
        title: repo.name,
        url: repo.url,
        source: 'github',
        stars: repo.stars,
        forks: repo.forks,
        score: this.calculateGitHubScore(repo),
      }));
    } catch (error) {
      console.error('Failed to get trending GitHub:', error);
      return [];
    }
  }

  private async getTrendingYouTube(limit: number, region?: string): Promise<any[]> {
    try {
      const result = await youtubeAdapter.trending({ regionCode: region });
      return (result.items || []).slice(0, limit).map((video: any) => ({
        id: video.id,
        title: video.title,
        url: video.url,
        source: 'youtube',
        views: video.statistics?.viewCount,
        score: this.calculateYouTubeScore(video),
      }));
    } catch (error) {
      console.error('Failed to get trending YouTube:', error);
      return [];
    }
  }

  private calculateNewsScore(item: any): number {
    let score = 0;
    
    // Recency boost
    if (item.pubDate) {
      const age = Date.now() - new Date(item.pubDate).getTime();
      const ageInHours = age / (1000 * 60 * 60);
      if (ageInHours < 1) score += 50;
      else if (ageInHours < 6) score += 30;
      else if (ageInHours < 24) score += 10;
    }

    return score;
  }

  private calculateGitHubScore(repo: any): number {
    let score = 0;
    
    // Stars are the primary signal
    score += Math.log(repo.stars + 1) * 10;
    
    // Forks indicate engagement
    score += Math.log(repo.forks + 1) * 5;
    
    // Recent activity boost
    if (repo.updatedAt) {
      const age = Date.now() - new Date(repo.updatedAt).getTime();
      const ageInDays = age / (1000 * 60 * 60 * 24);
      if (ageInDays < 7) score += 20;
      else if (ageInDays < 30) score += 10;
    }

    return score;
  }

  private calculateYouTubeScore(video: any): number {
    let score = 0;
    
    // Views are the primary signal
    if (video.views) {
      score += Math.log(parseInt(video.views) + 1) * 5;
    }
    
    // Recency boost
    if (video.publishedAt) {
      const age = Date.now() - new Date(video.publishedAt).getTime();
      const ageInHours = age / (1000 * 60 * 60);
      if (ageInHours < 24) score += 30;
      else if (ageInHours < 168) score += 10;
    }

    return score;
  }

  private rankTrending(items: any[]): any[] {
    return items.sort((a, b) => b.score - a.score);
  }

  async getTrendingTopics(limit: number = 10): Promise<string[]> {
    try {
      const supabase = createSupabaseServer();
      
      // Get topics from knowledge documents with highest trending scores
      const { data: docs } = await supabase
        .from('knowledge_documents')
        .select('tags, category, keywords, trending_score')
        .gt('trending_score', 0)
        .order('trending_score', { ascending: false })
        .limit(100);

      if (!docs) {
        return [];
      }

      // Aggregate topic frequencies
      const topicCounts: Record<string, number> = {};
      
      for (const doc of docs) {
        const allTopics = [
          ...(doc.tags || []),
          doc.category,
          ...(doc.keywords || []),
        ].filter(Boolean);

        for (const topic of allTopics) {
          const normalized = topic.toLowerCase();
          topicCounts[normalized] = (topicCounts[normalized] || 0) + (doc.trending_score || 0);
        }
      }

      // Sort by score and return top N
      return Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([topic]) => topic);
    } catch (error) {
      console.error('Failed to get trending topics:', error);
      return [];
    }
  }

  async updateTrendingScores(): Promise<void> {
    try {
      const supabase = createSupabaseServer();
      
      // For MVP, we'll do a simple update without RPC functions
      // Decay existing trending scores
      const { data: docs } = await supabase
        .from('knowledge_documents')
        .select('id, trending_score')
        .gt('trending_score', 0);

      if (docs) {
        for (const doc of docs) {
          const newScore = (doc.trending_score || 0) * 0.9;
          await supabase
            .from('knowledge_documents')
            .update({ trending_score: newScore })
            .eq('id', doc.id);
        }
      }

      // Boost recently accessed content (simplified)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      // This would be better with a proper RPC function, but for MVP we'll skip
      // the complex boost logic and just rely on the decay

    } catch (error) {
      console.error('Failed to update trending scores:', error);
    }
  }
}

export const trendingEngine = new TrendingEngine();
