import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client for educational games
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface GameChallenge {
  id: string
  game_id: string
  challenge_order: number
  question: string
  context?: string
  options: string[]
  correct_answer: string
  explanation: string
  teaching_point?: string
  difficulty: string
  is_active: boolean
}

export interface Game {
  id: string
  slug: string
  title: string
  description?: string
  game_type: string
  audience: string
  difficulty: string
  is_offline_ready: boolean
  is_ai_powered: boolean
  is_published: boolean
  config: Record<string, unknown>
  cover_image_url?: string
}

export interface GameSession {
  id: string
  game_id: string
  creator_id: string
  mode: string
  status: string
  score: number
  streak_count: number
  correct_answers: number
  incorrect_answers: number
  total_rounds: number
  started_at: string
  ended_at?: string
  metadata?: Record<string, unknown>
}

export interface GameRound {
  id: string
  session_id: string
  prompt: string
  prompt_type: string
  expected_answer?: string
  user_answer?: string
  is_correct?: boolean
  explanation?: string
  ai_hint?: string
  options: string[]
  points_awarded: number
  order_index: number
}

export interface GameProgress {
  creator_id: string
  game_id: string
  best_score: number
  total_score: number
  best_streak: number
  attempts_count: number
  completed_sessions: number
  last_played_at?: string
}

/**
 * Educational Games Service
 * Uses Supabase client-side access for better performance and reduced API dependency
 */
export class EducationalGamesService {
  /**
   * Get all published educational games
   */
  static async getGames(): Promise<Game[]> {
    const { data, error } = await supabase
      .from('chronicles_games')
      .select('*')
      .eq('is_published', true)
      .eq('is_ai_powered', false)
      .order('title')

    if (error) throw error
    return data as Game[]
  }

  /**
   * Get a specific game by slug
   */
  static async getGameBySlug(slug: string): Promise<Game | null> {
    const { data, error } = await supabase
      .from('chronicles_games')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Game
  }

  /**
   * Get challenges for a specific game
   */
  static async getGameChallenges(gameSlug: string): Promise<GameChallenge[]> {
    const game = await this.getGameBySlug(gameSlug)
    if (!game) throw new Error('Game not found')

    const { data, error } = await supabase
      .from('chronicles_game_challenges')
      .select('*')
      .eq('game_id', game.id)
      .eq('is_active', true)
      .order('challenge_order')

    if (error) throw error
    return data as GameChallenge[]
  }

  /**
   * Start a new game session
   */
  static async startSession(gameSlug: string, creatorId: string): Promise<GameSession> {
    const game = await this.getGameBySlug(gameSlug)
    if (!game) throw new Error('Game not found')

    const { data, error } = await supabase
      .from('chronicles_game_sessions')
      .insert({
        game_id: game.id,
        creator_id: creatorId,
        mode: 'practice',
        status: 'active',
        metadata: {
          game_slug: game.slug,
          game_type: game.game_type,
          game_title: game.title,
        },
      })
      .select('*')
      .single()

    if (error) throw error
    return data as GameSession
  }

  /**
   * Get an active session for a game
   */
  static async getActiveSession(gameSlug: string, creatorId: string): Promise<GameSession | null> {
    const game = await this.getGameBySlug(gameSlug)
    if (!game) throw new Error('Game not found')

    const { data, error } = await supabase
      .from('chronicles_game_sessions')
      .select('*')
      .eq('game_id', game.id)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as GameSession | null
  }

