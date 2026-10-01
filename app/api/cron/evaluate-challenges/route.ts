import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWritingPrompt, generateTags } from '@/lib/services/gemini.service';
import { sendDailyChallengeEmail, sendChallengeWinnerEmail, EmailType, sendEmailSync } from '@/lib/email-service';

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
        
        // Randomly choose between blog, poem, or story
        const promptTypes = ['blog', 'poem', 'story'];
        const prompt_type = promptTypes[Math.floor(Math.random() * promptTypes.length)] as 'blog' | 'poem' | 'story';
        const challenge_type = 'daily';
        let content: string;
        let model: string;

        const result = await generateWritingPrompt(prompt_type, undefined);

        if (!result.success) {
          console.error('Gemini generation failed:', result.error);
          content = generateFallbackPrompt(prompt_type);
          model = 'template-fallback';
        } else {
          content = result.text;
          model = result.model || 'gemini';
        }

        // Generate tags
        let tags: string[] = [];
        try {
          tags = await generateTags(content, prompt_type);
        } catch (error) {
          console.error('Tag generation failed:', error);
          tags = ['writing', 'personal', 'creativity'];
        }

        // Generate title
        const title = generateTitleFromContent(content, prompt_type);
        const description = generateDescriptionFromContent(content, prompt_type);
        const featured_image_url = generateFeaturedImageUrl(prompt_type);
        
        // Validate that the generated content is complete and sensible
        if (content.length < 50 || title.length < 15) {
          console.log('[Cron] AI content too short, using fallback');
          content = generateFallbackPrompt(prompt_type);
        }

        // Set dates
        const startsAt = new Date();
        startsAt.setHours(0, 1, 0, 0);
        
        const endsAt = new Date();
        endsAt.setHours(23, 59, 59, 999);
        
        const submissionDeadline = new Date();
        submissionDeadline.setHours(23, 59, 59, 999);

        // Save the challenge
        const { data: newChallenge, error: insertError } = await supabase
          .from('chronicles_writing_prompts')
          .insert({
            title,
            description,
            prompt_type,
            content,
            challenge_type: 'daily',
            is_ai_generated: true,
            ai_generation_model: model,
            created_by: '8ac41ab5-c544-4068-a628-426593a2d4e2',
            status: 'active',
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            submission_deadline: submissionDeadline.toISOString(),
            max_entries_per_user: 1,
            evaluation_criteria: '{"passion": 20, "integrity": 30, "sincerity": 30, "engagement": 20}',
            tags,
            featured_image_url,
            prize_description: 'Recognition',
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting generated challenge:', insertError);
          results.errors.push(`Failed to create daily challenge: ${insertError.message}`);
        } else {
          console.log('Daily challenge created successfully:', newChallenge.id);
          
          // Save to prompt_versions
          const version = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
          await supabase
            .from('prompt_versions')
            .insert({
              prompt_name: title, // Use title instead of UUID since prompt_name is text
              version,
              content,
              is_active: true,
              metadata: {
                title,
                status: 'active',
                ai_generation_model: model,
                prompt_type: 'blog',
                challenge_type: 'daily',
              },
              created_by: '8ac41ab5-c544-4068-a628-426593a2d4e2',
            });
          
          results.challenges_created++;
          
          // Send email notification to all active creators
          const { data: creators } = await supabase
            .from('chronicles_creators')
            .select('email, display_name, pen_name')
            .eq('status', 'active');
          
          console.log(`[Cron Email] Found ${creators?.length || 0} active creators to notify about new challenge`);
          
          if (creators && creators.length > 0) {
            for (const creator of creators) {
              if (creator.email) {
                console.log(`[Cron Email] Sending daily challenge email to ${creator.email}`);
                try {
                  const result = await sendEmailSync({
                    type: EmailType.DAILY_CHALLENGE,
                    to: creator.email,
                    data: {
                      recipientName: creator.display_name || creator.pen_name || 'Writer',
                      challengeTitle: title,
                      challengeDescription: description,
                      challengeType: 'Daily',
                      challengeUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/chronicles/writing-challenges`,
                      challengeDeadline: endsAt.toLocaleDateString(),
                    },
                  });
                  console.log(`[Cron Email] Email send result:`, result);
                } catch (error) {
                  console.error(`[Cron Email] Failed to send email to ${creator.email}:`, error);
                }
              } else {
                console.log(`[Cron Email] Creator ${creator.display_name || creator.pen_name} has no email`);
              }
            }
          } else {
            console.log('[Cron Email] No active creators found to notify');
          }
          
          // Send email notification to admins about new challenge
          const { data: admins } = await supabase
            .from('admin')
            .select('email, username, full_name')
            .eq('is_active', true);
          
          console.log(`[Cron Email] Found ${admins?.length || 0} active admins to notify about new challenge`);
          
          if (admins && admins.length > 0) {
            for (const admin of admins) {
              if (admin.email) {
                console.log(`[Cron Email] Sending admin notification to ${admin.email}`);
                try {
                  const result = await sendEmailSync({
                    type: EmailType.NOTIFICATION,
                    to: admin.email,
                    data: {
                      recipientName: admin.full_name || admin.username || 'Admin',
                      notificationTitle: 'New Daily Challenge Created',
                      notificationMessage: `A new daily writing challenge "${title}" has been automatically created and is now live on the platform. You can review and manage it from the admin dashboard.`,
                      actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/admin/chronicles/writing-challenges`,
                      actionText: 'View in Admin Dashboard',
                    },
                  });
                  console.log(`[Cron Email] Admin email send result:`, result);
                } catch (error) {
                  console.error(`[Cron Email] Failed to send admin email to ${admin.email}:`, error);
                }
              } else {
                console.log(`[Cron Email] Admin ${admin.full_name || admin.username} has no email`);
              }
            }
          } else {
            console.log('[Cron Email] No active admins found to notify');
          }
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

          // Send email notification to winner
          const { data: creator } = await supabase
            .from('chronicles_creators')
            .select('email, display_name, pen_name')
            .eq('id', entry.creator_id)
            .single();
          
          if (creator && creator.email) {
            console.log(`[Cron Email] Sending winner email to ${creator.email} for rank ${entry.rank}`);
            
            let postTitle = 'Your entry';
            let postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/chronicles/writing-challenges`;
            
            // Try to get post details
            if (entry.entry_type === 'chronicles_post' && entry.post_id) {
              const { data: post } = await supabase
                .from('chronicles_posts')
                .select('title, slug')
                .eq('id', entry.post_id)
                .maybeSingle();
              if (post) {
                postTitle = post.title;
                postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/chronicles/${post.slug}`;
              }
            }
            
            sendChallengeWinnerEmail(creator.email, {
              recipientName: creator.display_name || creator.pen_name || 'Winner',
              winnerRank: `${entry.rank}${entry.rank === 1 ? 'st' : entry.rank === 2 ? 'nd' : 'rd'}`,
              winnerPrize: challenge.prize_description || 'Recognition',
              winningPostTitle: postTitle,
              winningPostUrl: postUrl,
            });
          } else {
            console.log(`[Cron Email] Creator ${entry.creator_id} not found or has no email`);
          }

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

