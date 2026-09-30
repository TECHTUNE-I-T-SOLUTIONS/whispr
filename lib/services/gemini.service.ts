/**
 * Gemini AI Service with Model Fallback
 * Supports multiple Gemini models with automatic fallback on failure
 */

export interface GeminiResponse {
  text: string;
  model: string;
  success: boolean;
  error?: string;
}

// Model fallback chain in order of preference (start with more stable models)
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number];

export interface GeminiRequestOptions {
  model?: GeminiModel;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

/**
 * Generate text using Gemini API with automatic model fallback
 */
export async function generateGeminiText(
  prompt: string,
  options: GeminiRequestOptions = {}
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      text: '',
      model: 'none',
      success: false,
      error: 'GEMINI_API_KEY not configured'
    };
  }

  const {
    model: preferredModel,
    temperature = 0.7,
    maxTokens = 1000,
    systemInstruction = 'You are a creative writing assistant. Generate engaging and inspiring writing prompts.'
  } = options;

  // Determine which models to try
  const modelsToTry = preferredModel
    ? [preferredModel as GeminiModel, ...GEMINI_MODELS.filter(m => m !== preferredModel)]
    : GEMINI_MODELS;

  // Try each model in sequence until one succeeds
  for (const model of modelsToTry) {
    try {
      const response = await callGeminiAPI(model, prompt, apiKey, {
        temperature,
        maxTokens,
        systemInstruction
      });

      if (response.success) {
        return response;
      }

      // Log the failure and try next model
      console.warn(`Gemini model ${model} failed: ${response.error}, trying next model...`);
    } catch (error) {
      console.warn(`Gemini model ${model} threw error:`, error);
      // Continue to next model
    }
  }

  // All models failed
  return {
    text: '',
    model: 'none',
    success: false,
    error: 'All Gemini models failed to generate text'
  };
}

/**
 * Call a specific Gemini model
 */
async function callGeminiAPI(
  model: string,
  prompt: string,
  apiKey: string,
  options: {
    temperature: number;
    maxTokens: number;
    systemInstruction: string;
  }
): Promise<GeminiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      topK: 40,
      topP: 0.95,
    },
    systemInstruction: options.systemInstruction ? {
      parts: [
        {
          text: options.systemInstruction
        }
      ]
    } : undefined
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      text: '',
      model,
      success: false,
      error: `HTTP ${response.status}: ${errorText}`
    };
  }

  const data = await response.json();

  // Extract the generated text from the response
  if (data.candidates && data.candidates.length > 0) {
    const candidate = data.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      const generatedText = candidate.content.parts[0].text;
      return {
        text: generatedText,
        model,
        success: true
      };
    }
  }

  return {
    text: '',
    model,
    success: false,
    error: 'No content generated in response'
  };
}

/**
 * Generate a writing prompt specifically for challenges
 */
export async function generateWritingPrompt(
  type: 'blog' | 'poem' | 'story',
  topic?: string
): Promise<GeminiResponse> {
  const typeInstructions = {
    blog: `Generate a blog writing prompt. Start with "Write a blog post about..." or "Create a blog post that..."
    Return ONLY the prompt text, no explanations.`,
    poem: `Generate a poetry writing prompt. Start with "Write a poem about..." or "Create a poem that..."
    Return ONLY the prompt text, no explanations.`,
    story: `Generate a story writing prompt. Start with "Write a story about..." or "Create a narrative that..."
    Return ONLY the prompt text, no explanations.`
  };

  const topics = topic
    ? [topic]
    : [
        "the hidden beauty of everyday moments",
        "technology changing human connections",
        "a childhood memory that shaped who you are",
        "overcoming a personal fear or obstacle",
        "the changing seasons and what they teach us",
        "finding unexpected joy in ordinary days",
        "a lesson learned from failure",
        "the impact of a small act of kindness",
        "balancing ambition with contentment",
        "a perspective shift that changed everything",
        "the art of slow living in a fast world",
        "finding your voice in a noisy world",
        "the beauty of imperfection",
        "reconnecting with nature in urban life",
        "the power of vulnerability in relationships"
      ];

  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  const prompt = `Generate ONE ${type} writing prompt for the topic: "${randomTopic}". 
${typeInstructions[type]}
The prompt should be 1-2 sentences long and clearly instructive.
Return ONLY the prompt text, no additional commentary or explanations.`;

  return generateGeminiText(prompt, {
    temperature: 0.8,
    maxTokens: 200,
    systemInstruction: typeInstructions[type]
  });
}

/**
 * Generate relevant tags for a writing prompt
 */
export async function generateTags(content: string, promptType: string): Promise<string[]> {
  const prompt = `Generate 3-5 relevant tags for this writing prompt: "${content}"
    The prompt type is: ${promptType}
    
    Tags should be:
    - Single words or short phrases (max 2 words)
    - Relevant to the theme and style
    - Lowercase
    - Comma-separated
    
    Return ONLY the tags as a comma-separated list, no additional text or numbering.
    Example: "personal growth, relationships, change, reflection"`;

  try {
    const response = await generateGeminiText(prompt, {
      temperature: 0.5,
      maxTokens: 100,
      systemInstruction: 'You are a tag generator for writing prompts. Generate relevant, concise tags that help categorize and describe writing themes.'
    });

    // Parse the tags from the response
    const tags = response.text
      .split(',')
      .map((tag: string) => tag.trim().toLowerCase())
      .filter((tag: string) => tag.length > 0 && tag.length <= 20);

    return tags.slice(0, 5); // Return max 5 tags
  } catch (error) {
    console.error('Error generating tags:', error);
    // Return default tags based on prompt type
    const defaultTags: Record<string, string[]> = {
      blog: ['writing', 'personal', 'creativity'],
      poem: ['poetry', 'emotions', 'expression'],
      story: ['storytelling', 'narrative', 'fiction']
    };
    return defaultTags[promptType] || ['writing', 'creativity'];
  }
}

/**
 * Batch generate multiple prompts at once
 */
export async function generateWritingPromptsBatch(
  count: number,
  type: 'blog' | 'poem' | 'story'
): Promise<GeminiResponse[]> {
  const promises = Array.from({ length: count }, () => generateWritingPrompt(type));
  return Promise.all(promises);
}
