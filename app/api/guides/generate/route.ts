import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.1-flash-lite-preview';

function safeJson(text: string) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.slice(7);
    const anon = authClient(token);
    const { data: userData } = await anon.auth.getUser();
    if (!userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { topic, audience = 'all' } = await req.json();
    if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 });

    const svc = serviceClient();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `Create a practical, welcoming writing guide for the topic "${topic}".
Audience: ${audience}
Return STRICT JSON only with:
{
  "title": "string",
  "summary": "string",
  "difficulty": "beginner|intermediate|advanced",
  "sections": [
    { "title": "string", "body": "string" }
  ]
}
Keep it concise but useful. Include 4 to 6 sections.`;
    const res = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { temperature: 0.6, maxOutputTokens: 1000 } });
    const parsed = safeJson((res.text || '').trim()) ?? {};
    const title = parsed.title || `${topic} Guide`;
    const summary = parsed.summary || `A guide about ${topic}.`;
    const sections = Array.isArray(parsed.sections) && parsed.sections.length > 0
      ? parsed.sections
      : [
          { title: 'Getting Started', body: `An introduction to ${topic}.` },
          { title: 'Core Ideas', body: `The main ideas you should know about ${topic}.` },
          { title: 'Practice', body: `Simple exercises to apply ${topic}.` },
          { title: 'Next Steps', body: `How to keep growing with ${topic}.` },
        ];

    const { data: creator } = await svc.from('chronicles_creators').select('id').eq('user_id', userData.user.id).maybeSingle();

    const { data: moduleRow } = await svc.from('chronicles_learning_modules').insert({
      slug: `${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      title,
      summary,
      content_type: 'guide',
      audience,
      topic,
      difficulty: parsed.difficulty || 'beginner',
      is_ai_supported: true,
      is_published: true,
      created_by: creator?.id ?? null,
    }).select('*').single();

    if (moduleRow && sections.length) {
      await svc.from('chronicles_learning_sections').insert(
        sections.map((s: any, index: number) => ({
          module_id: moduleRow.id,
          title: s.title || `Section ${index + 1}`,
          body: s.body || '',
          order_index: index,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      module: moduleRow,
      sections,
      model: MODEL,
    });
  } catch (error) {
    console.error('Guide generate error:', error);
    return NextResponse.json({ error: 'Failed to generate guide' }, { status: 500 });
  }
}