function generateTitleFromContent(content: string, prompt_type: string): string {
  // Remove common prefixes completely
  let cleanContent = content
    .replace(/^(Write a|Create a|Write an|Generate a)\s+(blog post|poem|story)\s+(about|that|which)\s+/i, '')
    .replace(/^(Write a|Create a|Write an|Generate a)\s+/i, '')
    .replace(/^(The|A|An)\s+/i, '');
  
  // Take first 15-20 words as title to capture the full prompt
  const words = cleanContent.split(' ').filter(w => w.length > 0).slice(0, 18);
  let title = words.join(' ');
  
  // If title is too short or empty, use a fallback
  if (title.length < 10) {
    const fallbackTitles: Record<string, string[]> = {
      blog: ['Daily Blog Challenge', 'Writing Prompt Today', 'Blog Writing Task'],
      poem: ['Daily Poem Challenge', 'Poetry Writing Today', 'Poem Prompt'],
      story: ['Daily Story Challenge', 'Story Writing Today', 'Narrative Prompt']
    };
    title = fallbackTitles[prompt_type]?.[Math.floor(Math.random() * 3)] || 'Daily Writing Challenge';
  }
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Remove trailing period
  title = title.replace(/\.$/, '');
  
  // Add prompt type prefix
  const typePrefix = prompt_type === 'blog' ? 'Daily Blog' : 
                    prompt_type === 'poem' ? 'Daily Poem' : 'Daily Story';
  
  return `${typePrefix}: ${title}`;
}

function generateDescriptionFromContent(content: string, prompt_type: string): string {
  // Remove common prefixes from the content completely
  let cleanContent = content
    .replace(/^(Write a|Create a|Write an|Generate a)\s+(blog post|poem|story)\s+(about|that|which)\s+/i, '')
    .replace(/^(Write a|Create a|Write an|Generate a)\s+/i, '')
    .replace(/^(The|A|An)\s+/i, '');
  
  // Take first 20-30 words as excerpt
  const words = cleanContent.split(' ').filter(w => w.length > 0).slice(0, 25);
  
  // If not enough words, use a fallback description
  if (words.length < 5) {
    const fallbackDescriptions: Record<string, string> = {
      blog: 'A daily blog writing challenge to inspire creativity and self-expression',
      poem: 'A daily poetry writing challenge to explore emotions and imagery',
      story: 'A daily story writing challenge to develop narrative skills'
    };
    return fallbackDescriptions[prompt_type] || 'A daily writing challenge to inspire creativity';
  }
  
  let excerpt = words.join(' ');
  
  // Remove trailing period
  excerpt = excerpt.replace(/\.$/, '');
  
  const typeDescription = prompt_type === 'blog' ? 
    'A daily blog writing challenge' :
    prompt_type === 'poem' ?
    'A daily poetry writing challenge' :
    'A daily story writing challenge';
    
  return `${typeDescription} focused on ${excerpt.toLowerCase()}. Participants are encouraged to express their creativity and unique perspective on this theme.`;
}

function generateFeaturedImageUrl(prompt_type: string): string {
  const images: Record<string, string> = {
    blog: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1074&auto=format&fit=crop',
    poem: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1074&auto=format&fit=crop',
    story: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1074&auto=format&fit=crop',
  };
  return images[prompt_type] || images.blog;
}

function generateFallbackPrompt(prompt_type: string): string {
  const templates: Record<string, string[]> = {
    blog: [
      "Write a blog post about the hidden beauty of everyday moments that explores its significance in modern life",
      "Create a blog post that teaches readers about finding unexpected joy in ordinary days through personal experience",
      "Write an opinion piece discussing how small acts of kindness impact our daily lives"
    ],
    poem: [
      "Write a poem about the changing seasons and what they teach us using vivid imagery and emotional depth",
      "Create a free verse poem that explores the feelings evoked by a childhood memory that shaped who you are",
      "Write a structured poem about balancing ambition with contentment that captures its essence"
    ],
    story: [
      "Write a short story that begins with the discovery of an unexpected joy and how it changes everything",
      "Create a narrative about a character experiencing technology changing human connections for the first time",
      "Write a story where overcoming a personal fear plays a central role in an unexpected way"
    ]
  };

  const typeTemplates = templates[prompt_type] || templates.blog;
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}