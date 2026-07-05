import { NextRequest, NextResponse } from 'next/server';
import { editorAI } from '@/lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content, options, userId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'initialize':
        if (!content) {
          return NextResponse.json(
            { error: 'Content is required for initialize' },
            { status: 400 }
          );
        }
        result = await editorAI.initializeEditor(content, userId);
        break;
      case 'suggestions':
        if (!content) {
          return NextResponse.json(
            { error: 'Content is required for suggestions' },
            { status: 400 }
          );
        }
        result = await editorAI.getSuggestions(content, options?.type, userId);
        break;
      case 'enhance':
        if (!content) {
          return NextResponse.json(
            { error: 'Content is required for enhance' },
            { status: 400 }
          );
        }
        result = await editorAI.enhanceContent(content, options?.enhancement, options, userId);
        break;
      case 'research':
        if (!content) {
          return NextResponse.json(
            { error: 'Topic is required for research' },
            { status: 400 }
          );
        }
        result = await editorAI.researchForContent(content, userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Editor AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process editor request' },
      { status: 500 }
    );
  }
}
