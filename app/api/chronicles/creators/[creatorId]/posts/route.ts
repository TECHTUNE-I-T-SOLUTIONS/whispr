import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// GET - Fetch all posts (both chronicles posts and writing chain posts) for a specific creator
export async function GET(
  request: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  try {
    const { creatorId } = await Promise.resolve(params);
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status"); // Optional filter: draft, published, archived, scheduled
    const type = searchParams.get("type"); // Optional filter: all, chronicles, chains

    let chroniclesQuery = supabase
      .from("chronicles_posts")
      .select(
        `
        id,
        title,
        slug,
        excerpt,
        cover_image_url,
        post_type,
        category,
        status,
        likes_count,
        comments_count,
        shares_count,
        views_count,
        published_at,
        created_at,
        updated_at
      `
      )
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    // Optional status filter
    if (status && ["draft", "published", "archived", "scheduled"].includes(status)) {
      chroniclesQuery = chroniclesQuery.eq("status", status);
    }

    const { data: chroniclesData, error: chroniclesError } = await chroniclesQuery;
    if (chroniclesError) {
      console.error("Chronicles posts error:", chroniclesError);
    }

    // Debug logging
    console.log("Chronicles data:", {
      count: chroniclesData?.length || 0,
      error: chroniclesError,
      data: chroniclesData,
    });

    // Fetch chain entry posts if requested
    let chainData: any[] = [];
    if (!type || type === "all" || type === "chains") {
      let chainQuery = supabase
        .from("chronicles_chain_entry_posts")
        .select(
          `
          id,
          chain_id,
          title,
          excerpt,
          cover_image_url,
          category,
          status,
          likes_count,
          comments_count,
          shares_count,
          views_count,
          published_at,
          created_at,
          updated_at,
          chronicles_writing_chains(id, title)
        `
        )
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false });

      if (status && ["draft", "published", "archived"].includes(status)) {
        chainQuery = chainQuery.eq("status", status);
      }

      const { data: chainPostsData, error: chainError } = await chainQuery;
      if (chainError) {
        console.error("Chain posts error:", chainError);
      }

      console.log("Chain data:", {
        count: chainPostsData?.length || 0,
        error: chainError,
      });

      // Transform chain data to match chronicles format
      if (chainPostsData && Array.isArray(chainPostsData)) {
        chainData = (chainPostsData as any[]).map((post) => ({
          ...post,
          post_type: "chain_entry",
          chain_info: post.chronicles_writing_chains,
        }));
      }
    }

    // Merge and sort by created_at descending
    const chroniclesArray = Array.isArray(chroniclesData) ? chroniclesData : [];
    const chroniclesPosts = chroniclesArray.map((p) => ({
      ...p,
      post_type: p.post_type || "poem",
    }));

    const allPosts = [...chroniclesPosts, ...(chainData || [])].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log("Final posts:", {
      chroniclesCount: chroniclesPosts.length,
      chainCount: chainData.length,
      totalCount: allPosts.length,
    });

    // Apply limit/offset to combined results
    const paginatedPosts = allPosts.slice(offset, offset + limit);

    return NextResponse.json({
      posts: paginatedPosts,
      total: allPosts.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Creator posts fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator posts", details: String(error) },
      { status: 500 }
    );
  }
}
