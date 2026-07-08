// Search Engine
// Searches Whispr before searching the internet following docs/V2/ section 30
// Runs all external providers in parallel and combines results

import { knowledgeEngine } from '../knowledge/knowledge-engine';
import { cacheEngine } from '../cache/cache-engine';
import { wikipediaAdapter } from '../providers/wikipedia-adapter';
import { googleNewsRSSAdapter } from '../providers/google-news-rss-adapter';
import { rssAdapter } from '../providers/rss-adapter';
import { githubAdapter } from '../providers/github-adapter';
import { youtubeAdapter } from '../providers/youtube-adapter';
import { googleSearchAdapter } from '../providers/google-search-adapter';
import { bingSearchAdapter } from '../providers/bing-search-adapter';
import { getCategoryFromQuery } from '../config/search-categories';
import { createSupabaseServer } from '../supabase-server';
import { addUtmTracking, getSourceLabel, getSourceIcon } from '../utils/utm';

class SearchEngine {
  async search(query: string, options?: {
    type?: 'all' | 'articles' | 'blogs' | 'news' | 'videos' | 'repositories';
    limit?: number;
    userId?: string;
  }): Promise<{
    local: any[];
    external: any[];
    combined: any[];
  }> {
    const limit = options?.limit || 20;
    const type = options?.type || 'all';

    // Check cache first
    const cacheKey = cacheEngine.generateCacheKey('search', query, type, limit.toString());
    const cached = await cacheEngine.get(cacheKey, 'search');
    if (cached) {
      return cached;
    }

    // Priority 1: Search cache (already checked above)
    
    // Priority 2: Search knowledge base
    const localResults = await this.searchLocal(query, type, limit);

    // Priority 3: Search database (posts, chronicles)
    const databaseResults = await this.searchDatabase(query, type, limit);

    // Priority 4: Search ALL external providers in parallel
    const externalResults = await this.searchExternal(query, type, limit);

    // Combine and deduplicate
    const combined = this.deduplicateAndRank([...localResults, ...databaseResults, ...externalResults]);

    const result = {
      local: localResults,
      external: externalResults,
      combined: combined.slice(0, limit),
    };

    // Cache the result
    await cacheEngine.set(cacheKey, result, 'search', 24 * 60 * 60); // 24 hours

    return result;
  }

  private async searchLocal(query: string, type: string, limit: number): Promise<any[]> {
    const results: any[] = [];

    try {
      const knowledgeDocs = await knowledgeEngine.retrieve(query, {
        limit,
        minCredibility: 0.5,
      });

      for (const doc of knowledgeDocs) {
        if (this.matchesType(doc, type)) {
          results.push({
            id: doc.id,
            title: doc.title,
            summary: doc.summary,
            url: doc.sourceUrl,
            source: 'knowledge',
            type: this.inferType(doc),
            credibility: doc.credibilityScore,
            trending: doc.trendingScore,
            provider: doc.provider,
          });
        }
      }
    } catch (error) {
      console.error('Failed to search local knowledge:', error);
    }

    return results;
  }

