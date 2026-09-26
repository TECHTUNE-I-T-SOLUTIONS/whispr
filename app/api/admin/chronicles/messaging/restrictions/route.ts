import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { requireAuthFromRequest } from "@/lib/auth-server";

// GET - Fetch all messaging restrictions
export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const supabase = createSupabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';

    // Build query
    let query = supabase
      .from("chronicles_messaging_restrictions")
      .select(`
        *,
        creator:chronicles_creators!chronicles_messaging_restrictions_creator_id_fkey(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .order("created_at", { ascending: false });

    if (status !== 'all') {
      if (status === 'active') {
        query = query.eq("is_active", true);
      } else if (status === 'expired') {
        query = query.eq("is_active", false);
      }
    }

    const { data: restrictions, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      restrictions: restrictions || [],
      total: restrictions?.length || 0
    });
  } catch (error) {
    console.error("Error fetching restrictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch restrictions" },
      { status: 500 }
    );
  }
}

// POST - Create new messaging restriction
export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const supabase = createSupabaseServer();
    const body = await request.json();
    const { 
      creator_id, 
      restriction_type, 
      reason, 
      can_send_messages = false,
      can_receive_messages = false,
      can_send_attachments = false,
      can_create_conversations = false,
      ends_at 
    } = body;

    if (!creator_id || !restriction_type || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Deactivate any existing active restrictions
    await supabase
      .from("chronicles_messaging_restrictions")
      .update({ is_active: false, lifted_at: new Date().toISOString() })
      .eq("creator_id", creator_id)
      .eq("is_active", true);

    // Create new restriction
    const { data: restriction, error } = await supabase
      .from("chronicles_messaging_restrictions")
      .insert({
        creator_id,
        restriction_type,
        reason,
        restricted_by: admin.id,
        starts_at: new Date().toISOString(),
        ends_at: restriction_type === 'temporary' ? ends_at : null,
        can_send_messages,
        can_receive_messages,
        can_send_attachments,
        can_create_conversations
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      restriction,
      message: "Restriction created successfully"
    });
  } catch (error) {
    console.error("Error creating restriction:", error);
    return NextResponse.json(
      { error: "Failed to create restriction" },
      { status: 500 }
    );
  }
}
