import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// POST engagement action (like, share, view)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string; entryId: string }> }
) {
  try {
    const { entryId } = await params;
    if (!entryId) {
      return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
    }

    let authUser: any;

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const clientSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      const { data, error } = await clientSupabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authUser = data.user;
    } else {
      const cookieStore = await cookies();
      const clientSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {}
            },
          },
        }
      );
      const { data, error } = await clientSupabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authUser = data.user;
    }

    const body = await request.json();
    const { action, reactionType = 'like' } = body;

    if (!action || !['like', 'share', 'view'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be: like, share, or view' 
      }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        },
      }
    );

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};

    if (action === 'like') {
      // Record the like for chain entry posts
      
      // Check if already liked
      const { data: existing } = await supabase
        .from('chronicles_chain_entry_post_likes')
        .select('id')
        .eq('creator_id', creator.id)
        .eq('chain_entry_post_id', entryId)
        .eq('reaction_type', 'like')
        .single();

      if (!existing) {
        // Add like reaction
        await supabase
          .from('chronicles_chain_entry_post_likes')
          .insert({
            chain_entry_post_id: entryId,
            creator_id: creator.id,
            reaction_type: 'like',
          });

        // Update likes count
        const { data: post } = await supabase
          .from('chronicles_chain_entry_posts')
          .select('likes_count')
          .eq('id', entryId)
          .single();

        updateData.likes_count = (post?.likes_count || 0) + 1;
      }
    } else if (action === 'share') {
      const { data: post } = await supabase
        .from('chronicles_chain_entry_posts')
        .select('shares_count')
        .eq('id', entryId)
        .single();

      updateData.shares_count = (post?.shares_count || 0) + 1;
    } else if (action === 'view') {
      const { data: post } = await supabase
        .from('chronicles_chain_entry_posts')
        .select('views_count')
        .eq('id', entryId)
        .single();

      updateData.views_count = (post?.views_count || 0) + 1;
    }

    // Update the engagement counters
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('chronicles_chain_entry_posts')
        .update(updateData)
        .eq('id', entryId);

      if (updateError) {
        console.error('Engagement update error:', updateError);
        throw updateError;
      }
    }

    // Fetch updated post
    const { data: updatedPost } = await supabase
      .from('chronicles_chain_entry_posts')
      .select(`
        id,
        title,
        likes_count,
        comments_count,
        shares_count,
        views_count
      `)
      .eq('id', entryId)
      .single();

    return NextResponse.json({ 
      success: true, 
      data: updatedPost,
      message: `${action === 'like' ? 'Liked' : action === 'share' ? 'Shared' : 'View recorded'}!`
    });
  } catch (err) {
    console.error('Engagement POST error', err);
    return NextResponse.json({ success: false, error: 'Failed to record engagement' }, { status: 500 });
  }
}
