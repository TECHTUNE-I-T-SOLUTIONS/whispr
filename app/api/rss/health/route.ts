// RSS Feed Health API Endpoint
// Returns health status of all RSS feeds

import { NextRequest, NextResponse } from 'next/server';
import { rssAdapter } from '@/lib/providers/rss-adapter';

export async function GET(request: NextRequest) {
  try {
    const health = await rssAdapter.getFeedHealth();

    return NextResponse.json({
      feeds: health,
      total: health.length,
      healthy: health.filter(h => h.healthy).length,
      unhealthy: health.filter(h => !h.healthy).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get feed health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed health status' },
      { status: 500 }
    );
  }
}
