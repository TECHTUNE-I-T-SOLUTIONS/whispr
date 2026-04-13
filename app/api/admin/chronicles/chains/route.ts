import { createSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createSupabaseServer();

    console.log("Fetching all writing chains...");

    // Fetch all writing chains with creator info and stats
    const { data: chains, error } = await supabase
      .from('chronicles_writing_chains')
      .select(`
        id,
        title,
        description,
        created_by,
        created_at,
        updated_at,
        creator:chronicles_creators!created_by(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching chains:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chains', details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Fetched", chains?.length || 0, "chains");

    // Count entries and stats for each chain from the correct table
    const chainsWithStats = await Promise.all(
      (chains || []).map(async (chain) => {
        const { data: entries, count: entryCount } = await supabase
          .from('chronicles_chain_entry_posts')
          .select('creator_id, likes_count, comments_count, shares_count, views_count', { count: 'exact' })
          .eq('chain_id', chain.id);

        // Calculate stats
        let stats = {
          entryCount: entryCount || 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalViews: 0,
          uniqueContributors: new Set<string>(),
        };

        if (entries && entries.length > 0) {
          entries.forEach(entry => {
            stats.totalLikes += entry.likes_count || 0;
            stats.totalComments += entry.comments_count || 0;
            stats.totalShares += entry.shares_count || 0;
            stats.totalViews += entry.views_count || 0;
            if (entry.creator_id) {
              stats.uniqueContributors.add(entry.creator_id);
            }
          });
        }

        return {
          ...chain,
          stats: {
            entryCount: stats.entryCount,
            totalLikes: stats.totalLikes,
            totalComments: stats.totalComments,
            totalShares: stats.totalShares,
            totalViews: stats.totalViews,
            uniqueContributors: stats.uniqueContributors.size,
            totalEngagement: stats.totalLikes + stats.totalComments + stats.totalShares,
          }
        };
      })
    );

    return NextResponse.json({ 
      chains: chainsWithStats,
      total: chains?.length || 0
    });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("Creating new writing chain...");
    
    const body = await request.json();
    const supabase = createSupabaseServer();

    // Get the current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get the creator record for this user
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      console.error("❌ Creator profile not found:", creatorError);
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 400 }
      );
    }

    console.log("Creating new chain for creator:", creator.id);

    // Create the chain
    const { data: chain, error } = await supabase
      .from('chronicles_writing_chains')
      .insert({
        title: body.title,
        description: body.description || null,
        created_by: creator.id,
      })
      .select(`
        id,
        title,
        description,
        created_by,
        created_at,
        updated_at,
        creator:chronicles_creators!created_by(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error creating chain:', error);
      return NextResponse.json(
        { error: 'Failed to create chain', details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Chain created successfully:", chain?.id);

    return NextResponse.json({ 
      chain: {
        ...chain,
        stats: {
          entryCount: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalViews: 0,
          uniqueContributors: 0,
          totalEngagement: 0,
        }
      }
    }, { status: 201 });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
