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
    const { data, error } = await supabase
      .from('chronicles_writing_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch entries separately to avoid aggregate function errors
    const { data: entries, error: entriesError } = await supabase
      .from('chronicles_prompt_entries')
      .select(`
        *,
        chronicles_creators(pen_name, profile_image_url),
        posts!chronicles_prompt_entries_admin_post_id_fkey(id, title, content, excerpt, created_at)
      `)
      .eq('prompt_id', id)
      .order('created_at', { ascending: false });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
    }

    return NextResponse.json({ 
      prompt: data,
      entries: entries || []
    });
  } catch (error) {
    console.error('Error fetching writing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writing prompt' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabase
      .from('chronicles_writing_prompts')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ prompt: data });
  } catch (error) {
    console.error('Error updating writing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update writing prompt' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('chronicles_writing_prompts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting writing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete writing prompt' },
      { status: 500 }
    );
  }
}
