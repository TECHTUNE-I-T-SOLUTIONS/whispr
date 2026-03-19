import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// DELETE a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chainId: string; entryId: string; commentId: string } }
) {
  try {
    const { entryId, commentId } = params;
    if (!entryId || !commentId) {
      return NextResponse.json({ error: 'Missing entry or comment ID' }, { status: 400 });
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

    // Verify the comment belongs to the current user
    const { data: comment, error: fetchError } = await supabase
      .from('chronicles_comments')
      .select('creator_id, post_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Get creator ID
    const { data: creator } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (comment.creator_id !== creator?.id) {
      return NextResponse.json(
        { error: "Unauthorized - you can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('chronicles_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Comment deletion error:', deleteError);
      throw deleteError;
    }

    // Decrease comment count
    await supabase
      .from('chronicles_chain_entry_posts')
      .update({ comments_count: supabase.rpc('decrement', { x: 1 }) })
      .eq('id', entryId);

    return NextResponse.json({ 
      success: true, 
      message: 'Comment deleted successfully' 
    });
  } catch (err) {
    console.error('Comment DELETE error', err);
    return NextResponse.json({ success: false, error: 'Failed to delete comment' }, { status: 500 });
  }
}
