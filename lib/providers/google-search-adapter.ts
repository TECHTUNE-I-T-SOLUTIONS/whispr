// Google Search Adapter
// Category-based search using Programmable Search Engine
// Falls back to public search if API key is not configured or fails

import { BaseAdapter } from './base-adapter';
import axios from 'axios';
import { getCategoryFromQuery, getDomainsForCategory, SEARCH_CATEGORIES } from '../config/search-categories';

export class GoogleSearchAdapter extends BaseAdapter {
  name = 'google_search';
  private apiKey: string | undefined;
  private searchEngineId: string | undefined;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';
  protected timeout = 5000;
  protected maxRetries = 0; // No retries - fail fast

  constructor() {
    super();
    this.apiKey = process.env.GOOGLE_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  }

  async search(query: string, options?: any): Promise<any> {
    // If API key and engine ID are configured, try the Google API
    if (this.apiKey && this.searchEngineId) {
      try {
        return await this.searchWithGoogleAPI(query, options);
      } catch (error) {
        console.warn('Google Custom Search API failed, falling back to public search:', (error as Error).message);
      }
    } else {
      console.warn('Google Search API key or Search Engine ID not configured, using public fallback');
    }

    // Fallback: Use public search (no API key required)
    return this.searchWithPublicFallback(query, options);
  }

  private async searchWithGoogleAPI(query: string, options?: any): Promise<any> {
    const category = options?.category || getCategoryFromQuery(query);
    const domains = getDomainsForCategory(category);

    const params: any = {
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query,
      num: options?.num || 10,
    };

    // Add site filtering if domains are specified
    if (domains.length > 0) {
      const siteFilter = domains.map(domain => `site:${domain}`).join(' OR ');
      params.q = `${query} (${siteFilter})`;
    }

    const response = await axios.get(this.baseUrl, {
      params,
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000,
      validateStatus: (status) => status < 500,
    });

    if (response.status !== 200) {
      const errorBody = response?.data?.error || {};
      const reason = errorBody.message || JSON.stringify(errorBody);
      const statusCode = response.status;
      // Log full error details for debugging
      console.error('Google Custom Search API full error:', JSON.stringify({
        status: statusCode,
        message: errorBody.message,
        errors: errorBody.errors,
        statusDetails: errorBody.status,
      }, null, 2));
      throw new Error(`Google Custom Search API ${statusCode}: ${reason}`);
    }

    return {
      items: response.data.items?.map((item: any) => ({
        id: item.cacheId || item.link,
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        htmlSnippet: item.htmlSnippet,
        htmlTitle: item.htmlTitle,
        displayLink: item.displayLink,
        formattedUrl: item.formattedUrl,
        pagemap: item.pagemap,
        category,
        source: 'google_search',
      })) || [],
      searchInformation: response.data.searchInformation,
      url: response.data.url,
      queries: response.data.queries,
      category,
    };
  }

  private async searchWithPublicFallback(query: string, options?: any): Promise<any> {
    // Use DuckDuckGo's instant answer API (free, no key required)
    try {
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: 1,
          skip_disambig: 1,
        },
        headers: {
          'User-Agent': 'Whispr/1.0',
        },
        timeout: 3000,
      });

      const items: any[] = [];

      // Add abstract (if available)
      if (response.data.AbstractText) {
        items.push({
          id: `ddg-abstract-${encodeURIComponent(query)}`,
          title: response.data.Heading || response.data.AbstractSource || query,
          link: response.data.AbstractURL || '',
          snippet: response.data.AbstractText,
          displayLink: response.data.AbstractSource || 'duckduckgo.com',
          source: 'duckduckgo',
          category: options?.category || 'knowledge',
        });
      }

      // Add related topics
      if (response.data.RelatedTopics) {
        for (const topic of response.data.RelatedTopics.slice(0, 10)) {
          if (topic.Text) {
            items.push({
              id: `ddg-${topic.FirstURL || topic.Text}`,
              title: topic.Text?.split(' - ')?.[0] || topic.Text,
              link: topic.FirstURL || '',
              snippet: topic.Text || '',
              displayLink: 'duckduckgo.com',
              source: 'duckduckgo',
              category: options?.category || 'knowledge',
            });
          }
        }
      }

      // If DuckDuckGo returned nothing useful, try a simple web scrape fallback
      if (items.length === 0) {
        return this.searchWithBasicScrape(query, options);
      }

      return { items };
    } catch (error) {
      console.warn('DuckDuckGo search failed, trying basic scrape:', (error as Error).message);
      return this.searchWithBasicScrape(query, options);
    }
  }

  private async searchWithBasicScrape(query: string, options?: any): Promise<any> {
    // Last resort: Use Wikipedia API directly (free, no key required)
    try {
      const response = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          srlimit: options?.num || 10,
          origin: '*',
        },
        headers: {
          'User-Agent': 'Whispr/1.0 (whisprwords@gmail.com)',
        },
        timeout: 5000,
      });

      const searchResults = response.data?.query?.search || [];

      return {
        items: searchResults.map((page: any) => ({
          id: `wiki-fallback-${page.pageid}`,
          title: page.title,
          link: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
          snippet: page.snippet?.replace(/<\/?[^>]+(>|$)/g, '') || '',
          displayLink: 'en.wikipedia.org',
          source: 'wikipedia',
          category: 'knowledge',
        })),
      };
    } catch (error) {
      console.error('All search fallbacks failed:', (error as Error).message);
      return { items: [] };
    }
  }

  async fetch(id: string, options?: any): Promise<any> {
    return { error: 'Not implemented for Google Search' };
  }

  async latest(options?: any): Promise<any> {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const dateStr = date.toISOString().split('T')[0];

    return this.search(options?.query || 'latest news', {
      ...options,
      dateRestrict: `d${7}`,
    });
  }

  async trending(options?: any): Promise<any> {
    return this.search(options?.query || 'trending', options);
  }

  async details(url: string, options?: any): Promise<any> {
    return { error: 'Not implemented for Google Search' };
  }

  async searchByCategory(
    query: string,
    category: string,
    options?: any
  ): Promise<any> {
    if (!SEARCH_CATEGORIES[category]) {
      throw new Error(`Unknown category: ${category}`);
    }

    return this.search(query, {
      ...options,
      category,
    });
  }

  async searchAllCategories(
    query: string,
    options?: any
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const category of Object.keys(SEARCH_CATEGORIES)) {
      try {
        results[category] = await this.searchByCategory(query, category, options);
      } catch (error) {
        console.error(`Failed to search category ${category}:`, error);
        results[category] = { error: 'Search failed' };
      }
    }

    return results;
  }

  async getAvailableCategories(): Promise<Array<{
    key: string;
    name: string;
    description: string;
    domainCount: number;
  }>> {
    return Object.entries(SEARCH_CATEGORIES).map(([key, category]) => ({
      key,
      name: category.name,
      description: category.description,
      domainCount: category.domains.length,
    }));
  }
}

export const googleSearchAdapter = new GoogleSearchAdapter();