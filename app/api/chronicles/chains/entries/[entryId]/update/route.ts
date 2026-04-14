import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;
    if (!entryId) return NextResponse.json({ error: 'Missing entryId' }, { status: 400 });

    let authUser: any;

    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const clientSupabase = createClient(
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
      const { data, error } = await clientSupabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      authUser = data.user;
    } else {
      const cookieStore = await cookies();
      const clientSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {}
            },
          },
        }
      );
      const { data, error } = await clientSupabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      authUser = data.user;
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        },
      }
    );

    // Get the entry to verify ownership
    const { data: entry, error: entryError } = await supabase
      .from('chronicles_chain_entry_posts')
      .select('id, creator_id')
      .eq('id', entryId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Get creator to verify ownership
    const { data: creator } = await supabase
      .from('chronicles_creators')
      .select('id, user_id')
      .eq('user_id', authUser.id)
      .single();

    // Check if user is the owner
    if (creator?.id !== entry.creator_id) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only edit your own entries' },
        { status: 403 }
      );
    }

    // Get the request body
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      cover_image_url,
      category,
      tags,
      status,
    } = body;

    // Validate required fields
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt?.trim() || content.trim().substring(0, 200),
      status: status || 'published',
      updated_at: new Date().toISOString(),
    };

    if (cover_image_url !== undefined) {
      updateData.cover_image_url = cover_image_url || null;
    }
    if (category !== undefined) {
      updateData.category = category || null;
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : [];
    }

    // Update the chain entry post
    const { data: updatedEntry, error: updateError } = await supabase
      .from('chronicles_chain_entry_posts')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating chain entry:', updateError);
      return NextResponse.json(
        { error: 'Failed to update entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedEntry,
    });
  } catch (error) {
    console.error('Chain entry update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
