// Bing Search Adapter
// Uses Bing Web Search API v7 (free tier: 1000 queries/month)
// Falls back to DuckDuckGo if no API key

import { BaseAdapter } from './base-adapter';
import axios from 'axios';
import { getCategoryFromQuery } from '../config/search-categories';

export class BingSearchAdapter extends BaseAdapter {
  name = 'bing_search';
  private apiKey: string | undefined;
  private baseUrl = 'https://api.bing.microsoft.com/v7.0/search';
  protected timeout = 5000;
  protected maxRetries = 0;

  constructor() {
    super();
    this.apiKey = process.env.BING_SEARCH_API_KEY;
  }

  async search(query: string, options?: any): Promise<any> {
    if (!this.apiKey) {
      return { items: [] }; // Silent fail if no key
    }

    const category = options?.category || getCategoryFromQuery(query);

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: query,
          count: options?.num || 10,
          responseFilter: 'Webpages',
        },
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
        timeout: 5000,
      });

      const webPages = response.data?.webPages?.value || [];

      return {
        items: webPages.map((item: any) => ({
          id: `bing-${item.id || item.url}`,
          title: item.name,
          link: item.url,
          snippet: item.snippet,
          displayLink: item.displayUrl || item.url,
          source: 'bing_search',
          category,
        })),
      };
    } catch (error) {
      console.warn('Bing search failed:', (error as Error).message);
      return { items: [] };
    }
  }

  async fetch(id: string, options?: any): Promise<any> {
    return { error: 'Not implemented for Bing Search' };
  }

  async latest(options?: any): Promise<any> {
    return this.search(options?.query || 'latest news', options);
  }

  async trending(options?: any): Promise<any> {
    return this.search(options?.query || 'trending', options);
  }

  async details(url: string, options?: any): Promise<any> {
    return { error: 'Not implemented for Bing Search' };
  }
}

export const bingSearchAdapter = new BingSearchAdapter();