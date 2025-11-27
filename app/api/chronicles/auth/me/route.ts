import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    // Get the current user from Supabase auth (service role key required)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: error?.message || "Not authenticated" }, { status: 401 });
    }

    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: "Creator profile not found", user }, { status: 404 });
    }

    return NextResponse.json({ user, creator });
  } catch (error) {
    console.error("Chronicles auth check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
