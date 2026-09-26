import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';

// POST - Upload message attachment
export async function POST(request: NextRequest) {
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
      supabase = await createSupabaseServerClient();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const message_id = formData.get('message_id') as string;

    if (!file || !message_id) {
      return NextResponse.json({ error: "File and message ID are required" }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current creator
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    // Check messaging restrictions for attachments
    const { data: restrictions } = await supabase
      .rpc('check_messaging_restrictions', { creator_id: creator.id });

    if (restrictions && restrictions.length > 0 && !restrictions[0].can_send_attachments) {
      return NextResponse.json({ 
        error: "Attachment sending restricted", 
        reason: restrictions[0].restriction_reason
      }, { status: 403 });
    }

    // Verify message belongs to user's conversation
    const { data: message } = await supabase
      .from("chronicles_messages")
      .select(`
        *,
        conversation:chronicles_conversations!chronicles_messages_conversation_id_fkey(
          participant_1_id,
          participant_2_id
        )
      `)
      .eq("id", message_id)
      .single();

    if (!message || message.sender_id !== creator.id) {
      return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 });
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${message_id}_${Date.now()}.${fileExt}`;
    const filePath = `attachments/${creator.id}/${fileName}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chronicles-attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chronicles-attachments')
      .getPublicUrl(filePath);

    // Create attachment record
    const { data: attachment, error: dbError } = await supabase
      .from("chronicles_message_attachments")
      .insert({
        message_id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        processing_status: 'completed'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      attachment: {
        ...attachment,
        url: publicUrl
      },
      message: "Attachment uploaded successfully"
    });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}
