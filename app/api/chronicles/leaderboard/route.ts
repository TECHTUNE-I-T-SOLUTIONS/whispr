import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

// Get leaderboard rankings
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "weekly";
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data, error } = await supabase
      .from("chronicles_leaderboard")
      .select(
        `
        *,
        creator:chronicles_creators(id, pen_name, profile_image_url, points, total_posts, total_engagement)
      `
      )
      .eq("category", category)
      .order("score", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

// Update leaderboard scores (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { category = "weekly" } = await request.json();

    // Recalculate all leaderboard scores
    const { data: creators, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id, total_engagement, total_posts, streak_count");

    if (creatorError) throw creatorError;

    const updates = creators?.map((creator: any) => ({
      creator_id: creator.id,
      category,
      score:
        creator.total_engagement * 2 +
        creator.total_posts * 10 +
        creator.streak_count * 5,
      calculation_method: "weighted",
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates || []) {
      await supabase
        .from("chronicles_leaderboard")
        .upsert([update], { onConflict: "creator_id" });
    }

    return NextResponse.json({
      message: "Leaderboard updated successfully",
      count: updates?.length,
    });
  } catch (error) {
    console.error("Leaderboard update error:", error);
    return NextResponse.json(
      { error: "Failed to update leaderboard" },
      { status: 500 }
    );
  }
}
