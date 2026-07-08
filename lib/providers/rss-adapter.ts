// RSS Adapter
// Comprehensive RSS feed manager with concurrent fetching, normalization, and trend detection

import { BaseAdapter } from './base-adapter';
import Parser from 'rss-parser';
import { RSS_SOURCES, getEnabledRSSSources, RSSSource } from '../config/rss-sources';
import { cacheEngine } from '../cache/cache-engine';
import { knowledgeEngine } from '../knowledge/knowledge-engine';
import { createSupabaseServer } from '../supabase-server';

export interface NormalizedArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  url: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  category: string;
  country: string;
  publishedAt: string;
  credibilityScore: number;
  keywords: string[];
  entities: string[];
  hash: string;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  keywords: string[];
  frequency: number;
  uniqueSources: number;
  credibilityScore: number;
  recencyScore: number;
  trendScore: number;
  lastUpdated: string;
  sampleArticles: NormalizedArticle[];
}

export interface RSSFeedHealth {
  sourceId: string;
  sourceName: string;
  healthy: boolean;
  lastSuccess: string | null;
  lastFailure: string | null;
  consecutiveFailures: number;
  totalFetches: number;
  successRate: number;
  averageResponseTime: number;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
  'now', 'here', 'there', 'then', 'once', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
  'their', 'your', 'our', 'its', 'says', 'said', 'new', 'first', 'last', 'get',
]);

