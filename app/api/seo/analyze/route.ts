import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(request: NextRequest) {
  try {
    const { title, content, excerpt, tags, type, genre } = await request.json();

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const aiClient = new GoogleGenAI({ apiKey: geminiKey });

    const prompt = `
      You are an expert SEO specialist and creative content strategist. 
      Analyze the following ${type || 'post'} and provide SEO suggestions.
      
      Content Details:
      - Title: ${title || 'N/A'}
      - Genre/Category: ${genre || 'N/A'}
      - Excerpt/Summary: ${excerpt || 'N/A'}
      - Content/Description: ${content || 'N/A'}
      - Current Tags/Hashtags: ${tags?.join(', ') || 'None'}
    `;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        score: { type: "INTEGER" },
        analysis: { type: "STRING" },
        suggestedTitles: { type: "ARRAY", items: { type: "STRING" } },
        suggestedHashtags: { type: "ARRAY", items: { type: "STRING" } },
        improvements: { type: "ARRAY", items: { type: "STRING" } },
        checks: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              label: { type: "STRING" },
              passed: { type: "BOOLEAN" },
              message: { type: "STRING" }
            },
            required: ["label", "passed", "message"]
          }
        }
      },
      required: ["score", "analysis", "suggestedTitles", "suggestedHashtags", "improvements", "checks"]
    };

    const textResponse = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const text = textResponse.text || '';
    
    let analysisData;
    try {
      analysisData = JSON.parse(text.trim());
    } catch (parseError) {
      console.error('JSON Parse Error:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json(analysisData);
  } catch (error: any) {
    console.error('SEO Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
