// Search Engine
// Searches Whispr before searching the internet following docs/V2/ section 30

import { knowledgeEngine } from '../knowledge/knowledge-engine';
import { cacheEngine } from '../cache/cache-engine';
import { wikipediaAdapter } from '../providers/wikipedia-adapter';
import { googleNewsRSSAdapter } from '../providers/google-news-rss-adapter';
import { githubAdapter } from '../providers/github-adapter';
import { youtubeAdapter } from '../providers/youtube-adapter';
import { googleSearchAdapter } from '../providers/google-search-adapter';
import { getCategoryFromQuery } from '../config/search-categories';
import { createSupabaseServer } from '../supabase-server';

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

    // Priority 4: Search external providers (if needed)
    const externalResults = localResults.length + databaseResults.length < limit
      ? await this.searchExternal(query, type, limit - localResults.length - databaseResults.length)
      : [];

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
    const results: any[] = [];
    const category = getCategoryFromQuery(query);

    try {
      // Priority 1: Google Search with category-based filtering
      if (type === 'all' || type === 'articles') {
        try {
          const googleResults = await googleSearchAdapter.search(query, {
            category,
            num: Math.floor(limit / 2),
          });

          if (googleResults.items) {
            for (const item of googleResults.items) {
              results.push({
                id: `google-${item.id}`,
                title: item.title,
                summary: item.snippet,
                url: item.link,
                source: 'google_search',
                type: 'article',
                category: item.category,
                credibility: 0.8,
                displayLink: item.displayLink,
              });
            }
          }
        } catch (error) {
          console.error('Google Search failed, falling back to other providers:', error);
        }
      }

      // Priority 2: Search Wikipedia (if knowledge category or general)
      if ((category === 'knowledge' || type === 'all' || type === 'articles') && results.length < limit) {
        const wikiResults = await wikipediaAdapter.search(query, { limit: Math.floor(limit / 4) });
        if (wikiResults.pages) {
          for (const page of wikiResults.pages) {
            results.push({
              id: `wiki-${page.pageid}`,
              title: page.title,
              summary: page.excerpt,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
              source: 'wikipedia',
              type: 'article',
              credibility: 0.9,
            });
          }
        }
      }

      // Priority 3: Search GitHub (if programming or developer communities category)
      if ((category === 'programming' || category === 'developer_communities' || type === 'all' || type === 'repositories') && results.length < limit) {
        const githubResults = await githubAdapter.search(query, { limit: Math.floor(limit / 4) });
        if (githubResults.items) {
          for (const repo of githubResults.items) {
            results.push({
              id: `github-${repo.id}`,
              title: repo.name,
              summary: repo.description,
              url: repo.url,
              source: 'github',
              type: 'repository',
              stars: repo.stars,
            });
          }
        }
      }

      // Priority 4: Search YouTube (if general or video type)
      if ((type === 'all' || type === 'videos') && results.length < limit) {
        const youtubeResults = await youtubeAdapter.search(query, { maxResults: Math.floor(limit / 4) });
        if (youtubeResults.items) {
          for (const video of youtubeResults.items) {
            results.push({
              id: `youtube-${video.id}`,
              title: video.title,
              summary: video.description,
              url: video.url,
              source: 'youtube',
              type: 'video',
              channel: video.channelTitle,
            });
          }
        }
      }

      // Priority 5: Search News (if news category or news type)
      if ((category === 'news' || type === 'all' || type === 'news') && results.length < limit) {
        const newsResults = await googleNewsRSSAdapter.search(query);
        if (newsResults.items) {
          for (const item of newsResults.items.slice(0, Math.floor(limit / 4))) {
            results.push({
              id: `news-${item.guid}`,
              title: item.title,
              summary: item.content,
              url: item.link,
              source: 'news',
              type: 'news',
              publishedAt: item.pubDate,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to search external:', error);
    }

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
