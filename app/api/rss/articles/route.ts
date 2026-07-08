// RSS Articles API Endpoint
// Returns articles from RSS feeds with optional filtering

import { NextRequest, NextResponse } from 'next/server';
import { rssAdapter } from '@/lib/providers/rss-adapter';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const limit = parseInt(searchParams.get('limit') || '20');

    let articles;

    if (category) {
      articles = await rssAdapter.getArticlesByCategory(category);
    } else if (country) {
      articles = await rssAdapter.getArticlesByCountry(country);
    } else {
      articles = await rssAdapter.latest({ limit });
    }

    return NextResponse.json({
      articles: articles.slice(0, limit),
      total: articles.length,
      category,
      country,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get RSS articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS articles' },
      { status: 500 }
    );
  }
}
