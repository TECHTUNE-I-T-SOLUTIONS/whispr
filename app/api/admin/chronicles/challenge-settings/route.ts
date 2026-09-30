import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('chronicles_prompt_settings')
      .select('*')
      .single();

    if (error) {
      // If no settings exist, return default settings
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          settings: {
            ai_auto_generation_enabled: false,
            ai_generation_frequency: 'daily',
            ai_generation_schedule_time: '00:00:00',
            ai_generation_day_of_week: null,
            ai_generation_day_of_month: null,
            ai_model_preference: 'gpt-4',
            allow_admin_edit_ai_prompts: true,
            default_challenge_type: 'daily',
            default_evaluation_criteria: { integrity: 30, sincerity: 30, passion: 20, engagement: 20 },
            max_active_challenges: 3,
            auto_end_challenges: true,
            auto_announce_winners: true,
            winner_announcement_delay_hours: 24
          }
        });
      }
      throw error;
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error('Error fetching challenge settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if settings exist
    const { data: existing } = await supabase
      .from('chronicles_prompt_settings')
      .select('id')
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('chronicles_prompt_settings')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('chronicles_prompt_settings')
        .insert({
          ...body,
          updated_by: body.updated_by
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error('Error updating challenge settings:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge settings' },
      { status: 500 }
    );
  }
}
