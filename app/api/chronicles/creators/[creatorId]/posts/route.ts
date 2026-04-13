import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET - Fetch all posts (both chronicles posts and writing chain posts) for a specific creator
export async function GET(
  request: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  try {
    const { creatorId } = await Promise.resolve(params);
    
    // Use service role key to bypass RLS (admin access)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status"); // Optional filter: draft, published, archived, scheduled
    const type = searchParams.get("type"); // Optional filter: all, chronicles, chains

    console.log("=== REQUEST PARAMS ===");
    console.log("Limit:", limit, "Offset:", offset);
    console.log("Query params - status:", status, "type:", type);

    // DEBUG: First check if creator exists and has ANY posts
    const { count: totalPostsByCreator, data: creatorCheck } = await supabase
      .from("chronicles_posts")
      .select("id, creator_id, title", { count: "exact" })
      .eq("creator_id", creatorId);

    console.log("=== DATABASE VERIFICATION ===");
    console.log("Total posts for creator_id", creatorId, ":", totalPostsByCreator);
    if (creatorCheck && creatorCheck.length > 0) {
      console.log("Sample posts in DB:", creatorCheck.slice(0, 3).map(p => ({
        id: p.id,
        creator_id: p.creator_id,
        title: p.title,
      })));
    }

    console.log("=== DEBUG: Fetching chronicles posts ===");
    console.log("Creator ID param:", creatorId);
    console.log("Creator ID type:", typeof creatorId);
    console.log("Status filter:", status);
    console.log("Type filter:", type);

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

    console.log("Query filtering by creator_id:", creatorId);
    
    // Optional status filter
    if (status && ["draft", "published", "archived", "scheduled"].includes(status)) {
      console.log("Applying status filter:", status);
      chroniclesQuery = chroniclesQuery.eq("status", status);
    }

    const { data: chroniclesData, error: chroniclesError, status: httpStatus } = await chroniclesQuery;
    
    if (chroniclesError) {
      console.error("❌ Chronicles posts error:", chroniclesError);
      console.error("Error code:", chroniclesError.code);
      console.error("Error message:", chroniclesError.message);
      console.error("Error details:", chroniclesError.details);
    }

    // Debug logging
    console.log("Chronicles data response:", {
      count: chroniclesData?.length || 0,
      error: chroniclesError?.message || chroniclesError,
      hasData: !!chroniclesData,
      dataType: typeof chroniclesData,
      httpStatus,
      data: chroniclesData,
    });

    if (chroniclesData && chroniclesData.length > 0) {
      console.log("✅ Got chronicles posts:", chroniclesData.map(p => ({
        id: p.id,
        title: p.title,
        creator_id: p.creator_id,
        status: p.status,
        post_type: p.post_type,
      })));
    } else {
      console.log("⚠️ No chronicles posts returned");
    }

    // Fetch chain entry posts if requested
    let chainData: any[] = [];
    if (!type || type === "all" || type === "chains") {
      console.log("=== DEBUG: Fetching chain entry posts ===");
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
        console.error("❌ Chain posts error:", chainError);
        console.error("Chain error code:", chainError.code);
        console.error("Chain error message:", chainError.message);
      }

      console.log("Chain data response:", {
        count: chainPostsData?.length || 0,
        error: chainError?.message || chainError,
        hasData: !!chainPostsData,
        dataType: typeof chainPostsData,
      });

      // Transform chain data to match chronicles format
      if (chainPostsData && Array.isArray(chainPostsData)) {
        chainData = (chainPostsData as any[]).map((post) => ({
          ...post,
          post_type: "chain_entry",
          chain_info: post.chronicles_writing_chains,
        }));
        console.log("✅ Transformed chain posts:", chainData.length);
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

    console.log("=== FINAL RESPONSE ===");
    console.log("Final posts:", {
      chroniclesCount: chroniclesPosts.length,
      chainCount: chainData.length,
      totalCount: allPosts.length,
    });
    
    if (allPosts.length > 0) {
      console.log("Sample posts:");
      allPosts.slice(0, 5).forEach(p => {
        console.log(`  - ${p.title} (${p.post_type}) - ${p.created_at}`);
      });
    }

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
