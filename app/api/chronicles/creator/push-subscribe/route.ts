import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await request.json();

    // Save subscription to database
    const { data, error } = await supabase
      .from('chronicles_push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: subscription,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving subscription:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
