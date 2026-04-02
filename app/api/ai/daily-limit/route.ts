import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Bearer token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user is authenticated
    const authClient = createClient(
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

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count AI-generated chronicles posts by this user created today
    const { data: aiPosts, error: countError } = await supabase
      .from("chronicles_posts")
      .select("id", { count: "exact" })
      .eq("creator_id", user.id)
      .eq("source", "ai-generated")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    if (countError) {
      console.error("Error counting daily AI posts:", countError);
      return NextResponse.json(
        { error: "Failed to check daily limit" },
        { status: 500 }
      );
    }

    const dailyCount = aiPosts?.length || 0;
    const remainingCount = Math.max(0, 5 - dailyCount);
    const hasReachedLimit = dailyCount >= 5;

    console.log(`User ${user.id}: AI posts today: ${dailyCount}/5`);

    return NextResponse.json({
      success: true,
      dailyCount,
      dailyLimit: 5,
      remainingCount,
      hasReachedLimit,
      resetTime: tomorrow.toISOString(),
    });
  } catch (error) {
    console.error("Error checking daily limit:", error);
    return NextResponse.json(
      { error: "Failed to check daily limit" },
      { status: 500 }
    );
  }
}
