import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"
import type { Database } from "@/types/supabase"

type Admin = Database["public"]["Tables"]["admin"]["Row"]

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request) as { admin: Admin }

    const formData = await request.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json({ error: "No avatar file provided" }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Avatar too large. Maximum size is 5MB" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" },
        { status: 400 },
      )
    }

    const supabase = createSupabaseServer()

    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `avatar-${admin.id}-${timestamp}.${fileExtension}`
    const filePath = `${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Delete old avatar
    if (admin.avatar_url) {
      try {
        const oldFileName = admin.avatar_url.split("/").pop()
        if (oldFileName?.startsWith("avatar-")) {
          await supabase.storage.from("avatars").remove([oldFileName])
        }
      } catch (error) {
        console.warn("Could not delete old avatar:", error)
      }
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        duplex: "half",
        upsert: true,
      })

    if (uploadError) {
      console.error("Avatar upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
    const avatarUrl = urlData.publicUrl

    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admin")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id)
      .select()
      .single()

    if (updateError) {
      console.error("Failed to update profile with new avatar:", updateError)
      await supabase.storage.from("avatars").remove([filePath])
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      admin: updatedAdmin,
      avatar_url: avatarUrl,
      message: "Avatar updated successfully",
    })
  } catch (error) {
    console.error("Unhandled avatar upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request) as { admin: Admin }

    if (!admin.avatar_url) {
      return NextResponse.json({ error: "No avatar to delete" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    try {
      const fileName = admin.avatar_url.split("/").pop()
      if (fileName?.startsWith("avatar-")) {
        await supabase.storage.from("avatars").remove([`avatars/${fileName}`])
      }
    } catch (error) {
      console.warn("Could not delete avatar file:", error)
    }

    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admin")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id)
      .select()
      .single()

    if (updateError) {
      console.error("Failed to remove avatar:", updateError)
      return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 })
    }

    return NextResponse.json({
      admin: updatedAdmin,
      message: "Avatar removed successfully",
    })
  } catch (error) {
    console.error("Unhandled avatar delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
