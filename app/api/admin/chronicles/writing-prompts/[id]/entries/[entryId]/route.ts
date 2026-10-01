import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params;

    // Fetch entry
    const { data: entry, error: entryError } = await supabase
      .from('chronicles_prompt_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (entryError) throw entryError;

    // Fetch creator data
    let creatorData = null;
    if (entry.creator_id) {
      const { data: creator } = await supabase
        .from('chronicles_creators')
        .select('id, pen_name, display_name, profile_image_url, avatar_url, bio')
        .eq('id', entry.creator_id)
        .single();
      creatorData = creator;
    }

    // Fetch post data based on entry_type
    let postData = null;
    let engagementData = null;
    
    if (entry.entry_type === 'chronicles_post' && entry.post_id) {
      const { data: post } = await supabase
        .from('chronicles_posts')
        .select('id, title, slug, excerpt, content, post_type, category, tags, status, published_at, cover_image_url, likes_count, comments_count, shares_count, views_count')
        .eq('id', entry.post_id)
        .single();
      postData = post;
      
      // Fetch engagement data
      if (post) {
        const { data: reactions } = await supabase
          .from('chronicles_post_reactions')
          .select('reaction_type')
          .eq('post_id', post.id);
        
        const { data: comments } = await supabase
          .from('chronicles_post_comments')
          .select('id')
          .eq('post_id', post.id);
        
        engagementData = {
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          shares_count: post.shares_count || 0,
          views_count: post.views_count || 0,
          reactions_by_type: reactions?.reduce((acc, r) => {
            acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
          total_reactions: reactions?.length || 0,
          total_comments: comments?.length || 0,
        };
      }
    } else if (entry.entry_type === 'post' && entry.admin_post_id) {
      const { data: post } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, content, post_type, category, tags, status, published_at, cover_image_url, likes_count, comments_count, shares_count, views_count')
        .eq('id', entry.admin_post_id)
        .single();
      postData = post;
      
      // Fetch engagement data for admin posts
      if (post) {
        const { data: reactions } = await supabase
          .from('post_reactions')
          .select('reaction_type')
          .eq('post_id', post.id);
        
        const { data: comments } = await supabase
          .from('post_comments')
          .select('id')
          .eq('post_id', post.id);
        
        engagementData = {
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          shares_count: post.shares_count || 0,
          views_count: post.views_count || 0,
          reactions_by_type: reactions?.reduce((acc, r) => {
            acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
          total_reactions: reactions?.length || 0,
          total_comments: comments?.length || 0,
        };
      }
    }

    const enrichedEntry = {
      ...entry,
      creator: creatorData,
      post: postData,
      engagement: engagementData,
    };

    return NextResponse.json({ entry: enrichedEntry });
  } catch (error) {
    console.error('Error fetching prompt entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt entry' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const { entryId } = await params;
    const body = await request.json();
    const { status, review_notes } = body;

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Add review fields when status changes
    if (status === 'approved' || status === 'rejected') {
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = admin.id;
      updateData.review_notes = review_notes || null;
    }

    const { data, error } = await supabase
      .from('chronicles_prompt_entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error('Error updating prompt entry:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt entry' },
      { status: 500 }
    );
  }
}