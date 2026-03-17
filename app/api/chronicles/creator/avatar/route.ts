import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"
import { getAvatarProxyUrl, extractFilenameFromUrl } from "@/lib/avatar-proxy"

export async function GET(request: NextRequest) {
  try {
    let supabase

    // Check for Authorization header (for mobile app)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
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
      )
    } else {
      // Fallback to cookie-based auth for web
      supabase = createSupabaseServer()
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      )
    }

    // Get creator profile
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("profile_image_url, avatar_url")
      .eq("user_id", user.id)
      .single()

    if (creatorError) {
      console.error("Creator fetch error:", creatorError)
      return NextResponse.json(
        { error: "Creator profile not found", success: false },
        { status: 404 }
      )
    }

    // Use avatar_url if available, otherwise profile_image_url
    const avatarUrl = creator.avatar_url || creator.profile_image_url

    if (!avatarUrl) {
      return NextResponse.json({
        success: true,
        avatar: null,
        message: "No avatar set"
      })
    }

    // Return full public URL directly from Supabase
    let publicUrl = avatarUrl
    
    // If it's not already an http URL, construct it from Supabase storage
    if (!avatarUrl.startsWith('http')) {
      const { data } = supabase.storage.from('chronicles-profiles').getPublicUrl(avatarUrl)
      publicUrl = data.publicUrl
    }

    return NextResponse.json({
      success: true,
      avatar: publicUrl
    })
  } catch (error) {
    console.error("Avatar API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch avatar", success: false },
      { status: 500 }
    )
  }
}