// RSS Trending Topics API Endpoint
// Returns trending topics from RSS feeds using deterministic analysis

import { NextRequest, NextResponse } from 'next/server';
import { rssAdapter } from '@/lib/providers/rss-adapter';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const topics = await rssAdapter.getTrendingTopics();

    return NextResponse.json({
      topics: topics.slice(0, limit),
      total: topics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get trending topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}
