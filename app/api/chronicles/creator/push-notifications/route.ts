import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// POST to subscribe or update push notification settings
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const userId = req.headers.get('x-user-id');
    const { enabled, subscription } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Update push notifications enabled status
    if (enabled !== undefined) {
      const { error: updateError } = await supabase
        .from('chronicles_creators')
        .update({ push_notifications_enabled: enabled })
        .eq('id', creator.id);

      if (updateError) throw updateError;
    }

    // If subscription provided, store it
    if (subscription) {
      const { error: subError } = await supabase
        .from('chronicles_push_subscriptions')
        .upsert({
          creator_id: creator.id,
          endpoint: subscription.endpoint,
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh,
        });

      if (subError) throw subError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update push settings' },
      { status: 400 }
    );
  }
}

// GET push notification settings
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: creator, error } = await supabase
      .from('chronicles_creators')
      .select('push_notifications_enabled')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return NextResponse.json({
      push_notifications_enabled: creator.push_notifications_enabled,
    });
  } catch (error) {
    console.error('Fetch push settings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 400 }
    );
  }
}
