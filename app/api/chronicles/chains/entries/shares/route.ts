import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST to track a share of a chain entry post
export async function POST(request: NextRequest) {
  try {
    const { entry_post_id } = await request.json();

    if (!entry_post_id) {
      return NextResponse.json({ error: 'Entry post ID is required' }, { status: 400 });
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

    // Get current shares count
    const { data: post, error: postError } = await supabase
      .from('chronicles_chain_entry_posts')
      .select('shares_count, id, title')
      .eq('id', entry_post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Update shares count
    const newSharesCount = (post.shares_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('chronicles_chain_entry_posts')
      .update({ shares_count: newSharesCount })
      .eq('id', entry_post_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      action: 'shared',
      sharesCount: newSharesCount,
      postTitle: post.title,
    });
  } catch (error) {
    console.error('POST share error', error);
    return NextResponse.json({ error: 'Failed to record share' }, { status: 500 });
  }
}

// GET shares count for a chain entry post
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entryPostId = searchParams.get('entry_post_id');

  if (!entryPostId) {
    return NextResponse.json({ error: 'Entry post ID is required' }, { status: 400 });
  }

  try {
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

    const { data: post, error: postError } = await supabase
      .from('chronicles_chain_entry_posts')
      .select('shares_count')
      .eq('id', entryPostId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ sharesCount: post.shares_count || 0 });
  } catch (error) {
    console.error('GET shares error', error);
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }
}
