import { NextRequest, NextResponse } from 'next/server';
import { writingEngine } from '@/lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content, options, userId } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'grammar':
        result = await writingEngine.improveGrammar(content, userId);
        break;
      case 'seo':
        result = await writingEngine.generateSEO(content, options?.title, userId);
        break;
      case 'outline':
        result = await writingEngine.generateOutline(content, options?.depth, userId);
        break;
      case 'headline':
        result = await writingEngine.generateHeadline(content, userId);
        break;
      case 'tags':
        result = await writingEngine.suggestTags(content, options?.existingTags, userId);
        break;
      case 'category':
        result = await writingEngine.suggestCategory(content, options?.categories, userId);
        break;
      case 'reading_time':
        result = await writingEngine.estimateReadingTime(content);
        break;
      case 'rewrite':
        result = await writingEngine.rewrite(content, options?.tone, userId);
        break;
      case 'expand':
        result = await writingEngine.expand(content, options?.targetLength, userId);
        break;
      case 'simplify':
        result = await writingEngine.simplify(content, options?.targetGrade, userId);
        break;
      case 'translate':
        result = await writingEngine.translate(content, options?.targetLanguage, userId);
        break;
      case 'tone_analysis':
        result = await writingEngine.analyzeTone(content, userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Writing API error:', error);
    return NextResponse.json(
      { error: 'Failed to process writing request' },
      { status: 500 }
    );
  }
}
