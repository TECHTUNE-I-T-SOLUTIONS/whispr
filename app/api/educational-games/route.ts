import { NextRequest, NextResponse } from 'next/server';
import { EducationalGamesService } from '@/lib/educational-games';

/**
 * Educational Games API Route
 * Provides server-side endpoints for educational games as fallback
 * Primary access should be through client-side Supabase for better performance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const gameSlug = searchParams.get('gameSlug');
    const creatorId = searchParams.get('creatorId');

    if (action === 'list') {
      // Get all educational games
      const games = await EducationalGamesService.getGames();
      return NextResponse.json({ success: true, games });
    }

    if (action === 'game' && gameSlug) {
      // Get specific game
      const game = await EducationalGamesService.getGameBySlug(gameSlug);
      if (!game) {
        return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, game });
    }

    if (action === 'challenges' && gameSlug) {
      // Get challenges for a game
      const challenges = await EducationalGamesService.getGameChallenges(gameSlug);
      return NextResponse.json({ success: true, challenges });
    }

    if (action === 'progress' && creatorId && gameSlug) {
      // Get progress for a user on a game
      const game = await EducationalGamesService.getGameBySlug(gameSlug);
      if (!game) {
        return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
      }
      const progress = await EducationalGamesService.getProgress(creatorId, game.id);
      return NextResponse.json({ success: true, progress });
    }

    if (action === 'all-progress' && creatorId) {
      // Get all progress for a user
      const progress = await EducationalGamesService.getAllProgress(creatorId);
      return NextResponse.json({ success: true, progress });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Educational games GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'start-session') {
      const { gameSlug, creatorId } = body;
      if (!gameSlug || !creatorId) {
        return NextResponse.json({ success: false, error: 'gameSlug and creatorId required' }, { status: 400 });
      }
      const session = await EducationalGamesService.startSession(gameSlug, creatorId);
      return NextResponse.json({ success: true, session });
    }

    if (action === 'submit-answer') {
      const { sessionId, challengeId, answer, creatorId } = body;
      if (!sessionId || !challengeId || !answer || !creatorId) {
        return NextResponse.json({ success: false, error: 'sessionId, challengeId, answer, and creatorId required' }, { status: 400 });
      }
      const result = await EducationalGamesService.submitAnswer({
        sessionId,
        challengeId,
        answer,
        creatorId,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'complete-session') {
      const { sessionId, creatorId } = body;
      if (!sessionId || !creatorId) {
        return NextResponse.json({ success: false, error: 'sessionId and creatorId required' }, { status: 400 });
      }
      await EducationalGamesService.completeSession(sessionId, creatorId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Educational games POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
