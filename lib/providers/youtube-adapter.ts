// YouTube Adapter
// Video discovery provider adapter following docs/V2/ section 9

import { BaseAdapter } from './base-adapter';
import axios from 'axios';

export class YouTubeAdapter extends BaseAdapter {
  name = 'youtube';
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private apiKey: string | undefined;

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

    return this.withRetry(async () => {
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
    }, 'search');
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
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    // Use the videos API with chart parameter for trending
    const videosUrl = `${this.baseUrl}/videos`;
    const regionCode = options?.regionCode || 'US';
    const categoryId = options?.categoryId || '0'; // 0 = all categories

    return this.withRetry(async () => {
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
      });

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
    }, 'trending');
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
