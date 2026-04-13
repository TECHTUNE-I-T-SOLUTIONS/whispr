// API Route: Flag Chronicles Post for Review
// File: app/api/admin/chronicles/flag-post/route.ts
// Purpose: Admin endpoint to flag posts for review and automatically change status to draft

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth-server';
import { createSupabaseServer } from '@/lib/supabase-server';

/**
 * POST /api/admin/chronicles/flag-post
 * 
 * Flags content for review (can be post, chain entry post, or writing chain)
 * Automatically changes content status to draft
 * Creates notifications for creator and admins
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      post_id, 
      chain_entry_post_id,
      chain_id,
      reason, 
      description 
    } = body;

    // Validate input - must have exactly one content ID
    const contentCount = [post_id, chain_entry_post_id, chain_id].filter(Boolean).length;
    if (contentCount === 0) {
      return NextResponse.json(
        { 
          error: 'Either post_id, chain_entry_post_id, or chain_id must be provided',
          success: false 
        },
        { status: 400 }
      );
    }

    if (contentCount > 1) {
      return NextResponse.json(
        { 
          error: 'Cannot flag multiple content types at the same time. Provide only one: post_id, chain_entry_post_id, or chain_id',
          success: false 
        },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { 
          error: 'reason is required',
          success: false 
        },
        { status: 400 }
      );
    }

    // Valid reasons
    const validReasons = [
      'inappropriate_content',
      'spam',
      'copyright_violation',
      'misinformation',
      'hate_speech',
      'explicit_content',
      'harassment',
      'other'
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { 
          error: `Invalid reason. Valid reasons: ${validReasons.join(', ')}`,
          success: false 
        },
        { status: 400 }
      );
    }

    // Get admin from cookies
    const session = await getAdminFromRequest(req);
    if (!session) {
      console.error('[FLAG POST] No admin session found in cookies');
      return NextResponse.json(
        { 
          error: 'Unauthorized: Admin session required',
          success: false 
        },
        { status: 401 }
      );
    }

    const admin = session.admin;
    const supabase = createSupabaseServer();

    const contentType = chain_id ? 'chain' : chain_entry_post_id ? 'chain_entry_post' : 'post';
    console.log(`[FLAG POST] Admin ${admin.username} (${admin.id}) flagging ${contentType}`);
    console.log(`[FLAG POST] post_id: ${post_id}, chain_entry_post_id: ${chain_entry_post_id}, chain_id: ${chain_id}, reason: ${reason}`);

    // Call the database function
    const { data: flagResult, error: flagError } = await supabase
      .rpc('flag_post_for_review', {
        p_admin_id: admin.id,
        p_reason: reason,
        p_post_id: post_id || null,
        p_chain_entry_post_id: chain_entry_post_id || null,
        p_chain_id: chain_id || null,
        p_description: description || null
      });

    if (flagError) {
      console.error('[FLAG POST] Error calling flag_post_for_review RPC:', flagError);
      throw flagError;
    }

    // Verify the result
    if (!flagResult || flagResult.length === 0) {
      throw new Error('No result returned from flag_post_for_review');
    }

    const result = flagResult[0];

    if (!result.success) {
      console.error('[FLAG POST] Function returned error:', result.message);
      return NextResponse.json(
        { 
          error: result.message,
          success: false 
        },
        { status: 400 }
      );
    }

    console.log(`[FLAG POST] Successfully flagged ${contentType}. Flag ID: ${result.flag_id}`);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: `${contentType === 'chain' ? 'Writing chain' : contentType === 'chain_entry_post' ? 'Chain entry post' : 'Post'} successfully flagged for review`,
        flag_id: result.flag_id,
        details: {
          content_type: contentType,
          post_id,
          chain_entry_post_id,
          chain_id,
          reason,
          flagged_by: admin.username,
          flagged_at: new Date().toISOString(),
          status_changed_to: 'draft'
        }
      },
      { status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[FLAG POST] Unexpected error:', error);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/chronicles/flag-post
 * 
 * Gets flagged posts summary for admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    // Get admin from cookies
    const session = await getAdminFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServer();

    // Try to get flagged posts from view first, fallback to direct table query
    let flaggedPosts: any[] = [];
    
    // First try the view
    const { data: viewData, error: viewError } = await supabase
      .from('v_flagged_posts_summary')
      .select('*')
      .order('flagged_at', { ascending: false })
      .limit(50);

    if (!viewError && viewData) {
      flaggedPosts = viewData;
    } else {
      // Fallback: query directly from chronicles_flagged_reviews table
      console.warn('[FLAG POST GET] View query failed, using direct table query:', viewError?.message);
      
      const { data: tableData, error: tableError } = await supabase
        .from('chronicles_flagged_reviews')
        .select('id, post_id, chain_entry_post_id, reason, description, status, created_at, flagged_by')
        .order('created_at', { ascending: false })
        .limit(50);

      if (tableError) {
        console.error('[FLAG POST GET] Table query error:', tableError);
        throw tableError;
      }

      flaggedPosts = tableData || [];
    }

    // Get stats
    const { data: stats, error: statsError } = await supabase
      .from('chronicles_flagged_reviews')
      .select('status');

    if (statsError) {
      console.warn('[FLAG POST GET] Stats query warning:', statsError);
    }

    const statusCounts = {
      pending: stats?.filter((s: any) => s.status === 'pending').length || 0,
      under_review: stats?.filter((s: any) => s.status === 'under_review').length || 0,
      resolved: stats?.filter((s: any) => s.status === 'resolved').length || 0,
      dismissed: stats?.filter((s: any) => s.status === 'dismissed').length || 0,
    };

    return NextResponse.json({
      success: true,
      flagged_posts: flaggedPosts || [],
      stats: statusCounts,
      total_flagged: flaggedPosts?.length || 0
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[FLAG POST GET] Unexpected error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        flagged_posts: [],
        stats: { pending: 0, under_review: 0, resolved: 0, dismissed: 0 }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/chronicles/flag-post
 * 
 * Update flag status (resolve/dismiss)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { flag_id, status, resolution } = body;

    if (!flag_id) {
      return NextResponse.json(
        { error: 'flag_id is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get admin from cookies
    const session = await getAdminFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = session.admin;
    const supabase = createSupabaseServer();

    // Update flag status
    const { data: updated, error: updateError } = await supabase
      .from('chronicles_flagged_reviews')
      .update({
        status,
        resolution: resolution || null,
        resolved_by: admin.id,
        resolved_at: status !== 'pending' && status !== 'under_review' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', flag_id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`[FLAG POST] Updated flag ${flag_id} to status: ${status}`);

    return NextResponse.json({
      success: true,
      message: `Flag status updated to ${status}`,
      data: updated
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[FLAG POST PUT] Error:', error);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
