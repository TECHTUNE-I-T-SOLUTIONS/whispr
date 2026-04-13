import { createSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id: chainId, entryId } = await params;
    console.log("Deleting entry:", entryId, "from chain:", chainId);
    
    const supabase = createSupabaseServer();

    // Delete from the correct table: chronicles_chain_entry_posts
    const { error: deleteError } = await supabase
      .from('chronicles_chain_entry_posts')
      .delete()
      .eq('id', entryId)
      .eq('chain_id', chainId);

    if (deleteError) {
      console.error("❌ Failed to delete entry:", deleteError);
      return NextResponse.json(
        { error: 'Failed to delete entry', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("✅ Entry deleted successfully");
    return NextResponse.json({ success: true, message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
