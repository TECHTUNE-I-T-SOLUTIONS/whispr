import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status'); // active, inactive, suspended, approved
    const limit = parseInt(searchParams.get('limit') || '100');
    const creatorId = searchParams.get('creator_id');
    const includeTransactions = searchParams.get('include_transactions') === 'true';

    let query = supabase
      .from('chronicles_monetization')
      .select(`*, creator:chronicles_creators(id,pen_name,profile_image_url)`);

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    if (status && status !== 'all') {
      query = query.eq('program_status', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    let response: any = { success: true, monetizations: data || [] };

    if (creatorId && includeTransactions) {
      // fetch transactions for that creator
      const { data: txs, error: txError } = await supabase
        .from('chronicles_earnings_transactions')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (txError) console.error('Transactions fetch error', txError);
      response.transactions = txs || [];
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('Admin monetization error:', err);
    return NextResponse.json({ success: false, monetizations: [] }, { status: 500 });
  }
}
