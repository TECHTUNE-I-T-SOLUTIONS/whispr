import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      challenges_processed: 0,
      entries_evaluated: 0,
      winners_selected: 0,
      challenges_created: 0,
      errors: [] as string[],
    };

    // First, check if there's an active daily challenge for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: existingDailyChallenge } = await supabase
      .from('chronicles_writing_prompts')
      .select('*')
      .eq('challenge_type', 'daily')
      .eq('status', 'active')
      .gte('starts_at', todayStart.toISOString())
      .lte('starts_at', todayEnd.toISOString())
      .single();

    // If no daily challenge exists for today, create one using AI
    if (!existingDailyChallenge) {
      try {
        console.log('No daily challenge found for today, creating one...');
        
        // Call the AI generation API
        const generateRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/chronicles/writing-prompts/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt_type: 'blog',
            challenge_type: 'daily',
            save_to_db: true, // Save directly to database
          }),
        });

        if (generateRes.ok) {
          const generateData = await generateRes.json();
          
          if (generateData.saved) {
            console.log('Daily challenge created successfully:', generateData.saved.id);
            results.challenges_created++;
          } else {
            console.error('Failed to save generated challenge');
            results.errors.push('Failed to save generated challenge to database');
          }
        } else {
          console.error('Failed to generate challenge:', generateRes.status);
          results.errors.push('Failed to generate daily challenge');
        }
      } catch (error) {
        console.error('Error creating daily challenge:', error);
        results.errors.push(`Error creating daily challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Find challenges that ended yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: endedChallenges, error: challengesError } = await supabase
      .from('chronicles_writing_prompts')
      .select('*')
      .eq('status', 'active')
      .gte('ends_at', yesterday.toISOString())
      .lt('ends_at', today.toISOString());

    if (challengesError) {
      console.error('Error fetching ended challenges:', challengesError);
      return NextResponse.json(
        { error: 'Failed to fetch ended challenges' },
        { status: 500 }
      );
    }

    if (!endedChallenges || endedChallenges.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No challenges to evaluate',
        results,
      });
    }

    results.challenges_processed = endedChallenges.length;

    // Process each ended challenge
    for (const challenge of endedChallenges) {
      try {
        // Fetch all entries for this challenge
        const { data: entries, error: entriesError } = await supabase
          .from('chronicles_prompt_entries')
          .select('*')
          .eq('prompt_id', challenge.id);

        if (entriesError) {
          results.errors.push(`Challenge ${challenge.id}: Failed to fetch entries`);
          continue;
        }

        if (!entries || entries.length === 0) {
          continue;
        }

        results.entries_evaluated += entries.length;

        // Auto-evaluate pending entries (simple heuristic)
        for (const entry of entries) {
          if (entry.status === 'submitted') {
            // Auto-approve if not AI flagged
            if (!entry.is_ai_generated) {
              await supabase
                .from('chronicles_prompt_entries')
                .update({ status: 'approved', updated_at: new Date().toISOString() })
                .eq('id', entry.id);
            }
          }
        }

        // Fetch approved entries for ranking
        const { data: approvedEntries } = await supabase
          .from('chronicles_prompt_entries')
          .select('*')
          .eq('prompt_id', challenge.id)
          .eq('status', 'approved');

        if (!approvedEntries || approvedEntries.length === 0) {
          // No approved entries, mark challenge as ended
          await supabase
            .from('chronicles_writing_prompts')
            .update({ status: 'ended', updated_at: new Date().toISOString() })
            .eq('id', challenge.id);
          continue;
        }

        // Calculate engagement scores for each entry
        const entriesWithScores = await Promise.all(
          approvedEntries.map(async (entry) => {
            let engagementData = {
              likes_count: 0,
              comments_count: 0,
              shares_count: 0,
              views_count: 0,
            };

            if (entry.entry_type === 'chronicles_post' && entry.post_id) {
              const { data: post } = await supabase
                .from('chronicles_posts')
                .select('likes_count, comments_count, shares_count, views_count')
                .eq('id', entry.post_id)
                .single();
              if (post) {
                engagementData = {
                  likes_count: post.likes_count || 0,
                  comments_count: post.comments_count || 0,
                  shares_count: post.shares_count || 0,
                  views_count: post.views_count || 0,
                };
              }
            }

            const score = 
              (engagementData.likes_count * 0.3) +
              (engagementData.comments_count * 0.25) +
              (engagementData.shares_count * 0.25) +
              (engagementData.views_count * 0.2);

            return {
              ...entry,
              engagement: engagementData,
              calculated_score: Math.round(score * 100) / 100,
            };
          })
        );

        // Sort by score and assign ranks
        const rankedEntries = entriesWithScores
          .sort((a, b) => b.calculated_score - a.calculated_score)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        // Save top 3 as winners
        const top3 = rankedEntries.slice(0, 3);
        
        for (const entry of top3) {
          const recommendation = entry.rank === 1 ? 'winner' : 
            entry.rank === 2 ? 'runner_up' : 'honorable_mention';

          // Save to challenge winners
          await supabase
            .from('chronicles_challenge_winners')
            .insert({
              prompt_id: challenge.id,
              entry_id: entry.id,
              creator_id: entry.creator_id,
              rank: entry.rank,
              prize_awarded: challenge.prize_description || 'Recognition',
              announced_at: new Date().toISOString(),
            });

          // Update leaderboard winners
          const { data: existingWinner } = await supabase
            .from('chronicles_leaderboard_winners')
            .select('*')
            .eq('creator_id', entry.creator_id)
            .single();

          if (existingWinner) {
            await supabase
              .from('chronicles_leaderboard_winners')
              .update({
                total_wins: existingWinner.total_wins + 1,
                [entry.rank === 1 ? 'first_place_wins' : entry.rank === 2 ? 'second_place_wins' : 'third_place_wins']:
                  existingWinner[entry.rank === 1 ? 'first_place_wins' : entry.rank === 2 ? 'second_place_wins' : 'third_place_wins'] + 1,
                total_points_earned: existingWinner.total_points_earned + (4 - entry.rank) * 100,
                last_win_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('creator_id', entry.creator_id);
          } else {
            await supabase
              .from('chronicles_leaderboard_winners')
              .insert({
                creator_id: entry.creator_id,
                total_wins: 1,
                first_place_wins: entry.rank === 1 ? 1 : 0,
                second_place_wins: entry.rank === 2 ? 1 : 0,
                third_place_wins: entry.rank === 3 ? 1 : 0,
                total_points_earned: (4 - entry.rank) * 100,
                last_win_at: new Date().toISOString(),
                best_rank_achievement: `${entry.rank}${entry.rank === 1 ? 'st' : entry.rank === 2 ? 'nd' : 'rd'} Place`,
              });
          }

          // Send notification to winner
          await supabase
            .from('chronicles_notifications')
            .insert({
              creator_id: entry.creator_id,
              type: 'challenge_won',
              title: `You won ${entry.rank}${entry.rank === 1 ? 'st' : entry.rank === 2 ? 'nd' : 'rd'} place!`,
              message: `Congratulations! You've achieved ${entry.rank}${entry.rank === 1 ? 'st' : entry.rank === 2 ? 'nd' : 'rd'} place in the writing challenge "${challenge.title}".`,
              data: {
                prompt_id: challenge.id,
                entry_id: entry.id,
                rank: entry.rank,
                prize_awarded: challenge.prize_description || 'Recognition',
              },
            });

          results.winners_selected++;
        }

        // Mark challenge as ended
        await supabase
          .from('chronicles_writing_prompts')
          .update({ status: 'ended', updated_at: new Date().toISOString() })
          .eq('id', challenge.id);

      } catch (error) {
        console.error(`Error processing challenge ${challenge.id}:`, error);
        results.errors.push(`Challenge ${challenge.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Challenge evaluation completed',
      results: {
        ...results,
        message: `Processed ${results.challenges_processed} challenges, evaluated ${results.entries_evaluated} entries, selected ${results.winners_selected} winners, created ${results.challenges_created} new challenges`,
      },
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}