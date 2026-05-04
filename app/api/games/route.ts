import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.1-flash-lite-preview';

function authClient(token: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Missing Supabase service role key');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function creatorIdForUser(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from('chronicles_creators').select('id').eq('user_id', userId).maybeSingle();
  return data?.id ?? null;
}

function buildModePrompt(gameType: string, title: string) {
  if (gameType === 'blog_next_line') {
    return `Create a blog-writing game round for "${title}".
Return JSON with:
prompt: a title plus a short blog opener,
options: 3 plausible next lines for multiple choice or [] for free text,
expected_answer: the best next line,
explanation: why it fits,
ai_hint: a small hint,
mode: "blog_next_line".`;
  }
  if (gameType === 'guess_next_line') {
    return `Create a guess-the-next-line game for "${title}".
Return JSON with:
prompt: the line starter,
options: 4 options,
expected_answer: the correct option,
explanation: why it is correct,
ai_hint: a hint,
mode: "guess_next_line".`;
  }
  return `Create a poem-writing game round for "${title}".
Return JSON with:
prompt: a title plus a short poetic opening,
options: 3 plausible next lines or [] for free text,
expected_answer: the best next line,
explanation: why it fits,
ai_hint: a small hint,
mode: "poem_next_line".`;
}

function normalizeGameType(gameType: string) {
  if (['poem_next_line', 'blog_next_line', 'guess_next_line'].includes(gameType)) return gameType;
  return 'poem_next_line';
}

