import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const { id } = await params;
    const body = await request.json();
    const { use_ai_check = true, rank_approved_only = true } = body;

    // Fetch all entries for this prompt
    const { data: entries, error: entriesError } = await supabase
      .from('chronicles_prompt_entries')
      .select('*')
      .eq('prompt_id', id);

    if (entriesError) throw entriesError;

    // Filter entries based on settings
    let entriesToRank = entries || [];
    if (rank_approved_only) {
      entriesToRank = entriesToRank.filter(e => e.status === 'approved');
    }

    // Fetch post data for each entry to get engagement metrics
    const entriesWithMetrics = await Promise.all(
      entriesToRank.map(async (entry) => {
        let postData = null;
        let engagementData = {
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          views_count: 0,
        };

        // Fetch creator data
        let creatorData = null;
        if (entry.creator_id) {
          const { data: creator } = await supabase
            .from('chronicles_creators')
            .select('id, pen_name, display_name, profile_image_url, avatar_url')
            .eq('id', entry.creator_id)
            .single();
          creatorData = creator;
        }

        if (entry.entry_type === 'chronicles_post' && entry.post_id) {
          const { data: post } = await supabase
            .from('chronicles_posts')
            .select('id, title, slug, excerpt, post_type, cover_image_url, likes_count, comments_count, shares_count, views_count')
            .eq('id', entry.post_id)
            .single();
          postData = post;
          if (post) {
            engagementData = {
              likes_count: post.likes_count || 0,
              comments_count: post.comments_count || 0,
              shares_count: post.shares_count || 0,
              views_count: post.views_count || 0,
            };
          }
        } else if (entry.entry_type === 'post' && entry.admin_post_id) {
          const { data: post } = await supabase
            .from('posts')
            .select('id, title, slug, excerpt, post_type, cover_image_url, likes_count, comments_count, shares_count, views_count')
            .eq('id', entry.admin_post_id)
            .single();
          postData = post;
          if (post) {
            engagementData = {
              likes_count: post.likes_count || 0,
              comments_count: post.comments_count || 0,
              shares_count: post.shares_count || 0,
              views_count: post.views_count || 0,
            };
          }
        }

        // Calculate score using weighted formula
        // Weights: likes (30%), comments (25%), shares (25%), views (20%)
        const score = 
          (engagementData.likes_count * 0.3) +
          (engagementData.comments_count * 0.25) +
          (engagementData.shares_count * 0.25) +
          (engagementData.views_count * 0.2);

        return {
          ...entry,
          creator: creatorData,
          post: postData,
          engagement: engagementData,
          calculated_score: Math.round(score * 100) / 100, // Round to 2 decimal places
        };
      })
    );

    // Sort by calculated score (descending)
    const rankedEntries = entriesWithMetrics
      .sort((a, b) => b.calculated_score - a.calculated_score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    // AI check for pending entries if enabled
    let aiCheckResults = [];
    if (use_ai_check) {
      const pendingEntries = (entries || []).filter(e => e.status === 'submitted');
      
      for (const entry of pendingEntries) {
        let postContent = '';
        if (entry.entry_type === 'chronicles_post' && entry.post_id) {
          const { data: post } = await supabase
            .from('chronicles_posts')
            .select('content')
            .eq('id', entry.post_id)
            .single();
          postContent = post?.content || '';
        }

        if (postContent) {
          // Simple AI-like check (in production, use actual AI API)
          const isLikelyAI = detectAIGeneratedContent(postContent);
          aiCheckResults.push({
            entry_id: entry.id,
            is_ai_generated: isLikelyAI,
            confidence: isLikelyAI ? 0.85 : 0.15,
            reason: isLikelyAI ? 'Pattern matches AI-generated content' : 'Content appears human-written',
          });
        }
      }
    }

    // Save evaluations to chronicles_prompt_evaluations for ranked entries
    for (const entry of rankedEntries) {
      // Calculate evaluation scores based on engagement metrics
      const maxLikes = Math.max(...rankedEntries.map(e => e.engagement?.likes_count || 0), 1);
      const maxComments = Math.max(...rankedEntries.map(e => e.engagement?.comments_count || 0), 1);
      const maxShares = Math.max(...rankedEntries.map(e => e.engagement?.shares_count || 0), 1);
      const maxViews = Math.max(...rankedEntries.map(e => e.engagement?.views_count || 0), 1);

      const engagementScore = Math.round(
        ((entry.engagement?.likes_count || 0) / maxLikes * 30 +
        (entry.engagement?.comments_count || 0) / maxComments * 25 +
        (entry.engagement?.shares_count || 0) / maxShares * 25 +
        (entry.engagement?.views_count || 0) / maxViews * 20)
      );

      const integrityScore = entry.is_ai_generated ? 30 : 95; // Lower if AI-generated
      const sincerityScore = Math.round(Math.random() * 20 + 80); // Placeholder - should use actual AI evaluation
      const passionScore = Math.round(Math.random() * 20 + 80); // Placeholder - should use actual AI evaluation
      const totalScore = Math.round((integrityScore + sincerityScore + passionScore + engagementScore) / 4);

      const recommendation = entry.rank <= 3 ? 
        (entry.rank === 1 ? 'winner' : entry.rank === 2 ? 'runner_up' : 'honorable_mention') : 
        'not_selected';

      // Check if evaluation already exists
      const { data: existingEval } = await supabase
        .from('chronicles_prompt_evaluations')
        .select('id')
        .eq('entry_id', entry.id)
        .single();

      if (existingEval) {
        // Update existing evaluation
        const { error: updateError } = await supabase
          .from('chronicles_prompt_evaluations')
          .update({
            evaluated_by: admin.id,
            integrity_score: integrityScore,
            sincerity_score: sincerityScore,
            passion_score: passionScore,
            engagement_score: engagementScore,
            total_score: totalScore,
            recommendation: recommendation,
            is_final: false,
            evaluated_at: new Date().toISOString(),
          })
          .eq('id', existingEval.id);

        if (updateError) {
          console.error('Error updating evaluation:', updateError);
        }
      } else {
        // Insert new evaluation
        const { error: insertError } = await supabase
          .from('chronicles_prompt_evaluations')
          .insert({
            entry_id: entry.id,
            evaluated_by: admin.id,
            integrity_score: integrityScore,
            sincerity_score: sincerityScore,
            passion_score: passionScore,
            engagement_score: engagementScore,
            total_score: totalScore,
            recommendation: recommendation,
            is_final: false,
            evaluated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error inserting evaluation:', insertError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      ranked_entries: rankedEntries,
      ai_check_results: aiCheckResults,
      total_entries: entries?.length || 0,
      ranked_count: rankedEntries.length,
    });
  } catch (error) {
    console.error('Error ranking entries:', error);
    return NextResponse.json(
      { error: 'Failed to rank entries' },
      { status: 500 }
    );
  }
}

// Simple AI detection heuristic (replace with actual AI API in production)
function detectAIGeneratedContent(content: string): boolean {
  const patterns = [
    /\bIn conclusion\b/i,
    /\bFurthermore\b/i,
    /\bMoreover\b/i,
    /\bIn summary\b/i,
    /\bIt is important to note\b/i,
    /\bThis demonstrates that\b/i,
  ];
  
  const matchCount = patterns.reduce((count, pattern) => {
    return count + (content.match(pattern)?.length || 0);
  }, 0);
  
  // If multiple AI-like patterns found, flag as likely AI
  return matchCount >= 3;
}