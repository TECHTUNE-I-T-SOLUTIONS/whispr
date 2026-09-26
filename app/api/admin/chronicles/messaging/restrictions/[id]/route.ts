import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { requireAuthFromRequest } from "@/lib/auth-server";

// PATCH - Update or lift restriction
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const supabase = createSupabaseServer();
    const { id } = await params;
    const body = await request.json();
    const { action, lift_reason } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    if (action === 'lift') {
      // Lift the restriction
      const { data: restriction, error } = await supabase
        .from("chronicles_messaging_restrictions")
        .update({
          is_active: false,
          lifted_by: admin.id,
          lifted_at: new Date().toISOString(),
          lift_reason: lift_reason || 'Restriction lifted by admin'
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        restriction,
        message: "Restriction lifted successfully"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating restriction:", error);
    return NextResponse.json(
      { error: "Failed to update restriction" },
      { status: 500 }
    );
  }
}

// DELETE - Remove restriction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const supabase = createSupabaseServer();
    const { id } = await params;

    const { error } = await supabase
      .from("chronicles_messaging_restrictions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Restriction deleted successfully" });
  } catch (error) {
    console.error("Error deleting restriction:", error);
    return NextResponse.json(
      { error: "Failed to delete restriction" },
      { status: 500 }
    );
  }
}
