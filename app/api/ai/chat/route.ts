import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

type SupabaseAny = SupabaseClient<any, 'public', any>;

type AiChatSessionInsert = {
  creator_id: string | null;
  chain_id: string | null;
  mode: string;
  output_type: string;
  status?: string;
  title?: string | null;
};

type AiChatMessageInsert = {
  session_id: string;
  sender: 'user' | 'assistant';
  content: string;
  message_type?: string;
  metadata?: object;
};

// NLP keyword extraction utility
function extractKeywordsFromPrompt(prompt: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'by', 'from',
    'as', 'if', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
    'can', 'could', 'should', 'would', 'do', 'does', 'did', 'will', 'shall',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our',
    'their', 'write', 'writing', 'create', 'creating', 'please', 'help',
    'about', 'get', 'make', 'use', 'just', 'need', 'want', 'like', 'think',
    'ask', 'tell', 'give', 'take', 'come', 'go', 'know', 'see', 'try', 'let',
  ]);

  const words = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Get unique keywords, prioritize earlier ones
  const keywords: string[] = [];
  const seen = new Set<string>();
  for (const word of words) {
    if (!seen.has(word) && keywords.length < 2) {
      keywords.push(word);
      seen.add(word);
    }
  }

  return keywords;
}

function generateLabel(keywords: string[], mode: string): string {
  if (keywords.length === 0) {
    return `${mode}_${Math.floor(Date.now() / 1000) % 1000000}`;
  }
  return keywords.join('_').toLowerCase();
}

function generateTitle(prompt: string): string {
  const firstSentence = prompt.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 60) {
    return `${firstSentence.substring(0, 57)}...`;
  }
  return firstSentence || 'Untitled Chat';
}

async function getSupabaseClientWithServiceRole(): Promise<SupabaseAny> {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Supabase service role key is not defined');
  }

  return createClient<any, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    }
  ) as SupabaseAny;
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = createClient<any, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  ) as SupabaseAny;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

async function insertAiChatSession(
  supabase: SupabaseAny,
  payload: AiChatSessionInsert
) {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function insertAiChatMessage(
  supabase: SupabaseAny,
  payload: AiChatMessageInsert
) {
  const { error } = await supabase.from('ai_chat_messages').insert(payload);

  if (error) {
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = body.prompt?.trim() || '';
    const mode = body.mode || 'chronicles';
    const outputType = body.outputType || 'draft';
    const chainId = body.chainId || null;
    const sessionId = body.sessionId || null;

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt cannot be empty' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ success: false, error: 'AI key not configured' }, { status: 500 });
    }

    const aiClient = new GoogleGenAI({ apiKey: geminiKey });

    // Resolve acting user (optional)
    const user = await getAuthUser(request);

    // Use service role for DB side effects.
    const adminSupabase = await getSupabaseClientWithServiceRole();

    let activeSessionId = sessionId;

    // Auto-generate title and label from prompt using NLP
    const keywords = extractKeywordsFromPrompt(prompt);
    const candidateTitle = generateTitle(prompt);
    const candidateLabel = generateLabel(keywords, mode);

    if (!activeSessionId) {
      // Look up creator_id from chronicles_creators using user_id
      let creatorId: string | null = null;
      if (user?.id) {
        const creatorQuery = await adminSupabase
          .from('chronicles_creators')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        creatorId = creatorQuery.data?.id || null;
      }

      const createdSession = await insertAiChatSession(adminSupabase, {
        creator_id: creatorId,
        chain_id: chainId,
        mode,
        output_type: outputType,
        status: 'active',
        title: candidateTitle,
      });
      activeSessionId = createdSession?.id;
    } else {
      // Ensure session has title (should already exist, but ensure consistency)
      await adminSupabase
        .from('ai_chat_sessions')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeSessionId);
    }

    // persist user message
    if (!activeSessionId) {
      return NextResponse.json({ success: false, error: 'Session creation failed' }, { status: 500 });
    }

    await insertAiChatMessage(adminSupabase, {
      session_id: activeSessionId,
      sender: 'user',
      content: prompt,
      message_type: 'text',
    });

    // AI generation
    const textResponse = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Mode: ${mode}\nAction: ${outputType}\n\n${prompt}`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 512,
      },
    });

    const generatedText = (textResponse.text || 'No text returned').replace(/\*\*|###|##|##?\s+/g, '').trim();

    // persist assistant message
    await insertAiChatMessage(adminSupabase, {
      session_id: activeSessionId,
      sender: 'assistant',
      content: generatedText,
      message_type: 'text',
    });

    // Optionally persist as post/chain entry
    let storedPostId: string | null = null;

    try {
      if (mode === 'writing_chains' && chainId) {
        // Auto create chain entry post
        const chainUserId = user?.id ?? null;
        const creatorQuery = await adminSupabase
          .from('chronicles_creators')
          .select('id')
          .eq('user_id', chainUserId)
          .maybeSingle();

        if (creatorQuery.data?.id) {
          const { data: entryPost, error: postError } = await adminSupabase
            .from('chronicles_chain_entry_posts')
            .insert({
              chain_id: chainId,
              creator_id: creatorQuery.data.id,
              title: `AI-generated Chain Entry`,
              content: generatedText,
              status: outputType === 'publish' ? 'published' : 'draft',
              sequence: 0,
              added_by: creatorQuery.data.id,
            })
            .select('id')
            .single();

          if (!postError && entryPost?.id) {
            storedPostId = entryPost.id;
            await adminSupabase.from('chronicles_chain_entries').insert({
              chain_id: chainId,
              chain_entry_post_id: entryPost.id,
              sequence: 1,
              added_by: creatorQuery.data.id,
            });
          }
        }
      } else {
        // Look up creator_id for chronicles post creation
        let postCreatorId: string | null = null;
        if (user?.id) {
          const postCreatorQuery = await adminSupabase
            .from('chronicles_creators')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          postCreatorId = postCreatorQuery.data?.id || null;
        }

        // Only create post if creator exists (optional feature)
        if (postCreatorId) {
          const { data: chroniclePost, error: postError } = await adminSupabase
            .from('chronicles_posts')
            .insert({
              creator_id: postCreatorId,
              title: `AI-generated Chronicle`,
              content: generatedText,
              status: outputType === 'publish' ? 'published' : 'draft',
              post_type: 'poem',
            })
            .select('id')
            .single();

          if (!postError && chroniclePost?.id) {
            storedPostId = chroniclePost.id;
          }
        }
      }
    } catch (e) {
      console.warn('Persisting generated post failed', e);
    }

    return NextResponse.json({
      success: true,
      sessionId: activeSessionId,
      generatedText,
      mode,
      outputType,
      targetPostId: storedPostId,
    });
  } catch (error) {
    console.error('AI chat error', error);
    return NextResponse.json({ success: false, error: 'Internal AI chat error' }, { status: 500 });
  }
}

