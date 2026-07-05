// Google Search Adapter
// Category-based search using Programmable Search Engine

import { BaseAdapter } from './base-adapter';
import axios from 'axios';
import { getCategoryFromQuery, getDomainsForCategory, SEARCH_CATEGORIES } from '../config/search-categories';

export class GoogleSearchAdapter extends BaseAdapter {
  name = 'google_search';
  private apiKey: string | undefined;
  private searchEngineId: string | undefined;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor() {
    super();
    this.apiKey = process.env.GOOGLE_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  }

  async search(query: string, options?: any): Promise<any> {
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Google Search API key or Search Engine ID not configured');
    }

    // Determine category from query
    const category = options?.category || getCategoryFromQuery(query);
    const domains = getDomainsForCategory(category);

    return this.withRetry(async () => {
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
      });

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
    }, 'search');
  }

  async fetch(id: string, options?: any): Promise<any> {
    // Google Search doesn't support fetch by ID
    // This would need to use the cache or fetch the URL directly
    return { error: 'Not implemented for Google Search' };
  }

  async latest(options?: any): Promise<any> {
    // Google Search doesn't have a "latest" concept
    // Could use date-restricted search
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const dateStr = date.toISOString().split('T')[0];

    return this.search(options?.query || 'latest news', {
      ...options,
      dateRestrict: `d${7}`,
    });
  }

  async trending(options?: any): Promise<any> {
    // Google Search doesn't have a "trending" concept
    // Could use trending keywords or recent searches
    return this.search(options?.query || 'trending', options);
  }

  async details(url: string, options?: any): Promise<any> {
    // Google Search doesn't support details by URL
    // This would need to fetch the URL directly and parse
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
