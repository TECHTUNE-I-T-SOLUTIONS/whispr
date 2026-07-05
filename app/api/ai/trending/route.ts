import { NextRequest, NextResponse } from 'next/server';
import { trendingEngine } from '@/lib';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const region = searchParams.get('region') || 'US';
    const limit = parseInt(searchParams.get('limit') || '20');

    const results = await trendingEngine.getTrending({
      category,
      region,
      limit,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json(
      { error: 'Failed to get trending content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, region, limit } = body;

    const results = await trendingEngine.getTrending({
      category,
      region,
      limit,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json(
      { error: 'Failed to get trending content' },
      { status: 500 }
    );
  }
}
