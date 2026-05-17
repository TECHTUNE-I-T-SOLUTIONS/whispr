import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.1-flash-lite-preview';

type GameRecord = {
  id: string;
  slug: string;
  title: string;
  game_type: string;
  description?: string | null;
  config?: Record<string, unknown> | null;
};

type GameCatalogSpec = {
  slug: string;
  gameType: 'poem_next_line' | 'blog_next_line' | 'guess_next_line';
  title: string;
  description: string;
  audience: string;
  difficulty: string;
  theme: string;
  starterPrompt: string;
  starterHint: string;
  starterExplanation: string;
  starterOptions: string[];
};

const GAME_CATALOG_BLUEPRINTS: GameCatalogSpec[] = [
  {
    slug: 'poem_next_line',
    gameType: 'poem_next_line',
    title: 'Poetry Continuation',
    description: 'Continue a poem with vivid imagery and emotional consistency.',
    audience: 'all',
    difficulty: 'beginner',
    theme: 'poetry and imagery',
    starterPrompt: 'A silver wind leans over the rooftops and the next line should feel lyrical.',
    starterHint: 'Think in image, rhythm and mood.',
    starterExplanation: 'Stay emotionally and imagistically consistent.',
    starterOptions: [
      'Keep the image alive with a soft movement.',
      'Switch to a completely unrelated topic.',
      'Repeat the previous line without expansion.',
    ],
  },
  {
    slug: 'blog_next_line',
    gameType: 'blog_next_line',
    title: 'Blog Builder',
    description: 'Build blog posts with clean structure, practical voice and forward movement.',
    audience: 'all',
    difficulty: 'beginner',
    theme: 'blog writing',
    starterPrompt: 'A smart blog intro explains why the topic matters before it teaches the reader.',
    starterHint: 'Be clear, practical and structured.',
    starterExplanation: 'Blog writing should add value and move the idea forward.',
    starterOptions: [
      'Add one concrete detail that sharpens the point.',
      'Jump to a new topic without context.',
      'End the article immediately.',
    ],
  },
  {
    slug: 'guess_next_line',
    gameType: 'guess_next_line',
    title: 'Guess the Next Line',
    description: 'Choose the strongest continuation from carefully designed options.',
    audience: 'all',
    difficulty: 'beginner',
    theme: 'multiple choice reasoning',
    starterPrompt: 'Which line best continues a calm and thoughtful opening?',
    starterHint: 'Choose the line that keeps the tone and logic aligned.',
    starterExplanation: 'The right answer keeps the same voice and motion.',
    starterOptions: [
      'It keeps the mood steady and the imagery coherent.',
      'It changes the subject too abruptly.',
      'It makes the opening feel unfinished.',
    ],
  },
  {
    slug: 'midnight-poem-flow',
    gameType: 'poem_next_line',
    title: 'Midnight Poem Flow',
    description: 'A darker poetic continuation game with moonlit imagery.',
    audience: 'all',
    difficulty: 'intermediate',
    theme: 'moonlit streets and quiet reflections',
    starterPrompt: 'The city sleeps under a violet moon and the next line should deepen the atmosphere.',
    starterHint: 'Lean into texture, silence and image.',
    starterExplanation: 'The line should extend the nocturnal mood instead of breaking it.',
    starterOptions: [
      'A lamp hums softly against the window glass.',
      'The poem suddenly becomes a technical manual.',
      'The voice leaves the scene entirely.',
    ],
  },
  {
    slug: 'garden-poem-walk',
    gameType: 'poem_next_line',
    title: 'Garden Poem Walk',
    description: 'A gentle, sensory poem continuation about growth and movement.',
    audience: 'all',
    difficulty: 'beginner',
    theme: 'gardens and growth',
    starterPrompt: 'A small garden opens after the rain and the next line should feel alive.',
    starterHint: 'Use movement and scent.',
    starterExplanation: 'The best line keeps the natural cadence flowing.',
    starterOptions: [
      'The basil leaves lift their faces to the light.',
      'The poem starts arguing with the reader.',
      'The scene is replaced by a city invoice.',
    ],
  },
  {
    slug: 'opinion-blog-builder',
    gameType: 'blog_next_line',
    title: 'Opinion Blog Builder',
    description: 'A sharper blog continuation game for opinion pieces and commentary.',
    audience: 'all',
    difficulty: 'intermediate',
    theme: 'opinion writing',
    starterPrompt: 'A strong opinion blog opens with a clear claim and the next line should support it.',
    starterHint: 'Be direct, but still useful.',
    starterExplanation: 'The next sentence should add evidence or nuance.',
    starterOptions: [
      'It gives a concrete reason the claim matters.',
      'It stops arguing and changes to unrelated gossip.',
      'It repeats the claim without adding anything.',
    ],
  },
  {
    slug: 'how-to-blog-builder',
    gameType: 'blog_next_line',
    title: 'How-To Blog Builder',
    description: 'A practical blog continuation for tutorials and step-by-step posts.',
    audience: 'all',
    difficulty: 'beginner',
    theme: 'tutorial writing',
    starterPrompt: 'The guide introduces a helpful task and the next line should explain the first step.',
    starterHint: 'Stay instructional and clear.',
    starterExplanation: 'A good tutorial line advances the steps logically.',
    starterOptions: [
      'It names the first action in plain language.',
      'It distracts the reader with a side story.',
      'It ends the tutorial before it starts.',
    ],
  },
  {
    slug: 'context-quiz-shift',
    gameType: 'guess_next_line',
    title: 'Context Quiz Shift',
    description: 'A quiz game focused on preserving context across lines.',
    audience: 'all',
    difficulty: 'intermediate',
    theme: 'context preservation',
    starterPrompt: 'Which line best preserves the meaning of the sentence?',
    starterHint: 'Choose the option that preserves flow and logic.',
    starterExplanation: 'The correct line respects both tone and context.',
    starterOptions: [
      'It continues the thought with a matching direction.',
      'It introduces an unrelated event without reason.',
      'It contradicts the opening premise.',
    ],
  },
  {
    slug: 'tone-match-quiz',
    gameType: 'guess_next_line',
    title: 'Tone Match Quiz',
    description: 'A quiz game that asks you to match tone and style.',
    audience: 'all',
    difficulty: 'beginner',
    theme: 'tone matching',
    starterPrompt: 'Which line best matches the soft reflective tone?',
    starterHint: 'Look for a line that feels emotionally aligned.',
    starterExplanation: 'Matching tone is more important than sounding clever.',
    starterOptions: [
      'It gently deepens the reflective mood.',
      'It sounds abrupt and overly technical.',
      'It breaks the emotional thread.',
    ],
  },
];

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

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: { model: string; contents: string; config: { temperature: number; maxOutputTokens: number } },
  retries = 2,
) {
  let attempt = 0;
  // Best-effort retry for transient UNAVAILABLE/503 model pressure.
  while (true) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const message = String(error?.message ?? '').toLowerCase();
      const isBusy = error?.status === 503 || message.includes('503') || message.includes('unavailable') || message.includes('high demand');
      if (!isBusy || attempt >= retries) {
        throw error;
      }
      attempt += 1;
      const delayMs = 350 * attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function creatorIdForUser(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from('chronicles_creators').select('id').eq('user_id', userId).maybeSingle();
  return data?.id ?? null;
}

async function resolveGameSource(
  svc: ReturnType<typeof serviceClient>,
  body: Record<string, unknown>,
): Promise<GameRecord> {
  const gameSlug = typeof body.game_slug === 'string' ? body.game_slug : typeof body.gameSlug === 'string' ? body.gameSlug : null;

  if (gameSlug) {
    const { data: game } = await svc.from('chronicles_games').select('id, slug, title, game_type, description, config').eq('slug', gameSlug).single();
    if (game) {
      return game as GameRecord;
    }
  }

  throw new Error('Game not found');
}

function buildCatalogPrompt(spec: GameCatalogSpec) {
  return `Create a catalog entry for a writing game.
Game type: ${spec.gameType}
Theme: ${spec.theme}
Audience: ${spec.audience}
Difficulty: ${spec.difficulty}
Return JSON with:
title: a polished human-friendly title,
description: a concise app-store style description,
config: object with topic, theme, starter_prompt, starter_hint, starter_explanation, starter_options.
Keep the starter options short and playable.`;
}

function fallbackCatalogRow(spec: GameCatalogSpec) {
  return {
    slug: spec.slug,
    title: spec.title,
    description: spec.description,
    game_type: spec.gameType,
    audience: spec.audience,
    difficulty: spec.difficulty,
    is_offline_ready: true,
    is_ai_powered: true,
    is_published: true,
    config: {
      topic: spec.theme,
      theme: spec.theme,
      starter_prompt: spec.starterPrompt,
      starter_hint: spec.starterHint,
      starter_explanation: spec.starterExplanation,
      starter_options: spec.starterOptions,
    },
  };
}

async function ensureGameCatalog(svc: ReturnType<typeof serviceClient>, creatorId: string | number | null) {
  const slugs = GAME_CATALOG_BLUEPRINTS.map((spec) => spec.slug);
  const { data: existing } = await svc.from('chronicles_games').select('slug').in('slug', slugs);
  const existingSlugs = new Set((existing ?? []).map((row: { slug: string }) => row.slug));
  const missing = GAME_CATALOG_BLUEPRINTS.filter((spec) => !existingSlugs.has(spec.slug));

  if (missing.length === 0) {
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  for (const spec of missing) {
    let row = fallbackCatalogRow(spec);

    try {
      const aiRes = await generateContentWithRetry(ai, {
        model: MODEL,
        contents: buildCatalogPrompt(spec),
        config: { temperature: 0.7, maxOutputTokens: 320 },
      });
      const parsed = safeJson((aiRes.text || '').trim());
      if (parsed?.title && parsed?.description && parsed?.config) {
        row = {
          ...row,
          title: parsed.title,
          description: parsed.description,
          config: parsed.config,
        };
      }
    } catch (error) {
      console.warn(`AI catalog generation failed for ${spec.slug}, using fallback`, error);
    }

    await svc.from('chronicles_games').upsert({
      ...row,
      created_by: creatorId ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'slug' });
  }
}

function stringifyConfigValue(value: unknown) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter(Boolean).map(String).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function buildModePrompt(gameType: string, title: string, config: Record<string, unknown>) {
  const theme = stringifyConfigValue(config.topic || config.theme || config.subject || '');
  const style = stringifyConfigValue(config.style || config.tone || config.voice || '');
  const starterPrompt = stringifyConfigValue(config.starter_prompt || config.prompt || '');
  const starterHint = stringifyConfigValue(config.starter_hint || config.hint || config.ai_hint || '');
  const contextLines = [
    theme ? `Theme: ${theme}.` : '',
    style ? `Style: ${style}.` : '',
    starterPrompt ? `Starter prompt: ${starterPrompt}.` : '',
    starterHint ? `Hint: ${starterHint}.` : '',
  ].filter(Boolean);

  if (gameType === 'blog_next_line') {
    return `Create a blog-writing game round for "${title}".
${contextLines.join('\n')}
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
${contextLines.join('\n')}
Return JSON with:
prompt: the line starter,
options: 4 options,
expected_answer: the correct option,
explanation: why it is correct,
ai_hint: a hint,
mode: "guess_next_line".`;
  }

  return `Create a poem-writing game round for "${title}".
${contextLines.join('\n')}
Return JSON with:
prompt: a title plus a short poetic opening,
options: 3 plausible next lines or [] for free text,
expected_answer: the best next line,
explanation: why it fits,
ai_hint: a small hint,
mode: "poem_next_line".`;
}

function buildFallbackRound(gameType: string, title: string, config: Record<string, unknown>) {
  const starterPrompt = stringifyConfigValue(config.starter_prompt || config.prompt || '');
  const starterOptions = Array.isArray(config.starter_options) ? config.starter_options.map(String) : [];
  const starterAnswer = stringifyConfigValue(config.starter_answer || config.expected_answer || '');
  const starterExplanation = stringifyConfigValue(config.starter_explanation || config.explanation || 'Keep the same voice, image and emotional direction.');
  const starterHint = stringifyConfigValue(config.starter_hint || config.ai_hint || 'Stay consistent with tone and imagery.');

  const prompt = starterPrompt || (gameType === 'blog_next_line'
    ? `${title}\n\nThe article begins with a bold claim, and the next line should deepen the idea.`
    : `${title}\n\nThe opening sets a calm, reflective tone, and the next line should continue that feeling.`);

  const options = starterOptions.length > 0
    ? starterOptions
    : gameType === 'guess_next_line'
      ? [
          'It turns the thought into a living image.',
          'It repeats the same idea without movement.',
          'It changes the topic abruptly.',
          'It ends the piece too early.',
        ]
      : [];

  return {
    prompt,
    options,
    expected_answer: starterAnswer,
    explanation: starterExplanation,
    ai_hint: starterHint,
    mode: gameType,
  };
}

function normalizeGameType(gameType: string) {
  if (['poem_next_line', 'blog_next_line', 'guess_next_line'].includes(gameType)) return gameType;
  return 'poem_next_line';
}

function scoreFromVerdict(correct: boolean, streak: number) {
  if (!correct) return 0;
  return 10 + Math.min(streak * 2, 10);
}

function buildContextualNextPrompt(round: any, answer: string, correct: boolean) {
  const basePrompt = String(round?.prompt || '').trim();
  const acceptedLine = correct ? answer : (String(round?.expected_answer || '').trim() || answer);

  if ((round?.prompt_type || '') === 'blog_next_line') {
    return `${basePrompt}\n\nLatest continuation: ${acceptedLine}\n\nWrite the next blog line so the paragraph keeps a clear, practical flow.`;
  }

  if ((round?.prompt_type || '') === 'guess_next_line') {
    return `${basePrompt}\n\nLatest selected continuation: ${acceptedLine}\n\nWhich next line best keeps the same meaning and tone?`;
  }

  return `${basePrompt}\n\nLatest continuation: ${acceptedLine}\n\nContinue the poem with the next vivid line.`;
}

function fallbackNextOptions(round: any) {
  if ((round?.prompt_type || '') === 'guess_next_line') {
    return [
      'It extends the idea while preserving tone and meaning.',
      'It shifts to an unrelated topic abruptly.',
      'It repeats the same thought without movement.',
      'It closes the piece too early.',
    ];
  }
  return [] as string[];
}

function isGenericContinuationPrompt(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.length < 40) return true;
  return normalized.includes('continue the poem')
    || normalized.includes('continue the blog')
    || normalized.includes('write the next line')
    || normalized.includes('continue with the next line');
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
    if (action === 'bootstrap_catalog') {
      const bootstrapCreatorId = body.creator_id || await creatorIdForUser(svc, userData.user.id) || null;
      await ensureGameCatalog(svc, bootstrapCreatorId);
      return NextResponse.json({ success: true });
    }

    const creatorId = body.creator_id || await creatorIdForUser(svc, userData.user.id);
    if (!creatorId) return NextResponse.json({ success: false, error: 'Creator not found' }, { status: 404 });

    if (action === 'start') {
      await ensureGameCatalog(svc, creatorId);
      const game = await resolveGameSource(svc, body);
      const config = game.config ?? {};

      const sessionMode = body.mode || 'practice';
      const { data: session, error: sessionError } = await svc.from('chronicles_game_sessions').insert({
        game_id: game.id,
        creator_id: creatorId,
        mode: sessionMode,
        status: 'active',
        metadata: {
          game_slug: game.slug,
          game_type: game.game_type,
          game_title: game.title,
        },
      }).select('*').single();
      if (sessionError || !session) return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const fallbackRound = buildFallbackRound(game.game_type, game.title, config);

      let roundData = fallbackRound;
      try {
        const aiRes = await generateContentWithRetry(ai, {
          model: MODEL,
          contents: buildModePrompt(normalizeGameType(game.game_type), game.title, config),
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
      await ensureGameCatalog(svc, creatorId);
      const game = await resolveGameSource(svc, body);

      let sessionQuery = svc
        .from('chronicles_game_sessions')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('game_id', game.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1);

      const { data: session } = await sessionQuery.maybeSingle();

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
    next_mode: string.
    Rules:
    - next_prompt must CONTINUE from the existing prompt and the user's continuation (or corrected continuation if the answer is weak).
    - next_prompt must include enough context so the user knows exactly what to continue.
    - do not output generic prompts like "continue the poem" without context.`;

      let verdict: any = null;
      try {
        const aiRes = await generateContentWithRetry(ai, {
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
      const aiNextPrompt = typeof verdict?.next_prompt === 'string' ? verdict.next_prompt : '';
      const nextPrompt = isGenericContinuationPrompt(aiNextPrompt)
        ? buildContextualNextPrompt(round, answer, correct)
        : aiNextPrompt;
      const nextOptions = Array.isArray(verdict?.next_options) && verdict.next_options.length > 0
        ? verdict.next_options
        : fallbackNextOptions(round);
      const nextRoundIndex = (round.order_index || 0) + 1;
      const shouldComplete = false;

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
        status: 'active',
        ended_at: null,
      }).eq('id', sessionId);

      let nextRound = null;
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
        completed_sessions: previousCompleted,
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
