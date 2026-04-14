import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// list or create chains
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const term = searchParams.get('q');

    let query = supabase
      .from('chronicles_writing_chains')
      .select('*, entries:chronicles_chain_entries(count)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (term) {
      query = query.ilike('title', `%${term}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Get service role client for flagged reviews access
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const accessClient = serviceRoleKey 
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
      : supabase;

    // Fetch flagged reviews for chain entries
    const chainIds = (data || []).map(c => c.id);
    const { data: flaggedEntries } = await accessClient
      .from('chronicles_flagged_reviews')
      .select('chain_entry_post_id')
      .in('chain_entry_post_id', 
        (await accessClient
          .from('chronicles_chain_entries')
          .select('id')
          .in('chain_id', chainIds)).data?.map(e => e.id) || []
      )
      .in('status', ['pending', 'under_review']);

    const flaggedEntryIds = new Set(flaggedEntries?.map(r => r.chain_entry_post_id) || []);

    // Transform entries count from nested structure to flat property
    const transformedData = (data || []).map((chain: any) => ({
      ...chain,
      entries_count: chain.entries?.[0]?.count || 0,
      hasFlaggedEntries: [...flaggedEntryIds].some(id => id) && flaggedEntryIds.size > 0,
      entries: undefined, // Remove the nested entries array
    }));

    return NextResponse.json({ success: true, data: transformedData, count });
  } catch (err) {
    console.error('Chains GET error', err);
    return NextResponse.json({ success: false, error: 'Failed to list chains' }, { status: 500 });
  }
}

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
      const cookieStore = await cookies();
      supabase = createServerClient(
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
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description } = await request.json();

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('chronicles_writing_chains')
      .insert({ title, description, created_by: creator.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Chains POST error', err);
    return NextResponse.json({ success: false, error: 'Failed to create chain' }, { status: 500 });
  }
}
