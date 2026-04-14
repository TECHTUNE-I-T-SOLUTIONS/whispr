import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET comments for a chain entry post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string; entryId: string }> }
) {
  try {
    const { entryId } = await params;
    if (!entryId) {
      return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
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

    // Get comments from chain entry post comments table
    const { data: comments, error } = await supabase
      .from('chronicles_chain_entry_post_comments')
      .select(`
        id,
        content,
        creator_id,
        likes_count,
        replies_count,
        status,
        parent_comment_id,
        created_at,
        creator:chronicles_creators(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .eq('chain_entry_post_id', entryId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Comments fetch error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data: comments || [] });
  } catch (err) {
    console.error('Comments GET error', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST new comment on a chain entry post
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
    const { content, parentCommentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
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

    // Create comment in chain entry post comments table
    const { data: comment, error: commentError } = await supabase
      .from('chronicles_chain_entry_post_comments')
      .insert({
        chain_entry_post_id: entryId,
        creator_id: creator.id,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
        status: 'approved',
      })
      .select(`
        id,
        content,
        creator_id,
        likes_count,
        replies_count,
        status,
        parent_comment_id,
        created_at,
        creator:chronicles_creators(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .single();

    if (commentError) {
      console.error('Comment creation error:', commentError);
      throw commentError;
    }

    // Update the comment count on the entry post
    await supabase
      .from('chronicles_chain_entry_posts')
      .update({ comments_count: supabase.rpc('increment', { x: 1 }) })
      .eq('id', entryId);

    return NextResponse.json({ success: true, data: comment });
  } catch (err) {
    console.error('Comment POST error', err);
    return NextResponse.json({ success: false, error: 'Failed to create comment' }, { status: 500 });
  }
}
