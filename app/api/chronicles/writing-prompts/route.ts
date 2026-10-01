import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
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
    
    // Get creator profile if user is authenticated
    let creatorId = null;
    if (user) {
      const { data: creator } = await supabase
        .from('chronicles_creators')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      creatorId = creator?.id;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const challengeType = searchParams.get('challenge_type');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('chronicles_writing_prompts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (challengeType) {
      query = query.eq('challenge_type', challengeType);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate user entries for each prompt (entries_count now comes from database column)
    const prompts = await Promise.all((data || []).map(async (prompt) => {
      // Get user entries count
      let userEntriesCount = 0;
      let hasUserEntered = false;

      if (creatorId) {
        const { count } = await supabase
          .from('chronicles_prompt_entries')
          .select('*', { count: 'exact', head: true })
          .eq('prompt_id', prompt.id)
          .eq('creator_id', creatorId);

        userEntriesCount = count || 0;
        hasUserEntered = userEntriesCount > 0;
      }

      return {
        ...prompt,
        entries_count: prompt.entries_count || 0, // Use database column instead of calculating
        user_entries_count: userEntriesCount,
        has_user_entered: hasUserEntered
      };
    }));

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error fetching writing prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writing prompts' },
      { status: 500 }
    );
  }
}
