import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const admin = await requireAuthFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const type = searchParams.get("type") // image, video, audio, etc.
    const types = searchParams.getAll("type") // Support multiple types
    const search = searchParams.get("search")

    const supabase = createSupabaseServer()

    let query = supabase.from("media").select("*", { count: "exact" }).order("created_at", { ascending: false })

    // Apply filters
    if (types.length > 0) {
      // If multiple types are provided, use OR condition
      const typeConditions = types.map(t => `file_type.like.${t}%`)
      query = query.or(typeConditions.join(","))
    } else if (type) {
      query = query.like("file_type", `${type}%`)
    }

    if (search) {
      query = query.ilike("original_name", `%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: media, error, count } = await query

    if (error) {
      console.error("Media fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
    }

    return NextResponse.json({
      media: media || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Media API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const admin = await requireAuthFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 50MB." }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = type === "audio"
      ? ["audio/mp3", "audio/wav", "audio/mpeg", "audio/ogg", "audio/webm", "audio/mp4"]
      : ["video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov", "video/wmv"]

    if (!allowedTypes.some(allowedType => file.type.startsWith(allowedType.split("/")[0] + "/"))) {
      return NextResponse.json({ error: `Invalid file type. Please upload a ${type} file.` }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `uploads/${type}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath)

    // Save to database
    const { data: mediaData, error: dbError } = await supabase
      .from("media")
      .insert({
        original_name: file.name,
        file_name: fileName,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: admin.admin.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("media").remove([filePath])
      return NextResponse.json({ error: "Failed to save file information" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      media: mediaData,
    })
  } catch (error) {
    console.error("Media upload error:", error)
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

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("id")

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Get media info first
    const { data: media, error: fetchError } = await supabase
      .from("media")
      .select("file_path")
      .eq("id", mediaId)
      .single()

    if (fetchError || !media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage.from("media").remove([media.file_path])

    if (storageError) {
      console.error("Storage delete error:", storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase.from("media").delete().eq("id", mediaId)

    if (dbError) {
      console.error("Database delete error:", dbError)
      return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Media delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
