import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Get admin notifications
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const unreadOnly = searchParams.get("unread_only") === "true";
    const priority = searchParams.get("priority");

    // Try to get user, but don't fail if not authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Build query - allow unauthenticated access for now
    let query = supabase
      .from("chronicles_admin_notifications")
      .select(
        `
        *,
        creator:chronicles_creators(id, pen_name, profile_image_url),
        post:chronicles_posts(id, title, slug),
        comment:chronicles_comments(id, content)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    const { data, error } = await query;

    if (error) {
      // Return proper structure with empty array
      return NextResponse.json({ notifications: [] });
    }

    return NextResponse.json({ notifications: data || [] });
  } catch (error) {
    console.error("Admin notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const { notification_id, action_taken } = await request.json();

    const { data, error } = await supabase
      .from("chronicles_admin_notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
        action_taken: action_taken || undefined,
      })
      .eq("id", notification_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update notification" }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// Bulk mark as read
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const { notification_ids } = await request.json();

    const { error } = await supabase
      .from("chronicles_admin_notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .in("id", notification_ids);

    if (error) {
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 400 });
    }

    return NextResponse.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