function scoreFromVerdict(correct: boolean, streak: number) {
  if (!correct) return 0;
  return 10 + Math.min(streak * 2, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'start';
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const anon = authClient(token);
    const { data: userData, error: userError } = await anon.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const svc = serviceClient();
    const creatorId = body.creator_id || await creatorIdForUser(svc, userData.user.id);
    if (!creatorId) return NextResponse.json({ success: false, error: 'Creator not found' }, { status: 404 });

    if (action === 'start') {
      const gameSlug = body.game_slug;
      if (!gameSlug) return NextResponse.json({ success: false, error: 'Game slug required' }, { status: 400 });

      const { data: game } = await svc.from('chronicles_games').select('*').eq('slug', gameSlug).single();
      if (!game) return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });

      const sessionMode = body.mode || 'practice';
      const { data: session, error: sessionError } = await svc.from('chronicles_game_sessions').insert({
        game_id: game.id,
        creator_id: creatorId,
        mode: sessionMode,
        status: 'active',
        metadata: { game_slug: gameSlug, game_type: game.game_type },
      }).select('*').single();
      if (sessionError || !session) return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const fallbackRound = {
        prompt: game.game_type === 'blog_next_line'
          ? `${game.title}\n\nThe article begins with a bold claim, and the next line should deepen the idea.`
          : `${game.title}\n\nThe night listens quietly, and the next line should continue the feeling.`,
        options: game.game_type === 'guess_next_line'
          ? [
              'It turns the thought into a living image.',
              'It repeats the same idea without movement.',
              'It changes the topic abruptly.',
              'It ends the piece too early.',
            ]
          : [],
        expected_answer: '',
        explanation: 'Keep the same voice, image and emotional direction.',
        ai_hint: 'Stay consistent with tone and imagery.',
        mode: game.game_type,
      };

      let roundData = fallbackRound;
      try {
        const aiRes = await ai.models.generateContent({
          model: MODEL,
          contents: buildModePrompt(normalizeGameType(game.game_type), game.title),
          config: { temperature: 0.8, maxOutputTokens: 350 },
        });
        const parsed = safeJson((aiRes.text || '').trim());
        if (parsed?.prompt) {
          roundData = {
            prompt: parsed.prompt,
            options: Array.isArray(parsed.options) ? parsed.options : [],
            expected_answer: parsed.expected_answer || '',
            explanation: parsed.explanation || '',
            ai_hint: parsed.ai_hint || '',
            mode: parsed.mode || game.game_type,
          };
        }
      } catch (e) {
        console.warn('AI prompt generation failed, using fallback round', e);
      }

      const { data: round } = await svc.from('chronicles_game_rounds').insert({
        session_id: session.id,
        prompt: roundData.prompt,
        prompt_type: roundData.mode,
        expected_answer: roundData.expected_answer,
        explanation: roundData.explanation,
        ai_hint: roundData.ai_hint,
        options: roundData.options,
        order_index: 0,
      }).select('*').single();

      return NextResponse.json({ success: true, session, round });
    }

    if (action === 'resume') {
      const gameSlug = body.game_slug;
      if (!gameSlug) return NextResponse.json({ success: false, error: 'Game slug required' }, { status: 400 });
      const { data: game } = await svc.from('chronicles_games').select('*').eq('slug', gameSlug).single();
      if (!game) return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });

      const { data: session } = await svc
        .from('chronicles_game_sessions')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('game_id', game.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) {
        return NextResponse.json({ success: true, resumed: false });
      }

      const { data: round } = await svc
        .from('chronicles_game_rounds')
        .select('*')
        .eq('session_id', session.id)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({ success: true, resumed: true, session, round });
    }

    if (action === 'evaluate') {
      const sessionId = body.session_id;
      const roundId = body.round_id;
      const answer = String(body.answer || '').trim();
      if (!sessionId || !roundId) return NextResponse.json({ success: false, error: 'Session and round required' }, { status: 400 });
      if (!answer) return NextResponse.json({ success: false, error: 'Answer required' }, { status: 400 });

      const { data: session } = await svc.from('chronicles_game_sessions').select('*').eq('id', sessionId).single();
      const { data: round } = await svc.from('chronicles_game_rounds').select('*').eq('id', roundId).single();
      if (!session || !round) return NextResponse.json({ success: false, error: 'Session or round not found' }, { status: 404 });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const evalPrompt = `Grade this writing game answer.
Game type: ${round.prompt_type}
Prompt: ${round.prompt}
Expected answer: ${round.expected_answer || 'N/A'}
User answer: ${answer}
Return JSON with:
correct: boolean,
feedback: string,
score: integer,
next_prompt: string,
next_options: array,
next_expected_answer: string,
next_mode: string.`;

      let verdict: any = null;
      try {
        const aiRes = await ai.models.generateContent({
          model: MODEL,
          contents: evalPrompt,
          config: { temperature: 0.2, maxOutputTokens: 250 },
        });
        verdict = safeJson((aiRes.text || '').trim());
      } catch (e) {
        console.warn('AI evaluation failed, using heuristic fallback', e);
      }

      const correct = verdict?.correct ?? (answer.length >= 12);
      const streak = correct ? (session.streak_count || 0) + 1 : 0;
      const scoreDelta = verdict?.score ?? scoreFromVerdict(correct, streak);
      const score = (session.score || 0) + scoreDelta;
      const nextPrompt = verdict?.next_prompt || (round.prompt_type === 'blog_next_line'
        ? 'Continue the blog with a practical, vivid next line.'
        : 'Continue the poem with a vivid, emotionally consistent next line.');
      const nextOptions = Array.isArray(verdict?.next_options) ? verdict.next_options : [];
      const nextRoundIndex = (round.order_index || 0) + 1;
      const shouldComplete = nextRoundIndex >= 5;

      await svc.from('chronicles_game_rounds').update({
        user_answer: answer,
        is_correct: correct,
        explanation: verdict?.feedback || round.explanation || '',
        ai_hint: round.ai_hint || '',
        points_awarded: scoreDelta,
      }).eq('id', roundId);

      await svc.from('chronicles_game_sessions').update({
        score,
        streak_count: streak,
        correct_answers: (session.correct_answers || 0) + (correct ? 1 : 0),
        incorrect_answers: (session.incorrect_answers || 0) + (correct ? 0 : 1),
        total_rounds: (session.total_rounds || 0) + 1,
        status: shouldComplete ? 'completed' : 'active',
        ended_at: shouldComplete ? new Date().toISOString() : null,
      }).eq('id', sessionId);

      let nextRound = null;
      if (!shouldComplete) {
        const { data } = await svc.from('chronicles_game_rounds').insert({
          session_id: sessionId,
          prompt: nextPrompt,
          prompt_type: verdict?.next_mode || round.prompt_type,
          expected_answer: verdict?.next_expected_answer || '',
          explanation: verdict?.feedback || '',
          ai_hint: verdict?.feedback ? 'Use the explanation to guide the next line.' : round.ai_hint || '',
          options: nextOptions,
          order_index: nextRoundIndex,
        }).select('*').single();
        nextRound = data;
      }

      const { data: progressRow } = await svc
        .from('chronicles_creator_game_progress')
        .select('best_score,total_score,best_streak,attempts_count,completed_sessions')
        .eq('creator_id', creatorId)
        .eq('game_id', session.game_id)
        .maybeSingle();

      const previousBestScore = progressRow?.best_score || 0;
      const previousTotalScore = progressRow?.total_score || 0;
      const previousBestStreak = progressRow?.best_streak || 0;
      const previousAttempts = progressRow?.attempts_count || 0;
      const previousCompleted = progressRow?.completed_sessions || 0;

      await svc.from('chronicles_creator_game_progress').upsert({
        creator_id: creatorId,
        game_id: session.game_id,
        best_score: Math.max(previousBestScore, score),
        total_score: previousTotalScore + scoreDelta,
        best_streak: Math.max(previousBestStreak, streak),
        attempts_count: previousAttempts + 1,
        completed_sessions: previousCompleted + (shouldComplete ? 1 : 0),
        last_played_at: new Date().toISOString(),
      }, { onConflict: 'creator_id,game_id' });

      return NextResponse.json({
        success: true,
        correct,
        feedback: verdict?.feedback || (correct ? 'Good job.' : 'Try again with a stronger continuation.'),
        score,
        streak,
        next_round: nextRound,
        completed: shouldComplete,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Games route error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