  private async searchDatabase(query: string, type: string, limit: number): Promise<any[]> {
    const results: any[] = [];
    const supabase = createSupabaseServer();

    try {
      // Search posts
      if (type === 'all' || type === 'articles' || type === 'blogs') {
        const { data: posts } = await supabase
          .from('posts')
          .select('id, title, content, excerpt, type, slug, view_count')
          .eq('status', 'published')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
          .limit(limit);

        if (posts) {
          for (const post of posts) {
            results.push({
              id: post.id,
              title: post.title,
              summary: post.excerpt || post.content?.substring(0, 200),
              url: `/blog/${post.slug}`,
              source: 'database',
              type: post.type,
              views: post.view_count,
            });
          }
        }
      }

      // Search chronicles posts
      if (type === 'all' || type === 'articles' || type === 'blogs') {
        const { data: chronicles } = await supabase
          .from('chronicles_posts')
          .select('id, title, content, excerpt, post_type, slug, views_count')
          .eq('status', 'published')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
          .limit(limit);

        if (chronicles) {
          for (const post of chronicles) {
            results.push({
              id: post.id,
              title: post.title,
              summary: post.excerpt || post.content?.substring(0, 200),
              url: `/chronicles/${post.slug}`,
              source: 'chronicles',
              type: post.post_type,
              views: post.views_count,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to search database:', error);
    }

    return results;
  }

  private async searchExternal(query: string, type: string, limit: number): Promise<any[]> {
    const category = getCategoryFromQuery(query);
    const results: any[] = [];
    const perProviderLimit = Math.max(3, Math.ceil(limit / 5)); // Distribute limit across providers

    // Run ALL external providers in parallel for maximum speed
    const providers: Promise<void>[] = [];

    // 1. Google Search / DuckDuckGo
    if (type === 'all' || type === 'articles') {
      providers.push((async () => {
        try {
          const googleResults = await googleSearchAdapter.search(query, {
            category,
            num: perProviderLimit,
          });
          if (googleResults.items) {
            for (const item of googleResults.items) {
              results.push({
                id: `google-${item.id}`,
                title: item.title,
                summary: item.snippet,
                url: addUtmTracking(item.link, item.source || 'google_search'),
                source: item.source || 'google_search',
                sourceLabel: getSourceLabel(item.source || 'google_search'),
                sourceIcon: getSourceIcon(item.source || 'google_search'),
                type: 'article',
                category: item.category || category,
                credibility: 0.8,
                displayLink: item.displayLink,
              });
            }
          }
        } catch (error) {
          console.error('Google Search failed:', (error as Error).message);
        }
      })());

      // Also try Bing if available
      providers.push((async () => {
        try {
          const bingResults = await bingSearchAdapter.search(query, {
            category,
            num: perProviderLimit,
          });
          if (bingResults.items) {
            for (const item of bingResults.items) {
              results.push({
                id: `bing-${item.id}`,
                title: item.title,
                summary: item.snippet,
                url: addUtmTracking(item.link, 'bing_search'),
                source: 'bing_search',
                sourceLabel: getSourceLabel('bing_search'),
                sourceIcon: getSourceIcon('bing_search'),
                type: 'article',
                category: item.category || category,
                credibility: 0.8,
                displayLink: item.displayLink,
              });
            }
          }
        } catch (error) {
          console.error('Bing Search failed:', (error as Error).message);
        }
      })());
    }

    // 2. Wikipedia
    if (category === 'knowledge' || type === 'all' || type === 'articles') {
      providers.push((async () => {
        try {
          const wikiResults = await wikipediaAdapter.search(query, { limit: perProviderLimit });
          if (wikiResults.pages) {
            for (const page of wikiResults.pages) {
              results.push({
                id: `wiki-${page.pageid}`,
                title: page.title,
                summary: page.excerpt,
                url: addUtmTracking(`https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`, 'wikipedia'),
                source: 'wikipedia',
                sourceLabel: getSourceLabel('wikipedia'),
                sourceIcon: getSourceIcon('wikipedia'),
                type: 'article',
                credibility: 0.9,
              });
            }
          }
        } catch (error) {
          console.error('Wikipedia search failed:', (error as Error).message);
        }
      })());
    }

    // 3. GitHub
    if (category === 'programming' || category === 'developer_communities' || type === 'all' || type === 'repositories') {
      providers.push((async () => {
        try {
          const githubResults = await githubAdapter.search(query, { limit: perProviderLimit });
          if (githubResults.items) {
            for (const repo of githubResults.items) {
              results.push({
                id: `github-${repo.id}`,
                title: repo.name,
                summary: repo.description,
                url: addUtmTracking(repo.url, 'github'),
                source: 'github',
                sourceLabel: getSourceLabel('github'),
                sourceIcon: getSourceIcon('github'),
                type: 'repository',
                stars: repo.stars,
              });
            }
          }
        } catch (error) {
          console.error('GitHub search failed:', (error as Error).message);
        }
      })());
    }

    // 4. YouTube
    if (type === 'all' || type === 'videos') {
      providers.push((async () => {
        try {
          const youtubeResults = await youtubeAdapter.search(query, { maxResults: perProviderLimit });
          if (youtubeResults.items) {
            for (const video of youtubeResults.items) {
              results.push({
                id: `youtube-${video.id}`,
                title: video.title,
                summary: video.description,
                url: addUtmTracking(video.url, 'youtube'),
                source: 'youtube',
                sourceLabel: getSourceLabel('youtube'),
                sourceIcon: getSourceIcon('youtube'),
                type: 'video',
                channel: video.channelTitle,
              });
            }
          }
        } catch (error) {
          console.error('YouTube search failed:', (error as Error).message);
        }
      })());
    }

    // 5. News
    if (category === 'news' || type === 'all' || type === 'news') {
      providers.push((async () => {
        try {
          const newsResults = await googleNewsRSSAdapter.search(query);
          if (newsResults.items) {
            for (const item of newsResults.items.slice(0, perProviderLimit)) {
              results.push({
                id: `news-${item.guid}`,
                title: item.title,
                summary: item.content,
                url: addUtmTracking(item.link, 'news'),
                source: 'news',
                sourceLabel: getSourceLabel('news'),
                sourceIcon: getSourceIcon('news'),
                type: 'news',
                publishedAt: item.pubDate,
              });
            }
          }
        } catch (error) {
          console.error('News search failed:', (error as Error).message);
        }
      })());

      // Also search RSS feeds
      providers.push((async () => {
        try {
          const rssResults = await rssAdapter.search(query, { limit: perProviderLimit });
          if (rssResults.items) {
            for (const item of rssResults.items) {
              results.push({
                id: item.id,
                title: item.title,
                summary: item.summary,
                url: addUtmTracking(item.url, 'rss'),
                source: 'rss',
                sourceLabel: item.sourceName,
                sourceIcon: getSourceIcon('rss'),
                type: 'news',
                category: item.category,
                credibility: item.credibilityScore,
                publishedAt: item.publishedAt,
              });
            }
          }
        } catch (error) {
          console.error('RSS search failed:', (error as Error).message);
        }
      })());
    }

    // Wait for all providers to complete (or timeout)
    await Promise.all(providers);

    return results;
  }

  private matchesType(doc: any, type: string): boolean {
    if (type === 'all') return true;

    const docType = this.inferType(doc);
    return docType === type;
  }

  private inferType(doc: any): string {
    if (doc.provider === 'youtube') return 'videos';
    if (doc.provider === 'github') return 'repositories';
    if (doc.provider === 'google_news_rss') return 'news';
    if (doc.category) {
      const lower = doc.category.toLowerCase();
      if (lower.includes('video')) return 'videos';
      if (lower.includes('repo') || lower.includes('code')) return 'repositories';
      if (lower.includes('news')) return 'news';
    }
    return 'articles';
  }

  private deduplicateAndRank(results: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const result of results) {
      const key = `${result.source}-${result.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    // Rank by credibility and trending
    return unique.sort((a, b) => {
      const scoreA = (a.credibility || 0.5) * 0.7 + (a.trending || 0) * 0.3;
      const scoreB = (b.credibility || 0.5) * 0.7 + (b.trending || 0) * 0.3;
      return scoreB - scoreA;
    });
  }

  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      const supabase = createSupabaseServer();

      // Get recent searches
      const { data: recentSearches } = await supabase
        .from('search_analytics')
        .select('query')
        .ilike('query', `%${query}%`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      const suggestions: string[] = [];

      if (recentSearches) {
        for (const search of recentSearches) {
          if (!suggestions.includes(search.query)) {
            suggestions.push(search.query);
          }
        }
      }

      // Get popular searches
      if (suggestions.length < limit) {
        const { data: popular } = await supabase
          .from('search_analytics')
          .select('query')
          .ilike('query', `%${query}%`)
          .order('timestamp', { ascending: false })
          .limit(limit * 2);

        if (popular) {
          const counts: Record<string, number> = {};
          for (const search of popular) {
            counts[search.query] = (counts[search.query] || 0) + 1;
          }

          const sorted = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .map(([query]) => query);

          for (const query of sorted) {
            if (!suggestions.includes(query) && suggestions.length < limit) {
              suggestions.push(query);
            }
          }
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }
}

export const searchEngine = new SearchEngine();