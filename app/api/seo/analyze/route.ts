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
        maxOutputTokens: 8192,
      },
    });

    const text = textResponse.text || '';

    let analysisData;
    try {
      analysisData = JSON.parse(text.trim());
    } catch (parseError) {
      // Extract JSON from potential markdown wrapping
      let cleanedText = text;
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        cleanedText = codeBlockMatch[1];
      }

      // Use brace-counting to find the first complete JSON object
      const start = cleanedText.indexOf('{');
      if (start === -1) {
        console.error('JSON Parse Error: No JSON object found in response:', text);
        return NextResponse.json({ error: 'Failed to parse AI response: invalid format' }, { status: 500 });
      }

      let depth = 0;
      let end = -1;
      let inString = false;
      let escaped = false;

      for (let i = start; i < cleanedText.length; i++) {
        const ch = cleanedText[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === '\\' && inString) {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }

      if (end === -1) {
        console.error('JSON Parse Error: Unbalanced braces in response:', text);
        return NextResponse.json({ error: 'Failed to parse AI response: invalid format' }, { status: 500 });
      }

      let jsonText = cleanedText.slice(start, end + 1);

      // Progressive trim-from-end to handle truncated/broken JSON strings
      let parsed = false;

      try {
        analysisData = JSON.parse(jsonText);
        parsed = true;
      } catch {
        // Fix trailing commas and retry
        let candidate = jsonText.replace(/,(\s*[}\]])/g, '$1');
        try {
          analysisData = JSON.parse(candidate);
          parsed = true;
        } catch {
          // Progressively trim from the end to recover from truncated strings
          let maxTrims = 500;
          while (maxTrims-- > 0) {
            try {
              analysisData = JSON.parse(candidate);
              parsed = true;
              break;
            } catch {
              if (candidate.length <= 1) break;
              candidate = candidate.slice(0, -1).trim();
              // If we've closed back to a balanced object/array, stop trimming
              if (candidate.endsWith('}') || candidate.endsWith(']')) break;
            }
          }
        }
      }

      if (!parsed) {
        console.error('JSON Parse Error. Raw response:', text);
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    return NextResponse.json(analysisData);
  } catch (error: any) {
    console.error('SEO Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
