import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/lib';

export const dynamic = 'force-dynamic';
export const revalidate = 1800; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const contentType = searchParams.get('contentType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const recommendations = await recommendationEngine.getRecommendations(userId, {
      contentType,
      limit,
      forceRefresh,
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contentId, interactionType } = body;

    if (!userId || !contentId || !interactionType) {
      return NextResponse.json(
        { error: 'User ID, content ID, and interaction type are required' },
        { status: 400 }
      );
    }

    await recommendationEngine.recordInteraction(userId, contentId, interactionType);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Record interaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
}
