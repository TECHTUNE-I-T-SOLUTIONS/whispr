import { createSupabaseServer } from '@/lib/supabase-server';
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Helper to get authenticated supabase client
function getAuthenticatedSupabase(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return createClient(
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
  }
  // Fallback to server-side auth for web
  return createSupabaseServer();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAuthenticatedSupabase(req);
    const { post_id, action, comment_text } = await req.json();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError) {
      // For anonymous users, use a guest creator ID or handle differently
      return NextResponse.json(
        { error: 'Only registered creators can engage' },
        { status: 401 }
      );
    }

    let engagementData: any = {
      post_id,
      creator_id: creator.id,
      action,
    };

    if (action === 'comment' && comment_text) {
      engagementData.comment_text = comment_text;
    }

    const { data: engagement, error: engageError } = await supabase
      .from('chronicles_engagement')
      .insert(engagementData)
      .select()
      .single();

    if (engageError) {
      // Check if it's a duplicate like/share
      if (engageError.code === '23505') {
        return NextResponse.json(
          { error: 'Already ' + action + 'ed' },
          { status: 400 }
        );
      }
      throw engageError;
    }

    return NextResponse.json(engagement, { status: 201 });
  } catch (error) {
    console.error('Engagement error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process engagement' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id');
    const action = searchParams.get('action');

    let query = supabase.from('chronicles_engagement').select('*');

    if (postId) query = query.eq('post_id', postId);
    if (action) query = query.eq('action', action);

    const { data: engagements, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json(engagements || []);
  } catch (error) {
    console.error('Fetch engagement error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch engagement' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const userId = req.headers.get('x-user-id');
    const { post_id, action } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Delete engagement
    const { error: deleteError } = await supabase
      .from('chronicles_engagement')
      .delete()
      .eq('post_id', post_id)
      .eq('creator_id', creator.id)
      .eq('action', action);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete engagement error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete engagement' },
      { status: 400 }
    );
  }
}
