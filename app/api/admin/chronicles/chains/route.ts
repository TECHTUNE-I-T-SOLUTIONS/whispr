import { createSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createSupabaseServer();

    // Fetch all writing chains with creator info
    const { data: chains, error } = await supabase
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chains:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chains' },
        { status: 500 }
      );
    }

    // Count entries for each chain
    const chainsWithEntries = await Promise.all(
      (chains || []).map(async (chain) => {
        const { count } = await supabase
          .from('chronicles_chain_entries')
          .select('*', { count: 'exact', head: true })
          .eq('chain_id', chain.id);

        return {
          ...chain,
          entry_count: count || 0,
        };
      })
    );

    return NextResponse.json({ chains: chainsWithEntries });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createSupabaseServer();

    // Get the current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get the creator record for this user
    const { data: creator } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 400 }
      );
    }

    // Create the chain
    const { data: chain, error } = await supabase
      .from('chronicles_writing_chains')
      .insert({
        title: body.title,
        description: body.description || null,
        created_by: creator.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chain:', error);
      return NextResponse.json(
        { error: 'Failed to create chain' },
        { status: 500 }
      );
    }

    return NextResponse.json({ chain }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
