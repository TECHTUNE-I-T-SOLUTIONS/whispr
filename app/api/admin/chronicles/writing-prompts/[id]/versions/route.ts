import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First get the prompt title to use as prompt_name
    const { data: prompt } = await supabase
      .from('chronicles_writing_prompts')
      .select('title')
      .eq('id', id)
      .single();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Fetch versions using the title as prompt_name
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_name', prompt.title)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ versions: data || [] });
  } catch (error) {
    console.error('Error fetching prompt versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt versions' },
      { status: 500 }
    );
  }
}