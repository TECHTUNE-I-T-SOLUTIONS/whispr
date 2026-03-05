import { createSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chainId = params.id;
    const supabase = createSupabaseServer();

    // Fetch the chain with creator info
    const { data: chain, error } = await supabase
      .from('chronicles_writing_chains')
      .select(`
        id,
        title,
        description,
        created_by,
        created_at,
        updated_at,
        creator:chronicles_creators!created_by(pen_name)
      `)
      .eq('id', chainId)
      .single();

    if (error || !chain) {
      return NextResponse.json(
        { error: 'Chain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ chain });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chainId = params.id;
    const body = await request.json();
    const supabase = createSupabaseServer();

    const { data: chain, error } = await supabase
      .from('chronicles_writing_chains')
      .update({
        title: body.title,
        description: body.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chainId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update chain' },
        { status: 500 }
      );
    }

    return NextResponse.json({ chain });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chainId = params.id;
    const supabase = createSupabaseServer();

    const { error } = await supabase
      .from('chronicles_writing_chains')
      .delete()
      .eq('id', chainId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete chain' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
