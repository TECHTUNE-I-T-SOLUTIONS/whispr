import { NextRequest, NextResponse } from 'next/server';
import { generateWritingPrompt, generateTags } from '@/lib/services/gemini.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt_type = 'blog', challenge_type = 'daily', custom_topic } = body;

    // Validate prompt type
    const validTypes = ['blog', 'poem', 'story'];
    if (!validTypes.includes(prompt_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid prompt type. Must be blog, poem, or story.' },
        { status: 400 }
      );
    }

    let content: string;
    let model: string;
    let warning: string | null = null;

    // Generate prompt using Gemini with fallback
    const result = await generateWritingPrompt(
      prompt_type as 'blog' | 'poem' | 'story',
      custom_topic
    );

    if (!result.success) {
      console.error('Gemini generation failed:', result.error);
      
      // Fallback to template-based generation if AI fails
      content = generateFallbackPrompt(prompt_type, custom_topic);
      model = 'template-fallback';
      warning = 'AI generation failed, using template fallback';
    } else {
      content = result.text;
      model = result.model || 'gemini';
    }

    // Generate tags based on the content
    let tags: string[] = [];
    try {
      tags = await generateTags(content, prompt_type);
    } catch (error) {
      console.error('Tag generation failed:', error);
      // Use default tags based on prompt type
      const defaultTags: Record<string, string[]> = {
        blog: ['writing', 'personal', 'creativity'],
        poem: ['poetry', 'emotions', 'expression'],
        story: ['storytelling', 'narrative', 'fiction']
      };
      tags = defaultTags[prompt_type] || ['writing', 'creativity'];
    }

    // Return the generated content and tags without saving to database
    return NextResponse.json({ 
      success: true,
      content,
      tags,
      model,
      warning
    });
  } catch (error) {
    console.error('Error generating AI prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate AI prompt' },
      { status: 500 }
    );
  }
}

/**
 * Fallback template-based generation when AI fails
 */
function generateFallbackPrompt(prompt_type: string, custom_topic?: string): string {
  const templates: Record<string, string[]> = {
    blog: [
      "Write a blog post about {topic} that explores its significance in modern life",
      "Create a blog post that teaches readers about {topic} through personal experience",
      "Write an opinion piece discussing how {topic} impacts our daily lives"
    ],
    poem: [
      "Write a poem about {topic} using vivid imagery and emotional depth",
      "Create a free verse poem that explores the feelings evoked by {topic}",
      "Write a structured poem about {topic} that captures its essence"
    ],
    story: [
      "Write a short story that begins with the discovery of {topic} and how it changes everything",
      "Create a narrative about a character experiencing {topic} for the first time",
      "Write a story where {topic} plays a central role in an unexpected way"
    ]
  };

  const topics = [
    "the hidden beauty of everyday moments",
    "technology changing human connections",
    "a childhood memory that shaped who you are",
    "overcoming a personal fear or obstacle",
    "the changing seasons and what they teach us",
    "finding unexpected joy in ordinary days",
    "a lesson learned from failure",
    "the impact of a small act of kindness",
    "balancing ambition with contentment",
    "a perspective shift that changed everything"
  ];

  const typeTemplates = templates[prompt_type] || templates.blog;
  const randomTemplate = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
  const randomTopic = custom_topic || topics[Math.floor(Math.random() * topics.length)];
  const topic = custom_topic || randomTopic;

  return randomTemplate.replace('{topic}', topic);
}
