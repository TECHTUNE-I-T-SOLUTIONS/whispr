import { NextRequest, NextResponse } from 'next/server';
import { contentAuthenticityService } from '@/lib/services/content-authenticity';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, sections } = body;

    if (!content && !sections) {
      return NextResponse.json(
        { error: 'Content or sections array is required' },
        { status: 400 }
      );
    }

    let result;
    if (sections && Array.isArray(sections) && sections.length > 0) {
      result = await contentAuthenticityService.checkContentSections(sections);
    } else {
      result = await contentAuthenticityService.checkContent(content);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Content authenticity API error:', error);
    return NextResponse.json(
      { error: 'Failed to check content authenticity' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return policy explanation
    const policy = contentAuthenticityService.getPolicyExplanation();
    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Content authenticity policy API error:', error);
    return NextResponse.json(
      { error: 'Failed to get policy' },
      { status: 500 }
    );
  }
}
