import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET details or POST new entry
export async function GET(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    // Use service role key for proper data access (bypass RLS if needed)
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

    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data, error } = await supabase
      .from('chronicles_writing_chains')
      .select(`
        *,
        entries:chronicles_chain_entries(
          id,
          post_id,
          chain_id,
          sequence,
          added_at,
          added_by,
          post:chronicles_posts(
            id,
            title,
            slug,
            excerpt,
            content,
            post_type,
            category,
            tags,
            cover_image_url,
            published_at,
            status,
            likes_count,
            comments_count,
            shares_count,
            views_count,
            creator_id,
            created_at
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Chain detail error:', error);
      throw error;
    }
    
    console.log('Chain fetched:', id, 'with entries:', data?.entries?.length || 0);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Chain detail error', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch chain' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let authUser: any;

    // Check for Authorization header (for mobile app)
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
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authUser = data.user;
    } else {
      // Fallback to cookie-based auth for web
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
              } catch {
                // Handle cookie setting errors
              }
            },
          },
        }
      );
      const { data, error } = await clientSupabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authUser = data.user;
    }

    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await request.json();
    const { title, content, excerpt, post_type = 'poem', category, tags = [], status = 'published' } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Get service role key - try multiple env var names
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Chain Service Role Key available:', !!serviceRoleKey);

    // Create client with service role if available
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

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (creatorError || !creator) {
      console.error('Creator fetch error:', creatorError);
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    console.log('Chain creator fetched:', creator);
    console.log('Creating chain post with creator_id:', creator.id);

    if (!creator.id) {
      console.error('Creator ID is empty or undefined');
      return NextResponse.json(
        { error: 'Creator ID validation failed' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Create post using service role client to bypass RLS
    const { data: post, error: postError } = await supabase
      .from('chronicles_posts')
      .insert({
        creator_id: creator.id,
        title,
        slug,
        excerpt,
        content,
        post_type,
        category,
        tags,
        status,
        formatting_data: {},
      })
      .select()
      .single();

    if (postError) {
      console.error('Post insert error:', postError);
      throw postError;
    }

    // Get the next sequence number for the chain
    const { data: existingEntries, error: entriesError } = await supabase
      .from('chronicles_chain_entries')
      .select('sequence')
      .eq('chain_id', id)
      .order('sequence', { ascending: false })
      .limit(1);

    if (entriesError) {
      console.error('Entries fetch error:', entriesError);
      throw entriesError;
    }

    const nextSequence = existingEntries && existingEntries.length > 0
      ? existingEntries[0].sequence + 1
      : 1;

    // Add entry to chain using service role client
    const { data: entry, error: entryError } = await supabase
      .from('chronicles_chain_entries')
      .insert({
        chain_id: id,
        post_id: post.id,
        sequence: nextSequence,
        added_by: creator.id
      })
      .select()
      .single();

    if (entryError) {
      console.error('Chain entry creation error:', entryError);
      throw entryError;
    }

    return NextResponse.json({ success: true, data: { post, entry } });
  } catch (err) {
    console.error('Chain entry creation error', err);
    return NextResponse.json({ success: false, error: 'Failed to create entry' }, { status: 500 });
  }
}
