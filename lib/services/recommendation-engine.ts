// Recommendation Engine
// Delivers personalized content following docs/V2/ sections 22, 31

import { createSupabaseServer } from '../supabase-server';
import { RecommendationScore, RecommendationProfile } from '../types/ai.types';

class RecommendationEngine {
  async getRecommendations(
    userId: string,
    options?: {
      contentType?: string;
      limit?: number;
      forceRefresh?: boolean;
    }
  ): Promise<string[]> {
    try {
      const supabase = createSupabaseServer();
      const limit = options?.limit || 20;

      // Check if we have fresh cached recommendations
      if (!options?.forceRefresh) {
        const cached = await this.getCachedRecommendations(userId, options?.contentType);
        if (cached && cached.length > 0) {
          return cached.slice(0, limit);
        }
      }

      // Build recommendation profile
      const profile = await this.buildProfile(userId);

      // Get content candidates
      const candidates = await this.getCandidates(userId, options?.contentType);

      // Score candidates
      const scored = await this.scoreCandidates(userId, candidates, profile);

      // Sort by score and return top N
      const topRecommendations = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache the results
      await this.cacheRecommendations(userId, topRecommendations, options?.contentType);

      return topRecommendations.map(r => r.contentId);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  async buildProfile(userId: string): Promise<RecommendationProfile> {
    try {
      const supabase = createSupabaseServer();

      // Get existing profile
      const { data: existing } = await supabase
        .from('recommendation_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        return {
          id: existing.id,
          userId: existing.user_id,
          profileData: existing.profile_data,
          lastUpdatedAt: existing.last_updated_at ? new Date(existing.last_updated_at) : undefined,
        };
      }

      // Build new profile from user activity
      const profileData = await this.buildProfileFromActivity(userId);

      // Save profile
      const { data: newProfile, error: insertError } = await supabase
        .from('recommendation_profiles')
        .insert({
          user_id: userId,
          profile_data: profileData,
        })
        .select('*')
        .single();

      if (insertError || !newProfile) {
        console.error('Failed to create profile:', insertError);
        // Return a temporary profile without saving
        return {
          userId,
          profileData,
          lastUpdatedAt: new Date(),
        };
      }

      return {
        id: newProfile.id,
        userId: newProfile.user_id,
        profileData: newProfile.profile_data,
        lastUpdatedAt: new Date(newProfile.last_updated_at),
      };
    } catch (error) {
      console.error('Failed to build profile:', error);
      return {
        userId,
        profileData: {},
      };
    }
  }

  private async buildProfileFromActivity(userId: string): Promise<Record<string, any>> {
    const supabase = createSupabaseServer();
    const profileData: Record<string, any> = {
      topics: {},
      categories: {},
      creators: {},
      tags: {},
    };

    try {
      // Get user's reading history
      const { data: searchHistory } = await supabase
        .from('user_search_history')
        .select('query')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (searchHistory) {
        for (const entry of searchHistory) {
          const query = entry.query.toLowerCase();
          profileData.topics[query] = (profileData.topics[query] || 0) + 1;
        }
      }

      // Get user's interests
      const { data: interests } = await supabase
        .from('user_interests')
        .select('interest, weight')
        .eq('user_id', userId);

      if (interests) {
        for (const interest of interests) {
          profileData.topics[interest.interest] = interest.weight;
        }
      }

      // Get user's followed topics
      const { data: topics } = await supabase
        .from('user_topics')
        .select('topic, follow_count')
        .eq('user_id', userId);

      if (topics) {
        for (const topic of topics) {
          profileData.topics[topic.topic] = topic.follow_count * 2;
        }
      }

    } catch (error) {
      console.error('Failed to build profile from activity:', error);
    }

    return profileData;
  }

  private async getCandidates(
    userId: string,
    contentType?: string
  ): Promise<Array<{ id: string; type: string; metadata: any }>> {
    const supabase = createSupabaseServer();
    const candidates: Array<{ id: string; type: string; metadata: any }> = [];

    try {
      // Get knowledge documents as candidates
      let query = supabase
        .from('knowledge_documents')
        .select('id, category, tags, keywords, trending_score, credibility_score')
        .gt('expires_at', new Date().toISOString())
        .limit(100);

      if (contentType) {
        query = query.eq('category', contentType);
      }

      const { data: knowledgeDocs } = await query;

      if (knowledgeDocs) {
        for (const doc of knowledgeDocs) {
          candidates.push({
            id: doc.id,
            type: 'knowledge',
            metadata: {
              category: doc.category,
              tags: doc.tags,
              keywords: doc.keywords,
              trendingScore: doc.trending_score,
              credibilityScore: doc.credibility_score,
            },
          });
        }
      }

      // Add posts from existing tables
      const { data: posts } = await supabase
        .from('posts')
        .select('id, type, tags, category')
        .eq('status', 'published')
        .limit(50);

      if (posts) {
        for (const post of posts) {
          candidates.push({
            id: post.id,
            type: post.type,
            metadata: {
              category: post.category,
              tags: post.tags,
            },
          });
        }
      }

    } catch (error) {
      console.error('Failed to get candidates:', error);
    }

    return candidates;
  }

  private async scoreCandidates(
    userId: string,
    candidates: Array<{ id: string; type: string; metadata: any }>,
    profile: RecommendationProfile
  ): Promise<RecommendationScore[]> {
    const scored: RecommendationScore[] = [];
    const profileData = profile.profileData;

    for (const candidate of candidates) {
      let score = 0;
      const reasons: string[] = [];

      // Topic matching
      if (candidate.metadata.tags) {
        for (const tag of candidate.metadata.tags) {
          if (profileData.topics[tag]) {
            score += profileData.topics[tag] * 0.3;
            reasons.push(`Topic match: ${tag}`);
          }
        }
      }

      // Category matching
      if (candidate.metadata.category && profileData.categories[candidate.metadata.category]) {
        score += profileData.categories[candidate.metadata.category] * 0.2;
        reasons.push(`Category match: ${candidate.metadata.category}`);
      }

      // Trending boost
      if (candidate.metadata.trendingScore) {
        score += candidate.metadata.trendingScore * 0.1;
        reasons.push('Trending content');
      }

      // Credibility boost
      if (candidate.metadata.credibilityScore) {
        score += candidate.metadata.credibilityScore * 0.1;
      }

      // Random exploration factor
      score += Math.random() * 0.1;

      scored.push({
        userId,
        contentId: candidate.id,
        contentType: candidate.type,
        score: Math.min(score, 100),
        reason: reasons.join(', '),
        calculatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    }

    return scored;
  }

  private async cacheRecommendations(
    userId: string,
    recommendations: RecommendationScore[],
    contentType?: string
  ): Promise<void> {
    try {
      const supabase = createSupabaseServer();

      // Clear old recommendations
      await supabase
        .from('recommendation_scores')
        .delete()
        .eq('user_id', userId)
        .lt('expires_at', new Date().toISOString());

      // Insert new recommendations
      for (const rec of recommendations) {
        await supabase.from('recommendation_scores').insert({
          user_id: userId,
          content_id: rec.contentId,
          content_type: rec.contentType,
          score: rec.score,
          reason: rec.reason,
          expires_at: rec.expiresAt?.toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to cache recommendations:', error);
    }
  }

  private async getCachedRecommendations(
    userId: string,
    contentType?: string
  ): Promise<string[]> {
    try {
      const supabase = createSupabaseServer();

      let query = supabase
        .from('recommendation_scores')
        .select('content_id')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('score', { ascending: false })
        .limit(20);

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data } = await query;

      return data?.map((r: any) => r.content_id) || [];
    } catch (error) {
      console.error('Failed to get cached recommendations:', error);
      return [];
    }
  }

  async recordInteraction(
    userId: string,
    contentId: string,
    interactionType: 'view' | 'like' | 'bookmark' | 'share'
  ): Promise<void> {
    try {
      const supabase = createSupabaseServer();

      // Update user profile based on interaction
      const weights = {
        view: 1,
        like: 3,
        bookmark: 5,
        share: 4,
      };

      const weight = weights[interactionType];

      // Get content metadata to extract topics/tags
      const { data: content } = await supabase
        .from('knowledge_documents')
        .select('tags, category, keywords')
        .eq('id', contentId)
        .single();

      if (content) {
        // Update profile with new interests
        const allTerms = [
          ...(content.tags || []),
          content.category,
          ...(content.keywords || []),
        ].filter(Boolean);

        for (const term of allTerms) {
          await supabase
            .from('user_interests')
            .upsert({
              user_id: userId,
              interest: term,
              weight,
              source: 'behavior',
            }, {
              onConflict: 'user_id,interest',
            });
        }
      }

      // Invalidate cached recommendations to force refresh
      await supabase
        .from('recommendation_scores')
        .delete()
        .eq('user_id', userId);

    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  }
}

export const recommendationEngine = new RecommendationEngine();
