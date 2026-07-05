// Wikipedia Adapter
// Knowledge provider adapter following docs/V2/ section 9
// Uses the MediaWiki action API for reliable search

import { BaseAdapter } from './base-adapter';
import axios from 'axios';

export class WikipediaAdapter extends BaseAdapter {
  name = 'wikipedia';
  // MediaWiki action API is the correct search endpoint
  private baseUrl = 'https://en.wikipedia.org/w/api.php';
  protected timeout = 8000; // 8s timeout for Wikipedia (faster than default 30s)
  protected maxRetries = 1; // Only 1 retry for Wikipedia

  async search(query: string, options?: any): Promise<any> {
    const limit = options?.limit || 10;

    return this.withRetry(async () => {
      const response = await axios.get(this.baseUrl, {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          srlimit: limit,
          origin: '*',
        },
        headers: {
          'User-Agent': 'Whispr/1.0 (whisprwords@gmail.com)',
        },
      });

      const searchResults = response.data?.query?.search || [];

      return {
        pages: searchResults.map((page: any) => ({
          title: page.title,
          excerpt: page.snippet?.replace(/<\/?[^>]+(>|$)/g, '') || '', // strip HTML tags
          description: '',
          thumbnail: null,
          pageid: page.pageid,
        })) || [],
      };
    }, 'search');
  }

  async fetch(id: string, options?: any): Promise<any> {
    // id here is the page title
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(id)}`;

    return this.withRetry(async () => {
      const response = await axios.get(summaryUrl, {
        headers: {
          'User-Agent': 'Whispr/1.0 (whisprwords@gmail.com)',
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
    return { error: 'Not implemented for Wikipedia' };
  }

  async trending(options?: any): Promise<any> {
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