  /**
   * Submit an answer for a challenge (local evaluation for educational games)
   */
  static async submitAnswer(params: {
    sessionId: string
    challengeId: string
    answer: string
    creatorId: string
  }): Promise<{
    correct: boolean
    feedback: string
    score: number
  }> {
    // Get the challenge to evaluate locally
    const { data: challenge, error: challengeError } = await supabase
      .from('chronicles_game_challenges')
      .select('*')
      .eq('id', params.challengeId)
      .single()

    if (challengeError) throw challengeError

    const isCorrect = params.answer === challenge.correct_answer
    const feedback = isCorrect 
      ? challenge.explanation 
      : `Not quite. ${challenge.explanation}`

    // Update the round with user answer
    const { error: updateError } = await supabase
      .from('chronicles_game_rounds')
      .insert({
        session_id: params.sessionId,
        prompt: challenge.question,
        prompt_type: 'educational',
        expected_answer: challenge.correct_answer,
        user_answer: params.answer,
        is_correct: isCorrect,
        explanation: challenge.explanation,
        options: challenge.options,
        points_awarded: isCorrect ? 10 : 0,
        order_index: 0, // Will be updated by session management
      })

    if (updateError) throw updateError

    // Update session stats
    const { data: session, error: sessionError } = await supabase
      .from('chronicles_game_sessions')
      .select('*')
      .eq('id', params.sessionId)
      .single()

    if (sessionError) throw sessionError

    const newScore = (session.score || 0) + (isCorrect ? 10 : 0)
    const newStreak = isCorrect ? (session.streak_count || 0) + 1 : 0
    const newCorrectAnswers = (session.correct_answers || 0) + (isCorrect ? 1 : 0)
    const newIncorrectAnswers = (session.incorrect_answers || 0) + (isCorrect ? 0 : 1)
    const newTotalRounds = (session.total_rounds || 0) + 1

    await supabase
      .from('chronicles_game_sessions')
      .update({
        score: newScore,
        streak_count: newStreak,
        correct_answers: newCorrectAnswers,
        incorrect_answers: newIncorrectAnswers,
        total_rounds: newTotalRounds,
      })
      .eq('id', params.sessionId)

    // Update progress
    await this.updateProgress(params.creatorId, session.game_id, newScore, newStreak, isCorrect ? 1 : 0)

    return {
      correct: isCorrect,
      feedback,
      score: newScore,
    }
  }

  /**
   * Complete a game session
   */
  static async completeSession(sessionId: string, creatorId: string): Promise<void> {
    const { error } = await supabase
      .from('chronicles_game_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) throw error

    // Increment completed sessions in progress
    const { data: session } = await supabase
      .from('chronicles_game_sessions')
      .select('game_id')
      .eq('id', sessionId)
      .single()

    if (session) {
      await supabase
        .from('chronicles_creator_game_progress')
        .update({
          completed_sessions: (await this.getProgress(creatorId, session.game_id))?.completed_sessions || 0 + 1,
          last_played_at: new Date().toISOString(),
        })
        .eq('creator_id', creatorId)
        .eq('game_id', session.game_id)
    }
  }

  /**
   * Get user progress for a game
   */
  static async getProgress(creatorId: string, gameId: string): Promise<GameProgress | null> {
    const { data, error } = await supabase
      .from('chronicles_creator_game_progress')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('game_id', gameId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as GameProgress | null
  }

  /**
   * Update or create progress record
   */
  static async updateProgress(
    creatorId: string,
    gameId: string,
    score: number,
    streak: number,
    completedSessions: number
  ): Promise<void> {
    const existing = await this.getProgress(creatorId, gameId)

    if (existing) {
      await supabase
        .from('chronicles_creator_game_progress')
        .update({
          best_score: Math.max(existing.best_score, score),
          total_score: existing.total_score + score,
          best_streak: Math.max(existing.best_streak, streak),
          attempts_count: existing.attempts_count + 1,
          completed_sessions: existing.completed_sessions + completedSessions,
          last_played_at: new Date().toISOString(),
        })
        .eq('creator_id', creatorId)
        .eq('game_id', gameId)
    } else {
      await supabase
        .from('chronicles_creator_game_progress')
        .insert({
          creator_id,
          game_id,
          best_score: score,
          total_score: score,
          best_streak: streak,
          attempts_count: 1,
          completed_sessions,
          last_played_at: new Date().toISOString(),
        })
    }
  }

  /**
   * Get all progress for a user
   */
  static async getAllProgress(creatorId: string): Promise<GameProgress[]> {
    const { data, error } = await supabase
      .from('chronicles_creator_game_progress')
      .select('*')
      .eq('creator_id', creatorId)

    if (error) throw error
    return data as GameProgress[]
  }
}
