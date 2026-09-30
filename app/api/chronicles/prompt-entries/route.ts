import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore.toString()
          }
        }
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      prompt_id,
      post_id,
      chain_entry_post_id,
      admin_post_id,
      entry_type
    } = body;

    // Validate the prompt exists and is active
    const { data: prompt, error: promptError } = await supabase
      .from('chronicles_writing_prompts')
      .select('*')
      .eq('id', prompt_id)
      .eq('status', 'active')
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'Invalid or inactive prompt' },
        { status: 400 }
      );
    }

    // Check if deadline has passed
    if (prompt.submission_deadline && new Date(prompt.submission_deadline) < new Date()) {
      return NextResponse.json(
        { error: 'Challenge submission deadline has passed' },
        { status: 400 }
      );
    }

    // Check if user has already reached max entries
    const { count: existingEntries } = await supabase
      .from('chronicles_prompt_entries')
      .select('*', { count: 'exact', head: true })
      .eq('prompt_id', prompt_id)
      .eq('creator_id', creator.id);

    if (existingEntries && existingEntries >= prompt.max_entries_per_user) {
      return NextResponse.json(
        { error: 'Maximum entries reached for this challenge' },
        { status: 400 }
      );
    }

    // Validate the post exists and belongs to the creator
    let postExists = false;
    if (entry_type === 'chronicles_post' && post_id) {
      const { data: post } = await supabase
        .from('chronicles_posts')
        .select('id, creator_id')
        .eq('id', post_id)
        .eq('creator_id', creator.id)
        .single();
      postExists = !!post;
    } else if (entry_type === 'chain_entry_post' && chain_entry_post_id) {
      const { data: post } = await supabase
        .from('chronicles_chain_entry_posts')
        .select('id, creator_id')
        .eq('id', chain_entry_post_id)
        .eq('creator_id', creator.id)
        .single();
      postExists = !!post;
    } else if (entry_type === 'admin_post' && admin_post_id) {
      // Admin posts don't have creator_id in the same way
      const { data: post } = await supabase
        .from('posts')
        .select('id')
        .eq('id', admin_post_id)
        .single();
      postExists = !!post;
    }

    if (!postExists) {
      return NextResponse.json(
        { error: 'Invalid post or unauthorized' },
        { status: 400 }
      );
    }

    // Create the prompt entry
    const { data: entry, error: entryError } = await supabase
      .from('chronicles_prompt_entries')
      .insert({
        prompt_id,
        creator_id: creator.id,
        post_id: entry_type === 'chronicles_post' ? post_id : null,
        chain_entry_post_id: entry_type === 'chain_entry_post' ? chain_entry_post_id : null,
        admin_post_id: entry_type === 'admin_post' ? admin_post_id : null,
        entry_type,
        status: 'submitted'
      })
      .select()
      .single();

    if (entryError) throw entryError;

    // Update the post to mark it as a challenge entry
    if (entry_type === 'chronicles_post' && post_id) {
      await supabase
        .from('chronicles_posts')
        .update({ is_challenge_entry: true, prompt_entry_id: entry.id })
        .eq('id', post_id);
    } else if (entry_type === 'chain_entry_post' && chain_entry_post_id) {
      await supabase
        .from('chronicles_chain_entry_posts')
        .update({ is_challenge_entry: true, prompt_entry_id: entry.id })
        .eq('id', chain_entry_post_id);
    } else if (entry_type === 'admin_post' && admin_post_id) {
      await supabase
        .from('posts')
        .update({ is_challenge_entry: true, prompt_entry_id: entry.id })
        .eq('id', admin_post_id);
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt entry:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt entry' },
      { status: 500 }
    );
  }
}
