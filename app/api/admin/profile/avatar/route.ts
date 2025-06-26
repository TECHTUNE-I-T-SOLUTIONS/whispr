import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const admin = await requireAuthFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json({ error: "No avatar file provided" }, { status: 400 })
    }

    // Validate file size (5MB limit for avatars)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Avatar too large. Maximum size is 5MB" }, { status: 400 })
    }

    // Validate file type (only images for avatars)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" },
        { status: 400 },
      )
    }

    const supabase = createSupabaseServer()

    // Generate unique filename for avatar
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `avatar-${admin.id}-${timestamp}.${fileExtension}`
    const filePath = `avatars/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Delete old avatar if exists
    if (admin.avatar_url) {
      try {
        const oldPath = admin.avatar_url.split("/").pop()
        if (oldPath && oldPath.startsWith("avatar-")) {
          await supabase.storage.from("avatars").remove([`avatars/${oldPath}`])
        }
      } catch (error) {
        console.log("Could not delete old avatar:", error)
      }
    }

    // Upload new avatar to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(filePath, buffer, {
      contentType: file.type,
      duplex: "half",
      upsert: true,
    })

    if (uploadError) {
      console.error("Avatar upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update admin user with new avatar URL
    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admin_users")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id)
      .select()
      .single()

    if (updateError) {
      console.error("Avatar update error:", updateError)
      // Try to clean up uploaded file
      await supabase.storage.from("avatars").remove([filePath])
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      avatar_url: avatarUrl,
      message: "Avatar updated successfully",
    })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const admin = await requireAuthFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!admin.avatar_url) {
      return NextResponse.json({ error: "No avatar to delete" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Extract file path from URL
    try {
      const fileName = admin.avatar_url.split("/").pop()
      if (fileName && fileName.startsWith("avatar-")) {
        const filePath = `avatars/${fileName}`

        // Delete from storage
        const { error: storageError } = await supabase.storage.from("avatars").remove([filePath])

        if (storageError) {
          console.error("Storage delete error:", storageError)
        }
      }
    } catch (error) {
      console.log("Could not delete avatar file:", error)
    }

    // Update admin user to remove avatar URL
    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admin_users")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id)
      .select()
      .single()

    if (updateError) {
      console.error("Avatar removal error:", updateError)
      return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Avatar removed successfully",
    })
  } catch (error) {
    console.error("Avatar delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
