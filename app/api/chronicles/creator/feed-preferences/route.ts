import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    let supabase;

    // Check for Authorization header (for mobile app)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createClient(
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
    } else {
      supabase = await createSupabaseServerClient();
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator
    const { data: creator } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Get feed preferences
    const { data: preferences } = await supabase
      .from("chronicles_feed_preferences")
      .select("*")
      .eq("creator_id", creator.id)
      .single();

    if (!preferences) {
      // Create default preferences
      const { data: newPreferences } = await supabase
        .from("chronicles_feed_preferences")
        .insert({
          creator_id: creator.id,
          feed_algorithm: 'trending',
          show_adult_content: false,
        })
        .select()
        .single();

      return NextResponse.json(newPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching feed preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    let supabase;

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createClient(
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
    } else {
      supabase = await createSupabaseServerClient();
    }

    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: creator } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const { data: preferences } = await supabase
      .from("chronicles_feed_preferences")
      .upsert({
        creator_id: creator.id,
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating feed preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
