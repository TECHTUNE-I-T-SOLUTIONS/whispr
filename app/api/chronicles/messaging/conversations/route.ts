import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';

// Helper function to encrypt content (AES-256)
async function encryptContent(content: string): Promise<{ encrypted: string; iv: string }> {
  // In production, use proper encryption library like crypto-js or webcrypto
  // For now, we'll use a simple base64 encoding as placeholder
  // TODO: Implement proper AES-256 encryption
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
  // In production, use proper decryption
  // For now, we'll use simple base64 decoding as placeholder
  // TODO: Implement proper AES-256 decryption
  try {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  } catch {
    return encrypted; // Return as-is if decryption fails
  }
}

// GET - Fetch user's conversations
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Authenticated user:", user.id);

    // Get current creator
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creatorError) {
      console.error("Creator lookup error:", creatorError);
      return NextResponse.json({ error: "Creator profile not found", details: creatorError.message }, { status: 404 });
    }

    if (!creator) {
      console.error("No creator found for user:", user.id);
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    console.log("Creator found:", creator.id);

    // Skip restriction check for now - can be added later
    // Check messaging restrictions
    // const { data: restrictions } = await supabase
    //   .rpc('check_messaging_restrictions', { creator_id: creator.id });

    // if (restrictions && restrictions.length > 0 && !restrictions[0].can_create_conversations) {
    //   return NextResponse.json({ 
    //     error: "Messaging restricted", 
    //     reason: restrictions[0].restriction_reason,
    //     ends_at: restrictions[0].restriction_ends_at
    //   }, { status: 403 });
    // }

    // Fetch conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from("chronicles_conversations")
      .select(`
        id,
        participant_1_id,
        participant_2_id,
        last_message_at,
        last_message_preview,
        message_count,
        is_active,
        is_archived_by_1,
        is_archived_by_2,
        created_at,
        participant_1:chronicles_creators!chronicles_conversations_participant_1_id_fkey(
          id,
          pen_name,
          profile_image_url
        ),
        participant_2:chronicles_creators!chronicles_conversations_participant_2_id_fkey(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .or(`participant_1_id.eq.${creator.id},participant_2_id.eq.${creator.id}`)
      .eq("is_active", true)
      .order("last_message_at", { ascending: false });

    if (error) throw error;

    // Get unread message counts for each conversation
    const conversationsWithUnread = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const otherParticipantId = conv.participant_1_id === creator.id 
          ? conv.participant_2_id 
          : conv.participant_1_id;

        const { count } = await supabase
          .from("chronicles_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("sender_id", otherParticipantId)
          .eq("read_by_1", conv.participant_1_id === creator.id ? false : true)
          .eq("read_by_2", conv.participant_2_id === creator.id ? false : true);

        return {
          ...conv,
          unread_count: count || 0,
          other_participant: conv.participant_1_id === creator.id 
            ? conv.participant_2 
            : conv.participant_1
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithUnread,
      total: conversationsWithUnread.length
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST - Create new conversation
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
    const { participant_id } = body;

    if (!participant_id) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error in POST:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST - Authenticated user:", user.id);

    // Get current creator
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creatorError) {
      console.error("Creator lookup error in POST:", creatorError);
      return NextResponse.json({ error: "Creator profile not found", details: creatorError.message }, { status: 404 });
    }

    if (!creator) {
      console.error("No creator found for user in POST:", user.id);
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    console.log("POST - Creator found:", creator.id);

    // Skip restriction check for now
    // const { data: restrictions } = await supabase
    //   .rpc('check_messaging_restrictions', { creator_id: creator.id });

    // if (restrictions && restrictions.length > 0 && !restrictions[0].can_create_conversations) {
    //   return NextResponse.json({ 
    //     error: "Messaging restricted", 
    //     reason: restrictions[0].restriction_reason,
    //     ends_at: restrictions[0].restriction_ends_at
    //   }, { status: 403 });
    // }

    // Check if conversation already exists (in either direction)
    const { data: existingConversation } = await supabase
      .from("chronicles_conversations")
      .select("*")
      .or(`and(participant_1_id.eq.${creator.id},participant_2_id.eq.${participant_id}),and(participant_1_id.eq.${participant_id},participant_2_id.eq.${creator.id})`)
      .eq("is_active", true)
      .single();

    if (existingConversation) {
      return NextResponse.json({
        conversation: existingConversation,
        message: "Conversation already exists"
      });
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from("chronicles_conversations")
      .insert({
        participant_1_id: creator.id,
        participant_2_id: participant_id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      conversation,
      message: "Conversation created successfully"
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
