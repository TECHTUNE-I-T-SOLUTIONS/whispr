import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    
    const { data, error } = await supabase
      .from('ai_content_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching AI config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch AI config' },
        { status: 500 }
      );
    }

    // Return defaults if no config exists
    const config = data || {
      authenticity_threshold: 70,
      section_threshold: 0.5,
      max_paragraph_length: 800,
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in GET /api/admin/ai-config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authenticity_threshold, section_threshold, max_paragraph_length } = body;

    // Validate input
    if (authenticity_threshold === undefined || section_threshold === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: authenticity_threshold and section_threshold' },
        { status: 400 }
      );
    }

    // Validate ranges
    if (authenticity_threshold < 0 || authenticity_threshold > 100) {
      return NextResponse.json(
        { error: 'authenticity_threshold must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (section_threshold < 0 || section_threshold > 1) {
      return NextResponse.json(
        { error: 'section_threshold must be between 0 and 1' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServer();

    // Check if a row exists
    const { data: existing } = await supabase
      .from('ai_content_config')
      .select('id')
      .single();

    let error;
    if (existing) {
      // Update existing row
      const result = await supabase
        .from('ai_content_config')
        .update({
          authenticity_threshold,
          section_threshold,
          max_paragraph_length: max_paragraph_length || 800,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      error = result.error;
    } else {
      // Insert new row
      const result = await supabase
        .from('ai_content_config')
        .insert({
          authenticity_threshold,
          section_threshold,
          max_paragraph_length: max_paragraph_length || 800,
        });
      error = result.error;
    }

    if (error) {
      console.error('Error updating AI config:', error);
      return NextResponse.json(
        { error: 'Failed to update AI config' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      authenticity_threshold,
      section_threshold,
      max_paragraph_length: max_paragraph_length || 800,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/ai-config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}