import { createSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chainId } = await params;
    const supabase = createSupabaseServer();

    // Fetch the chain with creator info
    console.log("Fetching chain details:", chainId);
    
    const { data: chain, error } = await supabase
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
          profile_image_url,
          bio
        )
      `)
      .eq('id', chainId)
      .single();

    if (error || !chain) {
      console.error("❌ Chain not found:", error);
      return NextResponse.json(
        { error: 'Chain not found', details: error?.message },
        { status: 404 }
      );
    }

    // Fetch chain entries count and stats
    const { data: entries, count: entriesCount } = await supabase
      .from('chronicles_chain_entry_posts')
      .select('id, creator_id, likes_count, comments_count, shares_count, views_count', { count: 'exact' })
      .eq('chain_id', chainId);

    // Calculate stats
    let stats = {
      totalEntries: entriesCount || 0,
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

    // Fetch top contributors
    const { data: contributors } = await supabase
      .from('chronicles_chain_entry_posts')
      .select('creator_id, chronicles_creators!creator_id(id, pen_name, profile_image_url)', { count: 'exact' })
      .eq('chain_id', chainId);

    const contributorMap = new Map<string, any>();
    if (contributors) {
      contributors.forEach(c => {
        const id = c.creator_id;
        if (!contributorMap.has(id)) {
          contributorMap.set(id, {
            ...c.chronicles_creators,
            postCount: 0
          });
        }
        const contributor = contributorMap.get(id);
        contributor.postCount += 1;
      });
    }

    const topContributors = Array.from(contributorMap.values())
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5);

    console.log("✅ Chain details fetched:", chain.title);

    return NextResponse.json({ 
      chain: {
        ...chain,
        stats: {
          totalEntries: stats.totalEntries,
          totalLikes: stats.totalLikes,
          totalComments: stats.totalComments,
          totalShares: stats.totalShares,
          totalViews: stats.totalViews,
          uniqueContributors: stats.uniqueContributors.size,
        },
        topContributors,
      }
    });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chainId } = await params;
    console.log("Updating chain:", chainId);
    
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
      console.error('❌ Failed to update chain:', error);
      return NextResponse.json(
        { error: 'Failed to update chain', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Chain updated successfully');
    return NextResponse.json({ chain });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chainId } = await params;
    console.log("Deleting chain:", chainId);
    
    const supabase = createSupabaseServer();

    const { error } = await supabase
      .from('chronicles_writing_chains')
      .delete()
      .eq('id', chainId);

    if (error) {
      console.error('❌ Failed to delete chain:', error);
      return NextResponse.json(
        { error: 'Failed to delete chain', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Chain deleted successfully');
    return NextResponse.json({ success: true, message: 'Chain deleted successfully' });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
