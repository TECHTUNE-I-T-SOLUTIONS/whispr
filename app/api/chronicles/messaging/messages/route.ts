import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';

// Helper function to encrypt content (AES-256)
async function encryptContent(content: string): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const ivString = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Placeholder encryption - in production use proper crypto
  const encrypted = Buffer.from(content).toString('base64');
  
  return { encrypted, iv: ivString };
}

// Helper function to decrypt content
async function decryptContent(encrypted: string, iv: string): Promise<string> {
  try {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  } catch {
    return encrypted;
  }
}

// GET - Fetch messages for a conversation
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
      supabase = await createSupabaseServerClient();
    }

    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversation_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
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

    // Verify user is part of the conversation
    const { data: conversation } = await supabase
      .from("chronicles_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!conversation || 
        (conversation.participant_1_id !== creator.id && conversation.participant_2_id !== creator.id)) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from("chronicles_messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        encrypted_content,
        content_iv,
        message_type,
        reply_to_id,
        is_deleted,
        is_edited,
        edited_at,
        read_by_1,
        read_by_1_at,
        read_by_2,
        read_by_2_at,
        created_at,
        sender:chronicles_creators!chronicles_messages_sender_id_fkey(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Decrypt messages
    const decryptedMessages = await Promise.all(
      (messages || []).map(async (msg: any) => {
        const decryptedContent = await decryptContent(msg.encrypted_content, msg.content_iv);
        return {
          ...msg,
          content: decryptedContent,
          is_from_me: msg.sender_id === creator.id
        };
      })
    );

    // Mark messages as read
    const readField1 = conversation.participant_1_id === creator.id ? 'read_by_1' : 'read_by_2';
    const readField2 = conversation.participant_1_id === creator.id ? 'read_by_1_at' : 'read_by_2_at';
    
    await supabase
      .from("chronicles_messages")
      .update({
        [readField1]: true,
        [readField2]: new Date().toISOString()
      })
      .eq("conversation_id", conversationId)
      .neq("sender_id", creator.id)
      .eq(readField1, false);

    return NextResponse.json({
      messages: decryptedMessages.reverse(), // Return in chronological order
      total: decryptedMessages.length
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send a new message
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

    const body = await request.json();
    const { conversation_id, content, message_type = 'text', reply_to_id } = body;

    if (!conversation_id || !content) {
      return NextResponse.json({ error: "Conversation ID and content are required" }, { status: 400 });
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

    // Check messaging restrictions
    const { data: restrictions } = await supabase
      .rpc('check_messaging_restrictions', { creator_id: creator.id });

    if (restrictions && restrictions.length > 0 && !restrictions[0].can_send_messages) {
      return NextResponse.json({ 
        error: "Messaging restricted", 
        reason: restrictions[0].restriction_reason,
        ends_at: restrictions[0].restriction_ends_at
      }, { status: 403 });
    }

    // Verify user is part of the conversation
    const { data: conversation } = await supabase
      .from("chronicles_conversations")
      .select("*")
      .eq("id", conversation_id)
      .single();

    if (!conversation || 
        (conversation.participant_1_id !== creator.id && conversation.participant_2_id !== creator.id)) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Encrypt content
    const { encrypted, iv } = await encryptContent(content);

    // Create message
    const { data: message, error } = await supabase
      .from("chronicles_messages")
      .insert({
        conversation_id,
        sender_id: creator.id,
        encrypted_content: encrypted,
        content_iv: iv,
        message_type,
        reply_to_id,
        moderation_status: 'approved' // Auto-approve for now, can be changed for moderation
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: {
        ...message,
        content: content // Return decrypted content for immediate display
      },
      is_from_me: true
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
