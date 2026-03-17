import { NextResponse, NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server-client";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Destructure all fields from the form
    const {
      email,
      password,
      penName,
      displayName,
      bio,
      profileImage, // Base64 or file data
      contentType,
      preferredCategories,
      profileVisibility,
      socialLinks,
      pushNotifications,
      emailDigest,
      emailOnEngagement,
    } = body;

    // Validation
    const errors: string[] = [];

    if (!email || !email.includes("@")) errors.push("Valid email is required");
    if (!password || password.length < 8) errors.push("Password must be at least 8 characters");
    if (!penName || penName.length < 2) errors.push("Pen name must be at least 2 characters");
    if (!displayName || displayName.length < 2) errors.push("Display name is required");
    if (!contentType || !["blog", "poem", "both"].includes(contentType)) {
      errors.push("Valid content type is required");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join("; ") },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    
    // Create service role client for operations that bypass RLS
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Check if email already exists in auth.users or chronicles_creators
    const { data: existingEmail } = await serviceRoleClient
      .from("chronicles_creators")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // 2. Check if pen_name already exists (must be unique)
    const { data: existingPenName } = await serviceRoleClient
      .from("chronicles_creators")
      .select("id")
      .eq("pen_name", penName)
      .single();

    if (existingPenName) {
      return NextResponse.json(
        { error: "Pen name already taken" },
        { status: 409 }
      );
    }

    // 3. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error("Auth signup error:", authError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    let profileImageUrl: string | null = null;

    // 4. Handle profile image upload (if provided) using service role storage
    if (profileImage && profileImage.startsWith("data:image")) {
      try {
        // Convert base64 to blob
        const base64Data = profileImage.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        
        // Generate filename
        const filename = `${userId}-${Date.now()}.jpg`;
        const filepath = `profiles/${filename}`;

        // Upload to Supabase Storage using service role to bypass RLS
        const { error: uploadError } = await serviceRoleClient.storage
          .from("chronicles-profiles")
          .upload(filepath, buffer, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (!uploadError) {
          // Get public URL
          const { data: urlData } = serviceRoleClient.storage
            .from("chronicles-profiles")
            .getPublicUrl(filepath);
          
          profileImageUrl = urlData?.publicUrl || null;
        } else {
          console.error("Image upload error:", uploadError);
          // Continue without image - not a fatal error
        }
      } catch (imgError) {
        console.error("Image processing error:", imgError);
        // Continue without image
      }
    }

    // 5. Create creator profile in chronicles_creators using service role
    // Note: program_id is optional - creators don't need to be assigned to a program on signup
    const { data: creator, error: creatorError } = await serviceRoleClient
      .from("chronicles_creators")
      .insert({
        user_id: userId,
        email,
        pen_name: penName,
        display_name: displayName,
        bio: bio || null,
        profile_image_url: profileImageUrl,
        
        // Content preferences
        content_type: contentType,
        preferred_categories: preferredCategories || [],
        
        // Profile settings
        profile_visibility: profileVisibility || "public",
        
        // Notification settings
        push_notifications_enabled: pushNotifications ?? true,
        email_digest_enabled: emailDigest ?? true,
        email_on_engagement: emailOnEngagement ?? true,
        
        // Social links
        social_links: socialLinks || {},
        
        // Status
        status: "active",
        role: "creator",
        is_verified: false,
        is_banned: false,
        
        // Initial values
        streak_count: 0,
        longest_streak: 0,
        total_posts: 0,
        total_poems: 0,
        total_blog_posts: 0,
        total_engagement: 0,
        total_shares: 0,
        points: 0,
        badges: [],
        
        // Timestamps
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (creatorError || !creator) {
      console.error("Creator creation error:", {
        error: creatorError,
        email,
        penName,
        userId,
        message: creatorError?.message,
        code: creatorError?.code,
        details: creatorError?.details,
      });
      
      // Clean up auth user if creator creation fails
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }

      return NextResponse.json(
        { 
          error: "Failed to create creator profile: " + (creatorError?.message || "Unknown error"),
          details: process.env.NODE_ENV === "development" ? creatorError : undefined
        },
        { status: 500 }
      );
    }

    // 7. Log the signup activity using service role
    try {
      await serviceRoleClient
        .from("chronicles_admin_activity_log")
        .insert({
          activity_type: "creator_signup",
          creator_id: creator.id,
          title: "New Creator Signup",
          description: `Creator ${penName} (${email}) has joined Chronicles`,
        });
    } catch (logError) {
      console.error("Activity log error:", logError);
      // Don't fail if logging fails
    }

    // 8. Sign in the user to establish session
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    try {
      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("Auto sign-in successful:", {
        userId: signInResult.data?.user?.id,
        email: signInResult.data?.user?.email,
      });
      accessToken = signInResult.data?.session?.access_token || null;
      refreshToken = signInResult.data?.session?.refresh_token || null;
    } catch (signInError) {
      console.error("Sign in error after signup:", signInError);
      // Continue - signup is successful even if auto-signin fails
    }

    return NextResponse.json(
      {
        success: true,
        creator: {
          id: creator.id,
          user_id: creator.user_id,
          email: creator.email,
          pen_name: creator.pen_name,
          display_name: creator.display_name,
          profile_image_url: creator.profile_image_url,
          content_type: creator.content_type,
          preferred_categories: creator.preferred_categories,
          profile_visibility: creator.profile_visibility,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to return available categories and content types
export async function GET() {
  return NextResponse.json({
    contentTypes: ["blog", "poem", "both"],
    categories: [
      "Technology",
      "Travel",
      "Food",
      "Lifestyle",
      "Business",
      "Health",
      "Education",
      "Entertainment",
      "Sports",
      "Nature",
      "Art",
      "Other",
    ],
  });
}
