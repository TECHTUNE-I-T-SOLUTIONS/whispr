import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWritingPrompt, generateTags } from '@/lib/services/gemini.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt_type = 'blog', challenge_type = 'daily', custom_topic, save_to_db = false } = body;

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

    // Generate title from content
    const title = generateTitleFromContent(content, prompt_type);
    
    // Generate description
    const description = generateDescriptionFromContent(content, prompt_type);
    
    // Generate featured image URL (using Unsplash for now)
    const featured_image_url = generateFeaturedImageUrl(prompt_type);
    
    // Validate that the generated content is complete and sensible
    if (content.length < 50 || title.length < 15) {
      console.log('[Generate] AI content too short, using fallback');
      content = generateFallbackPrompt(prompt_type);
    }

    const promptData = {
      title,
      description,
      content,
      tags,
      featured_image_url,
      prompt_type,
      challenge_type,
      is_ai_generated: true,
      ai_generation_model: model,
    };

    // If save_to_db is true, save to database
    let savedPrompt = null;
    if (save_to_db) {
      const startsAt = new Date();
      startsAt.setHours(5, 0, 0, 0);
      
      const endsAt = new Date();
      endsAt.setHours(23, 59, 59, 999);
      
      const submissionDeadline = new Date();
      submissionDeadline.setHours(23, 59, 59, 999);

      const { data: newPrompt, error: insertError } = await supabase
        .from('chronicles_writing_prompts')
        .insert({
          title,
          description,
          prompt_type,
          content,
          challenge_type,
          is_ai_generated: true,
          ai_generation_model: model,
          created_by: '8ac41ab5-c544-4068-a628-426593a2d4e2',
          status: 'active',
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          submission_deadline: submissionDeadline.toISOString(),
          max_entries_per_user: 1,
          evaluation_criteria: '{"passion": 20, "integrity": 30, "sincerity": 30, "engagement": 20}',
          tags,
          featured_image_url,
          prize_description: 'Recognition',
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving prompt:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to save prompt to database' },
          { status: 500 }
        );
      }

      // Save to prompt_versions table
      const version = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
      await supabase
        .from('prompt_versions')
        .insert({
          prompt_name: title, // Use title instead of UUID since prompt_name is text
          version,
          content,
          is_active: true,
          metadata: {
            title,
            status: 'active',
            ai_generation_model: model,
            prompt_type,
            challenge_type,
          },
          created_by: '8ac41ab5-c544-4068-a628-426593a2d4e2',
        });

      savedPrompt = newPrompt;
    }

    return NextResponse.json({ 
      success: true,
      prompt: promptData,
      saved: savedPrompt,
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

function generateTitleFromContent(content: string, prompt_type: string): string {
  // Remove common prefixes completely
  let cleanContent = content
    .replace(/^(Write a|Create a|Write an|Generate a)\s+(blog post|poem|story)\s+(about|that|which)\s+/i, '')
    .replace(/^(Write a|Create a|Write an|Generate a)\s+/i, '')
    .replace(/^(The|A|An)\s+/i, '');
  
  // Take first 8-12 words as title
  const words = cleanContent.split(' ').filter(w => w.length > 0).slice(0, 10);
  let title = words.join(' ');
  
  // If title is too short or empty, use a fallback
  if (title.length < 10) {
    const fallbackTitles: Record<string, string[]> = {
      blog: ['Daily Blog Challenge', 'Writing Prompt Today', 'Blog Writing Task'],
      poem: ['Daily Poem Challenge', 'Poetry Writing Today', 'Poem Prompt'],
      story: ['Daily Story Challenge', 'Story Writing Today', 'Narrative Prompt']
    };
    title = fallbackTitles[prompt_type]?.[Math.floor(Math.random() * 3)] || 'Daily Writing Challenge';
  }
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Remove trailing period
  title = title.replace(/\.$/, '');
  
  // Limit to 50 characters max
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  // Add prompt type prefix
  const typePrefix = prompt_type === 'blog' ? 'Daily Blog' : 
                    prompt_type === 'poem' ? 'Daily Poem' : 'Daily Story';
  
  return `${typePrefix}: ${title}`;
}

function generateDescriptionFromContent(content: string, prompt_type: string): string {
  // Remove common prefixes from the content completely
  let cleanContent = content
    .replace(/^(Write a|Create a|Write an|Generate a)\s+(blog post|poem|story)\s+(about|that|which)\s+/i, '')
    .replace(/^(Write a|Create a|Write an|Generate a)\s+/i, '')
    .replace(/^(The|A|An)\s+/i, '');
  
  // Take first 20-30 words as excerpt
  const words = cleanContent.split(' ').filter(w => w.length > 0).slice(0, 25);
  
  // If not enough words, use a fallback description
  if (words.length < 5) {
    const fallbackDescriptions: Record<string, string> = {
      blog: 'A daily blog writing challenge to inspire creativity and self-expression',
      poem: 'A daily poetry writing challenge to explore emotions and imagery',
      story: 'A daily story writing challenge to develop narrative skills'
    };
    return fallbackDescriptions[prompt_type] || 'A daily writing challenge to inspire creativity';
  }
  
  let excerpt = words.join(' ');
  
  // Remove trailing period
  excerpt = excerpt.replace(/\.$/, '');
  
  const typeDescription = prompt_type === 'blog' ? 
    'A daily blog writing challenge' :
    prompt_type === 'poem' ?
    'A daily poetry writing challenge' :
    'A daily story writing challenge';
    
  return `${typeDescription} focused on ${excerpt.toLowerCase()}. Participants are encouraged to express their creativity and unique perspective on this theme.`;
}

function generateFeaturedImageUrl(prompt_type: string): string {
  // Generate relevant Unsplash image URLs based on prompt type
  const images: Record<string, string> = {
    blog: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1074&auto=format&fit=crop',
    poem: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1074&auto=format&fit=crop',
    story: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1074&auto=format&fit=crop',
  };
  
  return images[prompt_type] || images.blog;
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
