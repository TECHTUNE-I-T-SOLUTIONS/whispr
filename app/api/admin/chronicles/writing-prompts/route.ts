import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const challengeType = searchParams.get('challenge_type');

    let query = supabase
      .from('chronicles_writing_prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (challengeType) {
      query = query.eq('challenge_type', challengeType);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Use the database entries_count column instead of calculating
    const prompts = (data || []).map((prompt) => ({
      ...prompt,
      entries_count: prompt.entries_count || 0
    }));

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error fetching writing prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writing prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    
    const body = await request.json();
    const {
      title,
      description,
      content,
      prompt_type,
      challenge_type,
      is_ai_generated,
      ai_generation_model,
      starts_at,
      ends_at,
      submission_deadline,
      max_entries_per_user,
      evaluation_criteria,
      tags,
      featured_image_url,
      prize_description
    } = body;

    const { data, error } = await supabase
      .from('chronicles_writing_prompts')
      .insert({
        title,
        description,
        content,
        prompt_type,
        challenge_type,
        is_ai_generated: is_ai_generated || false,
        ai_generation_model,
        created_by: admin.id,
        starts_at: starts_at || new Date().toISOString(),
        ends_at,
        submission_deadline,
        max_entries_per_user: max_entries_per_user || 1,
        evaluation_criteria: evaluation_criteria || { integrity: 30, sincerity: 30, passion: 20, engagement: 20 },
        tags: tags || [],
        featured_image_url,
        prize_description,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ prompt: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating writing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create writing prompt' },
      { status: 500 }
    );
  }
}
