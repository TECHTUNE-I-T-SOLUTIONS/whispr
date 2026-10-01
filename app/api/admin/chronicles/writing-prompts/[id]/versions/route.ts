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
      .from('prompt_versions')
      .select('*')
      .eq('prompt_name', id)
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