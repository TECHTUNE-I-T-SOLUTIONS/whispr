import { NextRequest, NextResponse } from 'next/server';
import { researchEngine } from '@/lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, sources, depth, userId } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const researchPackage = await researchEngine.research(topic, {
      sources,
      depth,
      userId,
    });

    return NextResponse.json(researchPackage);
  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform research' },
      { status: 500 }
    );
  }
}
