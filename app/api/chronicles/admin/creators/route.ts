import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();

    // Get all creators with their stats
    const { data: creators, error } = await supabase
      .from("chronicles_creators")
      .select(`
        id,
        user_id,
        pen_name,
        bio,
        profile_image_url,
        is_verified,
        is_banned,
        total_posts,
        total_engagement,
        total_followers,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      creators: creators || [],
      total: creators?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching creators:", error);
    return NextResponse.json(
      { error: "Failed to fetch creators", creators: [] },
      { status: 500 }
    );
  }
}
