// Learning Engine
// Helps creators improve following docs/V2/ section 34

import { llmEngine } from '../ai/llm-engine';
import { cacheEngine } from '../cache/cache-engine';
import { createSupabaseServer } from '../supabase-server';

class LearningEngine {
  async generateWritingGoals(userId: string, currentLevel: string = 'beginner'): Promise<{
    daily: string;
    weekly: string;
    monthly: string;
  }> {
    const cacheKey = cacheEngine.generateCacheKey('writing_goals', userId, currentLevel);
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Generate personalized writing goals for a ${currentLevel} writer.

Please provide:
1. A daily writing goal
2. A weekly writing goal
3. A monthly writing goal

Goals should be specific, measurable, and achievable.
Format as JSON with fields: daily, weekly, monthly`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'learning',
      userId,
      temperature: 0.7,
      maxTokens: 1024,
    });

    let goals;
    try {
      goals = JSON.parse(response.content);
    } catch {
      goals = {
        daily: 'Write for 30 minutes',
        weekly: 'Complete one article',
        monthly: 'Publish 4 articles',
      };
    }

    await cacheEngine.set(cacheKey, goals, 'ai', 7 * 24 * 60 * 60); // 7 days
    return goals;
  }

  async generateDailyChallenge(userId: string, interests: string[] = []): Promise<{
    title: string;
    description: string;
    type: 'writing' | 'editing' | 'research' | 'creative';
    points: number;
  }> {
    const cacheKey = cacheEngine.generateCacheKey('daily_challenge', userId, interests.join(','));
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const interestsStr = interests.length > 0 ? interests.join(', ') : 'general topics';
    const prompt = `Generate a daily writing challenge for a writer interested in: ${interestsStr}

The challenge should be:
- Engaging and creative
- Achievable in 30-60 minutes
- Help improve writing skills

Format as JSON with fields: title, description, type (writing/editing/research/creative), points (10-50)`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'learning',
      userId,
      temperature: 0.8,
      maxTokens: 1024,
    });

    let challenge;
    try {
      challenge = JSON.parse(response.content);
    } catch {
      challenge = {
        title: 'Flash Fiction',
        description: 'Write a complete story in exactly 100 words',
        type: 'creative' as const,
        points: 25,
      };
    }

    await cacheEngine.set(cacheKey, challenge, 'ai', 24 * 60 * 60); // 24 hours
    return challenge;
  }

  async analyzeProgress(userId: string): Promise<{
    streak: number;
    longestStreak: number;
    totalPosts: number;
    totalWords: number;
    skillLevel: string;
    achievements: string[];
    recommendations: string[];
  }> {
    try {
      const supabase = createSupabaseServer();

      // Get chronicles creator data
      const { data: creator } = await supabase
        .from('chronicles_creators')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get recent posts
      const { data: posts } = await supabase
        .from('chronicles_posts')
        .select('content, created_at')
        .eq('creator_id', creator?.id)
        .order('created_at', { ascending: false })
        .limit(30);

      // Calculate word count
      let totalWords = 0;
      if (posts) {
        for (const post of posts) {
          totalWords += post.content.split(/\s+/).length;
        }
      }

      // Determine skill level
      let skillLevel = 'beginner';
      if (creator?.total_posts > 50) skillLevel = 'advanced';
      else if (creator?.total_posts > 20) skillLevel = 'intermediate';

      // Generate recommendations
      const recommendations = await this.generateRecommendations(skillLevel, creator?.total_posts || 0);

      return {
        streak: creator?.streak_count || 0,
        longestStreak: creator?.longest_streak || 0,
        totalPosts: creator?.total_posts || 0,
        totalWords,
        skillLevel,
        achievements: creator?.badges || [],
        recommendations,
      };
    } catch (error) {
      console.error('Failed to analyze progress:', error);
      return {
        streak: 0,
        longestStreak: 0,
        totalPosts: 0,
        totalWords: 0,
        skillLevel: 'beginner',
        achievements: [],
        recommendations: [],
      };
    }
  }

  private async generateRecommendations(skillLevel: string, postCount: number): Promise<string[]> {
    const recommendations: string[] = [];

    if (skillLevel === 'beginner') {
      recommendations.push('Focus on consistency over quality at first');
      recommendations.push('Try writing every day, even if just for 15 minutes');
      recommendations.push('Read widely to improve your vocabulary');
    } else if (skillLevel === 'intermediate') {
      recommendations.push('Experiment with different writing styles');
      recommendations.push('Seek feedback from other writers');
      recommendations.push('Focus on editing and refining your work');
    } else {
      recommendations.push('Consider mentoring other writers');
      recommendations.push('Explore publishing opportunities');
      recommendations.push('Develop your unique voice and style');
    }

    if (postCount < 10) {
      recommendations.push('Build your portfolio with more published work');
    }

    return recommendations;
  }

  async provideFeedback(content: string, focus: string = 'general', userId?: string): Promise<{
    strengths: string[];
    improvements: string[];
    score: number;
    detailedFeedback: string;
  }> {
    const cacheKey = cacheEngine.generateCacheKey('feedback', content.substring(0, 100), focus);
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Provide constructive feedback on the following writing. Focus on: ${focus}

Content:
${content.substring(0, 3000)}

Please provide:
1. 3-5 strengths (what works well)
2. 3-5 areas for improvement
3. An overall score (1-10)
4. Detailed feedback paragraph

Format as JSON with fields: strengths (array), improvements (array), score (number), detailedFeedback (string)`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'learning',
      userId,
      temperature: 0.5,
      maxTokens: 2048,
    });

    let feedback;
    try {
      feedback = JSON.parse(response.content);
    } catch {
      feedback = {
        strengths: ['Clear structure'],
        improvements: ['Add more detail', 'Vary sentence length'],
        score: 7,
        detailedFeedback: response.content,
      };
    }

    await cacheEngine.set(cacheKey, feedback, 'ai', 7 * 24 * 60 * 60); // 7 days
    return feedback;
  }

  async generateLearningPath(goal: string, currentLevel: string = 'beginner', userId?: string): Promise<{
    title: string;
    description: string;
    modules: Array<{
      title: string;
      description: string;
      duration: string;
      skills: string[];
    }>;
    estimatedWeeks: number;
  }> {
    const cacheKey = cacheEngine.generateCacheKey('learning_path', goal, currentLevel);
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Create a learning path for a ${currentLevel} writer who wants to: ${goal}

Design a structured learning program with 4-6 modules.
Each module should have:
- Title
- Description
- Estimated duration
- Skills to be learned

Format as JSON with fields: title, description, modules (array), estimatedWeeks (number)`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'learning',
      userId,
      temperature: 0.7,
      maxTokens: 3072,
    });

    let path;
    try {
      path = JSON.parse(response.content);
    } catch {
      path = {
        title: `Learn ${goal}`,
        description: `A comprehensive learning path to achieve ${goal}`,
        modules: [
          {
            title: 'Fundamentals',
            description: 'Learn the basics',
            duration: '2 weeks',
            skills: ['Writing', 'Editing'],
          },
        ],
        estimatedWeeks: 8,
      };
    }

    await cacheEngine.set(cacheKey, path, 'ai', 30 * 24 * 60 * 60); // 30 days
    return path;
  }

  async trackStreak(userId: string): Promise<{
    current: number;
    longest: number;
    lastPostDate: Date | null;
    canContinue: boolean;
  }> {
    try {
      const supabase = createSupabaseServer();

      const { data: creator } = await supabase
        .from('chronicles_creators')
        .select('streak_count, longest_streak, last_post_date')
        .eq('user_id', userId)
        .single();

      const lastPostDate = creator?.last_post_date ? new Date(creator.last_post_date) : null;
      const now = new Date();
      
      // Check if streak can continue (posted within last 2 days)
      const canContinue = lastPostDate 
        ? (now.getTime() - lastPostDate.getTime()) < (2 * 24 * 60 * 60 * 1000)
        : true;

      return {
        current: creator?.streak_count || 0,
        longest: creator?.longest_streak || 0,
        lastPostDate,
        canContinue,
      };
    } catch (error) {
      console.error('Failed to track streak:', error);
      return {
        current: 0,
        longest: 0,
        lastPostDate: null,
        canContinue: true,
      };
    }
  }
}

export const learningEngine = new LearningEngine();