export class RSSAdapter extends BaseAdapter {
  name = 'rss_adapter';
  private parser: Parser;
  private feedHealth: Map<string, RSSFeedHealth> = new Map();
  private trendingCache: TrendingTopic[] | null = null;
  private trendingCacheTime: number = 0;
  private readonly TRENDING_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    super();
    this.parser = new Parser({
      timeout: 30000, // Increased from 15s to 30s to handle slow feeds
      customFields: {
        item: [
          ['media:content', 'media'],
          ['pubDate', 'publishedAt'],
          ['content:encoded', 'content'],
          ['description', 'description'],
        ],
      },
    });
    this.timeout = 30000; // Update adapter timeout to match
  }

  async search(query: string, options?: any): Promise<any> {
    // Search across all RSS feeds for matching articles
    const articles = await this.fetchAllArticles();
    
    const queryLower = query.toLowerCase();
    const matches = articles.filter(article => 
      article.title.toLowerCase().includes(queryLower) ||
      article.content.toLowerCase().includes(queryLower) ||
      article.keywords.some(kw => kw.toLowerCase().includes(queryLower))
    );

    return {
      items: matches.slice(0, options?.limit || 20),
      total: matches.length,
    };
  }

  async fetch(id: string, options?: any): Promise<any> {
    // Fetch specific article by ID
    const articles = await this.fetchAllArticles();
    return articles.find(a => a.id === id) || null;
  }

  async latest(options?: any): Promise<any> {
    // Get latest articles from all feeds
    const articles = await this.fetchAllArticles();
    const limit = options?.limit || 20;
    
    return {
      items: articles
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, limit),
    };
  }

  async trending(options?: any): Promise<any> {
    // Get trending topics
    const topics = await this.getTrendingTopics();
    const limit = options?.limit || 10;
    
    return {
      items: topics.slice(0, limit),
    };
  }

  async details(url: string, options?: any): Promise<any> {
    // RSS doesn't support full article details
    return { error: 'Not implemented for RSS' };
  }

  /**
   * Fetch articles from all enabled RSS sources concurrently
   */
  async fetchAllArticles(): Promise<NormalizedArticle[]> {
    const cacheKey = 'rss:all_articles';
    const cached = await cacheEngine.get(cacheKey, 'news');
    
    if (cached) {
      return cached;
    }

    const sources = getEnabledRSSSources();
    const fetchPromises = sources.map(source => this.fetchFromSource(source));
    
    const results = await Promise.allSettled(fetchPromises);
    const allArticles: NormalizedArticle[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allArticles.push(...result.value);
      }
    }

    // Remove duplicates
    const uniqueArticles = this.deduplicateArticles(allArticles);

    // Cache for 15 minutes
    await cacheEngine.set(cacheKey, uniqueArticles, 'news', 15 * 60);

    return uniqueArticles;
  }

  /**
   * Fetch articles from a single RSS source
   */
  private async fetchFromSource(source: RSSSource): Promise<NormalizedArticle[]> {
    const startTime = Date.now();
    
    try {
      const feed = await this.parser.parseURL(source.rssUrl);
      const responseTime = Date.now() - startTime;

      const articles: NormalizedArticle[] = feed.items.map(item => {
        const title = item.title || '';
        const link = item.link || '';
        const content = item['content:encoded'] || item.content || item.description || '';
        const summary = this.extractSummary(content);
        const keywords = this.extractKeywords(title + ' ' + content);
        const entities = this.extractEntities(title + ' ' + content);
        const hash = this.generateHash(title + link);

        return {
          id: `rss-${source.id}-${hash}`,
          title,
          content,
          summary,
          url: link,
          sourceId: source.id,
          sourceName: source.name,
          sourceUrl: source.website,
          category: source.category,
          country: source.country,
          publishedAt: item.pubDate || new Date().toISOString(),
          credibilityScore: source.credibilityScore,
          keywords,
          entities,
          hash,
        };
      });

      // Update health
      this.updateFeedHealth(source.id, true, responseTime);

      // Send to knowledge engine
      this.sendToKnowledgeEngine(articles, source);

      return articles;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateFeedHealth(source.id, false, responseTime);
      console.error(`Failed to fetch from ${source.name}:`, error);
      return [];
    }
  }

  /**
   * Remove duplicate articles based on content hash
   */
  private deduplicateArticles(articles: NormalizedArticle[]): NormalizedArticle[] {
    const seen = new Set<string>();
    const unique: NormalizedArticle[] = [];

    for (const article of articles) {
      if (!seen.has(article.hash)) {
        seen.add(article.hash);
        unique.push(article);
      }
    }

    return unique;
  }

  /**
   * Extract a summary from content (first 200 chars)
   */
  private extractSummary(content: string): string {
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  /**
   * Extract keywords from text (deterministic, no AI)
   */
  private extractKeywords(text: string): string[] {
    // Remove HTML tags and URLs first
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/https?:\/\/[^\s]+/g, ' ')
      .replace(/www\.[^\s]+/g, ' ')
      .replace(/\.(com|org|net|gov|edu|io|co|ng|uk|us)/g, ' ')
      .replace(/\b\d{4}\b/g, ' ') // Remove years
      .replace(/\b\d+\b/g, ' ') // Remove other numbers
      .replace(/[^\w\s]/g, ' ');

    const words = cleanText
      .toLowerCase()
      .split(/\s+/)
      .filter(word => {
        // Filter out technical terms and noise
        if (word.length < 3) return false;
        if (STOP_WORDS.has(word)) return false;
        
        // Filter HTML/technical terms
        const technicalTerms = new Set([
          'https', 'http', 'www', 'com', 'org', 'net', 'gov', 'edu', 'io', 'co',
          'caption', 'width', 'height', 'class', 'src', 'alt', 'href', 'title',
          'style', 'div', 'span', 'img', 'figure', 'figcaption', 'attachment',
          'wp', 'content', 'files', 'media', 'upload', 'jpg', 'png', 'jpeg',
          'webp', 'svg', 'gif', 'mp4', 'webm', 'rss', 'xml', 'feed', 'channelstv',
          'premiumtimesng', 'nature', 'd41586', '1038', '026', '01673', '02090',
          '02110', '10882', 's41586', 'ay0lvt', 'bfy22', 'seumw9', 'cdzglt',
          'quffmq', 'x1zz6', '6oyams', 'rsquo', 'ndash', 'hellip', 'ldquo',
          'rdquo', 'strong', 'read', 'also', 'published', 'online', 'doi',
        ]);
        
        if (technicalTerms.has(word)) return false;
        
        // Filter pure numbers
        if (/^\d+$/.test(word)) return false;
        
        // Filter DOI-like patterns
        if (/^\d+\.\d+/.test(word)) return false;
        
        return true;
      });

    // Count frequency
    const frequency: Record<string, number> = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }

    // Return top keywords
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract named entities from text (deterministic, no AI)
   * Uses simple capitalization patterns for person, organization, location detection
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    // Capitalized words (potential proper nouns)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
    const uniqueCapitalized = [...new Set(capitalizedWords)];
    
    // Filter out common words that happen to be capitalized
    const commonCapitalized = new Set([
      'The', 'This', 'That', 'These', 'Those', 'A', 'An', 'And', 'Or', 'But',
      'In', 'On', 'At', 'To', 'For', 'Of', 'With', 'By', 'From', 'As',
    ]);

    for (const word of uniqueCapitalized) {
      if (!commonCapitalized.has(word) && word.length > 2) {
        entities.push(word);
      }
    }

    return entities.slice(0, 5);
  }

  /**
   * Update feed health status
   */
  private updateFeedHealth(sourceId: string, success: boolean, responseTime: number): void {
    const current = this.feedHealth.get(sourceId) || {
      sourceId,
      sourceName: RSS_SOURCES.find(s => s.id === sourceId)?.name || sourceId,
      healthy: true,
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      totalFetches: 0,
      successRate: 1,
      averageResponseTime: 0,
    };

    current.totalFetches++;
    const now = new Date().toISOString();

    if (success) {
      current.lastSuccess = now;
      current.consecutiveFailures = 0;
      current.healthy = true;
      
      // Update average response time
      const totalResponseTime = current.averageResponseTime * (current.totalFetches - 1) + responseTime;
      current.averageResponseTime = totalResponseTime / current.totalFetches;
    } else {
      current.lastFailure = now;
      current.consecutiveFailures++;
      
      // Mark as unhealthy after 3 consecutive failures
      if (current.consecutiveFailures >= 3) {
        current.healthy = false;
      }
    }

    // Calculate success rate
    const failures = current.totalFetches - (current.successRate * (current.totalFetches - 1));
    current.successRate = (current.totalFetches - failures) / current.totalFetches;

    this.feedHealth.set(sourceId, current);

    // Persist to database
    this.persistFeedHealth(current);
  }

  /**
   * Persist feed health to database
   */
  private async persistFeedHealth(health: RSSFeedHealth): Promise<void> {
    try {
      const supabase = createSupabaseServer();
      
      await supabase.from('rss_feed_health').upsert({
        source_id: health.sourceId,
        source_name: health.sourceName,
        healthy: health.healthy,
        last_success: health.lastSuccess,
        last_failure: health.lastFailure,
        consecutive_failures: health.consecutiveFailures,
        total_fetches: health.totalFetches,
        success_rate: health.successRate,
        average_response_time: health.averageResponseTime,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to persist feed health:', error);
    }
  }

  /**
   * Get health status of all feeds
   */
  async getFeedHealth(): Promise<RSSFeedHealth[]> {
    // Load from database first
    try {
      const supabase = createSupabaseServer();
      const { data } = await supabase.from('rss_feed_health').select('*');
      
      if (data) {
        for (const row of data) {
          this.feedHealth.set(row.source_id, {
            sourceId: row.source_id,
            sourceName: row.source_name,
            healthy: row.healthy,
            lastSuccess: row.last_success,
            lastFailure: row.last_failure,
            consecutiveFailures: row.consecutive_failures,
            totalFetches: row.total_fetches,
            successRate: row.success_rate,
            averageResponseTime: row.average_response_time,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load feed health:', error);
    }

    return Array.from(this.feedHealth.values());
  }

  /**
   * Send articles to Knowledge Engine
   */
  private async sendToKnowledgeEngine(articles: NormalizedArticle[], source: RSSSource): Promise<void> {
    try {
      for (const article of articles) {
        try {
          const document = await knowledgeEngine.normalize(this.name, {
            id: article.id,
            title: article.title,
            content: article.content,
            summary: article.summary,
            sourceUrl: article.url,
            category: article.category,
            credibilityScore: article.credibilityScore,
            keywords: article.keywords,
            tags: article.entities,
            country: article.country,
            publishedAt: article.publishedAt,
          });
          
          await knowledgeEngine.store(document);
        } catch (error: any) {
          // Skip duplicate key errors silently
          if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
            // Document already exists, skip it
            continue;
          }
          // Log other errors but continue processing
          console.error(`Failed to store article ${article.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to send articles to knowledge engine:', error);
    }
  }

  /**
   * Get trending topics (deterministic, no AI)
   */
  async getTrendingTopics(): Promise<TrendingTopic[]> {
    const now = Date.now();
    
    // Check cache
    if (this.trendingCache && (now - this.trendingCacheTime) < this.TRENDING_CACHE_DURATION) {
      return this.trendingCache;
    }

    const articles = await this.fetchAllArticles();
    const topics = this.analyzeTrendingTopics(articles);
    
    this.trendingCache = topics;
    this.trendingCacheTime = now;

    return topics;
  }

  /**
   * Analyze trending topics from articles (deterministic logic)
   */
  private analyzeTrendingTopics(articles: NormalizedArticle[]): TrendingTopic[] {
    const keywordFrequency: Record<string, {
      count: number;
      sources: Set<string>;
      articles: NormalizedArticle[];
      credibilitySum: number;
      oldestDate: Date;
    }> = {};

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const article of articles) {
      const articleDate = new Date(article.publishedAt);
      
      // Only consider articles from the last day for trending
      if (articleDate < oneDayAgo) continue;

      for (const keyword of article.keywords) {
        if (!keywordFrequency[keyword]) {
          keywordFrequency[keyword] = {
            count: 0,
            sources: new Set(),
            articles: [],
            credibilitySum: 0,
            oldestDate: articleDate,
          };
        }

        keywordFrequency[keyword].count++;
        keywordFrequency[keyword].sources.add(article.sourceId);
        keywordFrequency[keyword].articles.push(article);
        keywordFrequency[keyword].credibilitySum += article.credibilityScore;
        
        if (articleDate < keywordFrequency[keyword].oldestDate) {
          keywordFrequency[keyword].oldestDate = articleDate;
        }
      }
    }

    // Convert to topics
    const topics: TrendingTopic[] = Object.entries(keywordFrequency).map(([keyword, data]) => {
      const uniqueSources = data.sources.size;
      const credibilityScore = data.credibilitySum / data.count;
      
      // Calculate recency score (more recent = higher)
      const hoursSinceOldest = (now.getTime() - data.oldestDate.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 1 - (hoursSinceOldest / 24));

      // Calculate trend score
      const trendScore = (
        data.count * 0.3 +           // Frequency
        uniqueSources * 0.3 +       // Number of sources
        credibilityScore * 0.2 +     // Credibility
        recencyScore * 0.2           // Recency
      );

      return {
        id: `trend-${keyword}`,
        topic: keyword,
        keywords: [keyword, ...data.articles[0]?.keywords.slice(0, 4) || []],
        frequency: data.count,
        uniqueSources,
        credibilityScore,
        recencyScore,
        trendScore,
        lastUpdated: now.toISOString(),
        sampleArticles: data.articles.slice(0, 3),
      };
    });

    // Sort by trend score and return top 20
    return topics
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 20);
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(category: string): Promise<NormalizedArticle[]> {
    const articles = await this.fetchAllArticles();
    return articles.filter(a => a.category === category);
  }

  /**
   * Get articles by country
   */
  async getArticlesByCountry(country: string): Promise<NormalizedArticle[]> {
    const articles = await this.fetchAllArticles();
    return articles.filter(a => a.country === country);
  }
}

export const rssAdapter = new RSSAdapter();
