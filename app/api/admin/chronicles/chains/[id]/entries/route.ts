import { createSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chainId } = await params;
    const supabase = createSupabaseServer();

    // Fetch chain entry posts with all related data
    console.log("Fetching entries for chain:", chainId);
    
    const { data: entries, error } = await supabase
      .from('chronicles_chain_entry_posts')
      .select(`
        id,
        chain_id,
        creator_id,
        title,
        content,
        excerpt,
        cover_image_url,
        category,
        tags,
        status,
        likes_count,
        comments_count,
        shares_count,
        views_count,
        sequence,
        added_by,
        published_at,
        created_at,
        updated_at,
        creator:chronicles_creators!creator_id(
          id,
          pen_name,
          profile_image_url,
          bio
        ),
        added_by_creator:chronicles_creators!added_by(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .eq('chain_id', chainId)
      .order('sequence', { ascending: true });

    if (error) {
      console.error("❌ Failed to fetch entries:", error);
      return NextResponse.json(
        { error: 'Failed to fetch entries', details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Fetched", entries?.length || 0, "entries");
    
    // Fetch comments and reactions for each entry
    const enrichedEntries = entries ? await Promise.all(
      entries.map(async (entry: any) => {
        // Fetch comments
        const { data: comments } = await supabase
          .from('chronicles_chain_entry_post_comments')
          .select(`
            id,
            content,
            creator_id,
            likes_count,
            replies_count,
            status,
            created_at,
            creator:chronicles_creators(id, pen_name, profile_image_url)
          `)
          .eq('chain_entry_post_id', entry.id);

        // Fetch reactions/likes
        const { data: reactions } = await supabase
          .from('chronicles_chain_entry_post_likes')
          .select(`
            id,
            reaction_type,
            creator_id,
            created_at,
            creator:chronicles_creators(id, pen_name)
          `)
          .eq('chain_entry_post_id', entry.id);

        return {
          ...entry,
          comments: comments || [],
          reactions: reactions || [],
          engagement: {
            totalComments: comments?.length || 0,
            totalReactions: reactions?.length || 0,
            likes: reactions?.filter(r => r.reaction_type === 'like').length || 0,
          }
        };
      })
    ) : [];

    return NextResponse.json({ 
      entries: enrichedEntries,
      total: enrichedEntries?.length || 0
    });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
