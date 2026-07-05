// Google News RSS Adapter
// News provider adapter following docs/V2/ section 9

import { BaseAdapter } from './base-adapter';
import Parser from 'rss-parser';

export class GoogleNewsRSSAdapter extends BaseAdapter {
  name = 'google_news_rss';
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        item: [
          ['media:content', 'media'],
          ['pubDate', 'publishedAt'],
        ],
      },
    });
  }

  async search(query: string, options?: any): Promise<any> {
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

    return this.withRetry(async () => {
      const feed = await this.parser.parseURL(rssUrl);

      return {
        items: feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: item.contentSnippet,
          creator: item.creator,
          categories: item.categories || [],
          guid: item.guid,
        })),
        title: feed.title,
        description: feed.description,
      };
    }, 'search');
  }

  async fetch(id: string, options?: any): Promise<any> {
    // RSS doesn't support fetch by ID
    return { error: 'Not implemented for RSS' };
  }

  async latest(options?: any): Promise<any> {
    const topic = options?.topic || 'World';
    const rssUrl = `https://news.google.com/rss/headlines/section/topic/${topic}?hl=en-US&gl=US&ceid=US:en`;

    return this.withRetry(async () => {
      const feed = await this.parser.parseURL(rssUrl);

      return {
        items: feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: item.contentSnippet,
          creator: item.creator,
          categories: item.categories || [],
          guid: item.guid,
        })),
        title: feed.title,
      };
    }, 'latest');
  }

  async trending(options?: any): Promise<any> {
    const rssUrl = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';

    return this.withRetry(async () => {
      const feed = await this.parser.parseURL(rssUrl);

      return {
        items: feed.items.slice(0, 20).map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: item.contentSnippet,
          creator: item.creator,
          categories: item.categories || [],
          guid: item.guid,
        })),
        title: feed.title,
      };
    }, 'trending');
  }

  async details(url: string, options?: any): Promise<any> {
    // RSS doesn't support details by URL
    return { error: 'Not implemented for RSS' };
  }
}

export const googleNewsRSSAdapter = new GoogleNewsRSSAdapter();
