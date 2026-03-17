import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"
import { getAvatarProxyUrl, extractFilenameFromUrl } from "@/lib/avatar-proxy"

export async function GET(request: NextRequest) {
  try {
    let supabase;

    // Check for Authorization header (for mobile app)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
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
      // Fallback to cookie-based auth for web
      supabase = createSupabaseServer();
    }

    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('Auth error in GET user profile:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile from chronicles_creators table
    const { data: profile, error: profileError } = await supabase
      .from('chronicles_creators')
      .select('id, user_id, pen_name, email, bio, profile_image_url, avatar_url, display_name, social_links, content_type, preferred_categories, status, role, total_followers, is_verified, joined_at')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Process avatar URLs to use proxy
    let processedProfileImageUrl = profile.profile_image_url;
    let processedAvatarUrl = profile.avatar_url;

    if (profile.profile_image_url) {
      if (profile.profile_image_url.startsWith('http')) {
        // Extract filename and create proxy URL
        const filename = extractFilenameFromUrl(profile.profile_image_url);
        processedProfileImageUrl = getAvatarProxyUrl(filename);
      } else {
        processedProfileImageUrl = supabase.storage.from('chronicles-profiles').getPublicUrl(profile.profile_image_url).data.publicUrl;
      }
    }

    if (profile.avatar_url) {
      if (profile.avatar_url.startsWith('http')) {
        // Extract filename and create proxy URL
        const filename = extractFilenameFromUrl(profile.avatar_url);
        processedAvatarUrl = getAvatarProxyUrl(filename);
      } else {
        processedAvatarUrl = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl;
      }
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        userId: profile.user_id,
        penName: profile.pen_name,
        email: profile.email,
        bio: profile.bio,
        profileImageUrl: processedProfileImageUrl,
        avatarUrl: processedAvatarUrl,
        displayName: profile.display_name,
        socialLinks: profile.social_links,
        contentType: profile.content_type,
        preferredCategories: profile.preferred_categories,
        status: profile.status,
        role: profile.role,
        totalFollowers: profile.total_followers,
        isVerified: profile.is_verified,
        joinedAt: profile.joined_at,
      }
    });

  } catch (error) {
    console.error('User profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}