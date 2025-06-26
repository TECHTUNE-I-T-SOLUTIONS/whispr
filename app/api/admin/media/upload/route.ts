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
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 50MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "application/pdf",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const fileName = `${timestamp}-${randomString}.${fileExtension}`
    const filePath = `uploads/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("media").upload(filePath, buffer, {
      contentType: file.type,
      duplex: "half",
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath)

    const fileUrl = urlData.publicUrl

    // Save file metadata to database
    const { data: mediaData, error: dbError } = await supabase
      .from("media")
      .insert({
        original_name: file.name,
        file_name: fileName,
        file_path: filePath,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        bucket_name: "media",
        uploaded_by: admin.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      // Try to clean up uploaded file
      await supabase.storage.from("media").remove([filePath])
      return NextResponse.json({ error: "Failed to save file metadata" }, { status: 500 })
    }

    return NextResponse.json({
      id: mediaData.id,
      original_name: mediaData.original_name,
      file_name: mediaData.file_name,
      file_path: mediaData.file_path,
      file_url: mediaData.file_url,
      file_type: mediaData.file_type,
      file_size: mediaData.file_size,
      created_at: mediaData.created_at,
    })
  } catch (error) {
    console.error("Media upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
