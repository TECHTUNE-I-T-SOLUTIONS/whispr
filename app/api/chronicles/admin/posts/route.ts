import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface Post {
  id: string;
  title: string;
  post_type: 'blog' | 'poem' | 'chain_entry' | 'story';
  status: string;
  creator_id: string;
  creator_name: string;
  category?: string;
  tags: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  published_at?: string;
  flagged: boolean;
  flag_count: number;
  source: 'chronicles' | 'chain' | 'story';
  chain_id?: string;
  chain_title?: string;
  sequence?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const flagged = searchParams.get('flagged');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'recent';

    const supabase = createSupabaseServer();

    console.log('Fetching posts with filters:', { type, status, flagged, search, sort });

    // Get all flagged posts (both regular posts and chain entries)
    const { data: allFlaggedPosts, error: flaggedError } = await supabase
      .from('chronicles_flagged_reviews')
      .select('post_id, chain_entry_post_id, status')
      .or('status.eq.pending,status.eq.under_review');

    console.log('Flagged posts from DB:', allFlaggedPosts);

    const flaggedPostIds = new Set(
      (allFlaggedPosts || [])
        .filter(fp => fp.post_id)
        .map(fp => fp.post_id as string)
    );

    const flaggedChainEntryIds = new Set(
      (allFlaggedPosts || [])
        .filter(fp => fp.chain_entry_post_id)
        .map(fp => fp.chain_entry_post_id as string)
    );

    console.log('Flagged post IDs:', Array.from(flaggedPostIds));
    console.log('Flagged chain entry IDs:', Array.from(flaggedChainEntryIds));

    // Fetch regular chronicles posts (blog, poem)
    let chroniclesQuery = supabase
      .from('chronicles_posts')
      .select(`
        id,
        title,
        post_type,
        status,
        creator_id,
        category,
        tags,
        views_count,
        likes_count,
        comments_count,
        shares_count,
        created_at,
        published_at,
        chronicles_creators (
          pen_name
        )
      `);

    if (type && type !== 'all' && type !== 'chain_entry' && type !== 'story') {
      chroniclesQuery = chroniclesQuery.eq('post_type', type);
    }

    if (status && status !== 'all') {
      chroniclesQuery = chroniclesQuery.eq('status', status);
    }

    if (search) {
      chroniclesQuery = chroniclesQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: chroniclesPosts, error: chroniclesError } = await chroniclesQuery;
    console.log('Chronicles posts fetched:', chroniclesPosts?.length || 0);

    // Fetch chain entry posts with chain info - specify the relationship explicitly
    let chainQuery = supabase
      .from('chronicles_chain_entry_posts')
      .select(`
        id,
        title,
        content,
        status,
        creator_id,
        category,
        tags,
        views_count,
        likes_count,
        comments_count,
        shares_count,
        created_at,
        published_at,
        chain_id,
        sequence,
        chronicles_creators!chronicles_chain_entry_posts_creator_id_fkey (
          pen_name
        ),
        chronicles_writing_chains (
          id,
          title
        )
      `);

    // Always fetch chain entries unless a different specific type is selected
    if (type && type !== 'all' && type !== 'chain_entry') {
      chainQuery = chainQuery.eq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (status && status !== 'all') {
      chainQuery = chainQuery.eq('status', status);
    }

    if (search) {
      chainQuery = chainQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: chainPosts, error: chainError } = await chainQuery;
    console.log('Chain posts fetched:', chainPosts?.length || 0, chainError);

    // Fetch stories
    let storiesQuery = supabase
      .from('chronicles_stories')
      .select(`
        id,
        title,
        description,
        genre,
        status,
        creator_id,
        views_count,
        likes_count,
        comments_count,
        shares_count,
        created_at,
        published_at,
        chronicles_creators (
          pen_name
        )
      `);

    if (type && type !== 'all' && type !== 'story') {
      storiesQuery = storiesQuery.eq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (status && status !== 'all') {
      storiesQuery = storiesQuery.eq('status', status);
    }

    if (search) {
      storiesQuery = storiesQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: stories, error: storiesError } = await storiesQuery;
    console.log('Stories fetched:', stories?.length || 0, storiesError);

    // Transform chronicles posts
    const transformedChroniclesPosts: Post[] = (chroniclesPosts || []).map((post: any) => {
      const creatorName = post.chronicles_creators?.pen_name || 'Unknown';
      const isFlagged = flaggedPostIds.has(post.id);
      
      return {
        id: post.id,
        title: post.title,
        post_type: post.post_type,
        status: post.status,
        creator_id: post.creator_id,
        creator_name: creatorName,
        category: post.category,
        tags: post.tags || [],
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: post.shares_count || 0,
        created_at: post.created_at,
        published_at: post.published_at,
        flagged: isFlagged,
        flag_count: isFlagged ? 1 : 0,
        source: 'chronicles',
      };
    });

    // Transform chain entry posts
    const transformedChainPosts: Post[] = (chainPosts || []).map((post: any) => {
      const creatorName = post.chronicles_creators?.pen_name || 'Unknown';
      const isFlagged = flaggedChainEntryIds.has(post.id);
      const chainTitle = post.chronicles_writing_chains?.title || 'Unknown Chain';
      
      return {
        id: post.id,
        title: post.title,
        post_type: 'chain_entry',
        status: post.status,
        creator_id: post.creator_id,
        creator_name: creatorName,
        category: post.category,
        tags: post.tags || [],
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: post.shares_count || 0,
        created_at: post.created_at,
        published_at: post.published_at,
        flagged: isFlagged,
        flag_count: isFlagged ? 1 : 0,
        source: 'chain',
        chain_id: post.chain_id,
        chain_title: chainTitle,
        sequence: post.sequence,
      };
    });

    // Transform stories
    const transformedStories: Post[] = (stories || []).map((story: any) => {
      const creatorName = story.chronicles_creators?.pen_name || 'Unknown';
      const isFlagged = flaggedPostIds.has(story.id);
      
      return {
        id: story.id,
        title: story.title,
        post_type: 'story',
        status: story.status,
        creator_id: story.creator_id,
        creator_name: creatorName,
        category: story.genre,
        tags: [],
        views_count: story.views_count || 0,
        likes_count: story.likes_count || 0,
        comments_count: story.comments_count || 0,
        shares_count: story.shares_count || 0,
        created_at: story.created_at,
        published_at: story.published_at,
        flagged: isFlagged,
        flag_count: isFlagged ? 1 : 0,
        source: 'story',
      };
    });

    // Combine all posts
    let allPosts = [...transformedChroniclesPosts, ...transformedChainPosts, ...transformedStories];
    console.log('Total posts combined:', allPosts.length);

    // Apply sorting
    if (sort === 'recent') {
      allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'popular') {
      allPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (sort === 'views') {
      allPosts.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else if (sort === 'engagement') {
      allPosts.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
    }

    // Apply flagged filter
    if (flagged === 'flagged') {
      allPosts = allPosts.filter(post => post.flagged);
    } else if (flagged === 'unflagged') {
      allPosts = allPosts.filter(post => !post.flagged);
    }

    // Calculate stats
    const stats = {
      total: allPosts.length,
      published: allPosts.filter(p => p.status === 'published').length,
      draft: allPosts.filter(p => p.status === 'draft').length,
      flagged: allPosts.filter(p => p.flagged).length,
      byType: {
        blog: allPosts.filter(p => p.post_type === 'blog').length,
        poem: allPosts.filter(p => p.post_type === 'poem').length,
        chain_entry: allPosts.filter(p => p.post_type === 'chain_entry').length,
        story: allPosts.filter(p => p.post_type === 'story').length,
      },
    };

    console.log('Final stats:', stats);
    return NextResponse.json({ posts: allPosts, stats });
  } catch (error) {
    console.error('Error in GET /api/chronicles/admin/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const body = await request.json();
    const { post_ids, action } = body;

    if (!post_ids || !Array.isArray(post_ids) || post_ids.length === 0) {
      return NextResponse.json({ error: 'Invalid post IDs' }, { status: 400 });
    }

    if (!action || !['publish', 'archive', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'delete') {
      // Try to delete from chronicles_posts
      const { error: deleteError1 } = await supabase
        .from('chronicles_posts')
        .delete()
        .in('id', post_ids);

      // Try to delete from chain_entry_posts
      const { error: deleteError2 } = await supabase
        .from('chronicles_chain_entry_posts')
        .delete()
        .in('id', post_ids);

      // Try to delete from stories
      const { error: deleteError3 } = await supabase
        .from('chronicles_stories')
        .delete()
        .in('id', post_ids);

      if (deleteError1 && deleteError2 && deleteError3) {
        console.error('Error deleting posts:', deleteError1, deleteError2, deleteError3);
        return NextResponse.json({ error: 'Failed to delete posts' }, { status: 500 });
      }
    } else {
      // Update post status in chronicles_posts
      const newStatus = action === 'publish' ? 'published' : 'archived';
      const { error: updateError1 } = await supabase
        .from('chronicles_posts')
        .update({ 
          status: newStatus,
          published_at: action === 'publish' ? new Date().toISOString() : undefined
        })
        .in('id', post_ids);

      // Update post status in chain_entry_posts
      const { error: updateError2 } = await supabase
        .from('chronicles_chain_entry_posts')
        .update({ 
          status: newStatus,
          published_at: action === 'publish' ? new Date().toISOString() : undefined
        })
        .in('id', post_ids);

      // Update post status in stories
      const { error: updateError3 } = await supabase
        .from('chronicles_stories')
        .update({ 
          status: newStatus,
          published_at: action === 'publish' ? new Date().toISOString() : undefined
        })
        .in('id', post_ids);

      if (updateError1 && updateError2 && updateError3) {
        console.error('Error updating posts:', updateError1, updateError2, updateError3);
        return NextResponse.json({ error: 'Failed to update posts' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/chronicles/admin/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}