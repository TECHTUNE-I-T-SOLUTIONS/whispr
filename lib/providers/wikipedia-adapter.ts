// Wikipedia Adapter
// Knowledge provider adapter following docs/V2/ section 9

import { BaseAdapter } from './base-adapter';
import axios from 'axios';

export class WikipediaAdapter extends BaseAdapter {
  name = 'wikipedia';
  private baseUrl = 'https://en.wikipedia.org/api/rest_v1';

  async search(query: string, options?: any): Promise<any> {
    const searchUrl = `${this.baseUrl}/page/search/${encodeURIComponent(query)}`;
    const limit = options?.limit || 10;

    return this.withRetry(async () => {
      const response = await axios.get(searchUrl, {
        params: { limit },
        headers: {
          'User-Agent': 'Whispr/1.0',
        },
      });

      return {
        pages: response.data.pages?.map((page: any) => ({
          title: page.title,
          excerpt: page.excerpt,
          description: page.description,
          thumbnail: page.thumbnail?.source,
          pageid: page.pageid,
        })) || [],
      };
    }, 'search');
  }

  async fetch(id: string, options?: any): Promise<any> {
    const summaryUrl = `${this.baseUrl}/page/summary/${encodeURIComponent(id)}`;

    return this.withRetry(async () => {
      const response = await axios.get(summaryUrl, {
        headers: {
          'User-Agent': 'Whispr/1.0',
        },
      });

      return {
        title: response.data.title,
        extract: response.data.extract,
        description: response.data.description,
        thumbnail: response.data.thumbnail?.source,
        originalimage: response.data.originalimage?.source,
        lang: response.data.lang,
        dir: response.data.dir,
        revision: response.data.revision,
        tid: response.data.tid,
        content_urls: response.data.content_urls,
        api_urls: response.data.api_urls,
      };
    }, 'fetch');
  }

  async latest(options?: any): Promise<any> {
    // Wikipedia doesn't have a "latest" concept
    return { error: 'Not implemented for Wikipedia' };
  }

  async trending(options?: any): Promise<any> {
    // Wikipedia doesn't have a "trending" concept
    return { error: 'Not implemented for Wikipedia' };
  }

  async details(url: string, options?: any): Promise<any> {
    // Extract page title from URL and fetch
    const match = url.match(/wikipedia\.org\/wiki\/([^\/]+)/);
    if (!match) {
      return { error: 'Invalid Wikipedia URL' };
    }

    const title = decodeURIComponent(match[1]);
    return this.fetch(title, options);
  }
}

export const wikipediaAdapter = new WikipediaAdapter();
