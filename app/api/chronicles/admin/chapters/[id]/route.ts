import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseServer();
    const { id: chapterId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Update the chapter
    const { data: chapter, error: updateError } = await supabase
      .from('chronicles_story_chapters')
      .update({
        content: content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapterId)
      .select()
      .single();

    if (updateError || !chapter) {
      console.error('Error updating chapter:', updateError);
      return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error('Error in PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseServer();
    const { id: chapterId } = await params;

    const { data: chapter, error: chapterError } = await supabase
      .from('chronicles_story_chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}