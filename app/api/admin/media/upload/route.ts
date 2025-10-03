import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { requireAuthFromRequest } from "@/lib/auth-server";
import type { Database } from "@/types/supabase";

type Admin = Database["public"]["Tables"]["admin"]["Row"];

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const { admin } = (await requireAuthFromRequest(request)) as { admin: Admin };
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("No file found in formData");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Size validation
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      console.error("File too large:", file.size);
      return NextResponse.json({ error: "File too large. Max 50MB" }, { status: 400 });
    }

    // Type validation
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/x-icon",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "application/pdf",
    ]


    if (!allowedTypes.includes(file.type)) {
      console.error("Unsupported file type:", file.type);
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createSupabaseServer();

    // Unique filename and path
    const ext = file.name.split(".").pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `uploads/${uniqueName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "public, max-age=31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Upload to storage failed" }, { status: 500 });
    }

      // Get public URL
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

      if (!urlData?.publicUrl) {
        console.error("Failed to get public URL for uploaded file");
        return NextResponse.json({ error: "Failed to generate file URL" }, { status: 500 });
      }


    const fileUrl = urlData.publicUrl;

    // Save metadata to DB
    const { data: mediaData, error: dbError } = await supabase
      .from("media")
      .insert({
        original_name: file.name,
        file_name: uniqueName,
        file_path: path,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        bucket_name: "media",
        uploaded_by: admin.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to save metadata:", dbError);
      await supabase.storage.from("media").remove([path]); // cleanup
      return NextResponse.json({ error: "Failed to save metadata" }, { status: 500 });
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
    });
  } catch (err: any) {
    console.error("Unhandled media upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
