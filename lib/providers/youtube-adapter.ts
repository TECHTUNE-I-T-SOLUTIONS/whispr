// YouTube Adapter
// Video discovery provider adapter following docs/V2/ section 9

import { BaseAdapter } from './base-adapter';
import axios from 'axios';

export class YouTubeAdapter extends BaseAdapter {
  name = 'youtube';
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private apiKey: string | undefined;
  protected timeout = 5000;
  protected maxRetries = 0; // No retries - fail fast

  constructor() {
    super();
    this.apiKey = process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY;
  }

  async search(query: string, options?: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const searchUrl = `${this.baseUrl}/search`;
    const maxResults = options?.maxResults || 10;
    const order = options?.order || 'relevance';

    try {
      const response = await axios.get(searchUrl, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults,
          order,
          key: this.apiKey,
        },
        headers: {
          'Accept': 'application/json',
        },
        timeout: 5000,
      });

      return {
        items: response.data.items?.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          publishedAt: item.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        })) || [],
        nextPageToken: response.data.nextPageToken,
        pageInfo: response.data.pageInfo,
      };
    } catch (error) {
      console.warn('YouTube search failed:', (error as Error).message);
      return { items: [] };
    }
  }

  async fetch(id: string, options?: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const videosUrl = `${this.baseUrl}/videos`;

    return this.withRetry(async () => {
      const response = await axios.get(videosUrl, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id,
          key: this.apiKey,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      const video = response.data.items?.[0];
      if (!video) {
        return { error: 'Video not found' };
      }

      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails?.default?.url,
        highThumbnail: video.snippet.thumbnails?.high?.url,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        publishedAt: video.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        statistics: {
          viewCount: video.statistics?.viewCount,
          likeCount: video.statistics?.likeCount,
          commentCount: video.statistics?.commentCount,
        },
        duration: video.contentDetails?.duration,
        tags: video.snippet.tags || [],
      };
    }, 'fetch');
  }

  async latest(options?: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    // Get videos from a popular channel or use search with date filter
    const searchUrl = `${this.baseUrl}/search`;
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const dateStr = date.toISOString().split('T')[0];

    return this.withRetry(async () => {
      const response = await axios.get(searchUrl, {
        params: {
          part: 'snippet',
          q: options?.query || 'programming',
          type: 'video',
          publishedAfter: `${dateStr}T00:00:00Z`,
          maxResults: 20,
          order: 'date',
          key: this.apiKey,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      return {
        items: response.data.items?.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          publishedAt: item.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        })) || [],
      };
    }, 'latest');
  }

  async trending(options?: any): Promise<any> {
    // Try API key first, fall back to RSS feed if it fails
    if (this.apiKey) {
      try {
        return await this.trendingWithAPI(options);
      } catch (error: any) {
        // Log the actual Google API error response for debugging
        if (error?.response?.data?.error) {
          const apiError = error.response.data.error;
          console.warn('YouTube API trending failed:', apiError.message || apiError.status, '-', JSON.stringify(apiError.errors || []));
        } else {
          console.warn('YouTube API trending failed, falling back to RSS feed:', (error as Error).message);
        }
      }
    }

    // Fallback: Use YouTube's public RSS feed for trending (no API key needed)
    return this.trendingWithRSS(options);
  }

  private async trendingWithAPI(options?: any): Promise<any> {
    const videosUrl = `${this.baseUrl}/videos`;
    const regionCode = options?.regionCode || 'US';
    const categoryId = options?.categoryId || '0';

    const response = await axios.get(videosUrl, {
      params: {
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode,
        videoCategoryId: categoryId,
        maxResults: 20,
        key: this.apiKey,
      },
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000,
      // Don't throw on 403 so we can see the response body
      validateStatus: (status) => status < 500,
    });

    if (response.status === 403) {
      const reason = response?.data?.error?.message || 'API key restricted or YouTube Data API v3 not enabled';
      const errors = response?.data?.error?.errors || [];
      throw new Error(`YouTube API 403: ${reason} ${errors.length ? JSON.stringify(errors) : ''}`);
    }

    return {
      items: response.data.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        statistics: {
          viewCount: item.statistics?.viewCount,
          likeCount: item.statistics?.likeCount,
          commentCount: item.statistics?.commentCount,
        },
      })) || [],
    };
  }

  private async trendingWithRSS(options?: any): Promise<any> {
    // YouTube trending RSS feed (no API key required)
    const rssUrl = 'https://www.youtube.com/feeds/videos.xml?playlist_id=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';

    try {
      const response = await axios.get(rssUrl, {
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; Whispr/1.0)',
        },
        timeout: 5000,
      });

      // Parse XML manually (simple approach)
      const xml = response.data;
      const items: any[] = [];
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;

      while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];
        const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || '';
        const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || '';
        const channelName = entry.match(/<name>([^<]+)<\/name>/)?.[1] || '';
        const channelId = entry.match(/<yt:channelId>([^<]+)<\/yt:channelId>/)?.[1] || '';
        const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1] || '';
        const thumbnail = `https://i.ytimg.com/vi/${id}/default.jpg`;

        items.push({
          id,
          title,
          description: '',
          thumbnail,
          channelTitle: channelName,
          channelId,
          publishedAt,
          url: `https://www.youtube.com/watch?v=${id}`,
          statistics: {
            viewCount: '0',
            likeCount: '0',
            commentCount: '0',
          },
        });
      }

      return { items };
    } catch (error) {
      console.warn('YouTube RSS trending also failed:', (error as Error).message);
      return { items: [] };
    }
  }

  async details(url: string, options?: any): Promise<any> {
    // Extract video ID from URL
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (!match) {
      return { error: 'Invalid YouTube URL' };
    }

    const videoId = match[1];
    return this.fetch(videoId, options);
  }
}

export const youtubeAdapter = new YouTubeAdapter();
