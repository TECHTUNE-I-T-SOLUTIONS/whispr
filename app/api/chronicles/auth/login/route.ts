import { NextResponse, NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Create SSR client to establish session with cookies
    const supabase = await createSupabaseServerClient();

    // 1. Sign in with Supabase Auth - this handles password verification
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 2. Get creator profile
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id, email, pen_name, display_name, profile_image_url, is_verified")
      .eq("user_id", authData.user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // 3. Session is automatically set by createSupabaseServerClient via cookies
    // Return success response
    return NextResponse.json(
      {
        success: true,
        creator: {
          id: creator.id,
          email: creator.email,
          penName: creator.pen_name,
          displayName: creator.display_name,
          profileImage: creator.profile_image_url,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
