import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let query = supabase
      .from('chronicles_posts')
      .select(`*,
        creator:chronicles_creators(id,pen_name,profile_image_url),
        comment_count:chronicles_comments(count),
        reaction_count:chronicles_post_reactions(count)`
      )
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      data: data || [], 
      count,
      contentType: 'post'
    });
  } catch (err) {
    console.error('Admin posts list error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    const { error } = await supabase
      .from('chronicles_posts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Post status updated' });
  } catch (err) {
    console.error('Admin update post error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const url = new URL(request.url);
    const postId = url.pathname.split('/').pop();

    if (!postId) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('chronicles_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin delete post error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
