// Writing Engine
// Powers every editor following docs/V2/ section 32

import { llmEngine } from '../ai/llm-engine';
import { cacheEngine } from '../cache/cache-engine';

class WritingEngine {
  async improveGrammar(text: string, userId?: string): Promise<string> {
    const cacheKey = cacheEngine.generateCacheKey('grammar', text.substring(0, 100));
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Please improve the grammar and clarity of the following text without changing the meaning:

${text}

Return only the improved text, no explanations.`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'grammar',
      userId,
      temperature: 0.3,
      maxTokens: 2048,
    });

    await cacheEngine.set(cacheKey, response.content, 'ai', 7 * 24 * 60 * 60); // 7 days
    return response.content;
  }

  async generateSEO(content: string, title?: string, userId?: string): Promise<{
    title: string;
    description: string;
    keywords: string[];
  }> {
    const cacheKey = cacheEngine.generateCacheKey('seo', title || content.substring(0, 50), content.substring(0, 50));
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Generate SEO metadata for the following content:

Title: ${title || 'Not provided'}
Content: ${content.substring(0, 2000)}

Please provide:
1. An optimized SEO title (under 60 characters)
2. A meta description (under 160 characters)
3. Relevant keywords (comma-separated)

Format as JSON with fields: title, description, keywords`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'seo',
      userId,
      temperature: 0.5,
      maxTokens: 1024,
    });

    let parsed;
    try {
      parsed = JSON.parse(response.content);
    } catch {
      parsed = {
        title: title || content.substring(0, 60),
        description: content.substring(0, 160),
        keywords: [],
      };
    }

    await cacheEngine.set(cacheKey, parsed, 'ai', 30 * 24 * 60 * 60); // 30 days
    return parsed;
  }

  async generateOutline(topic: string, depth: number = 3, userId?: string): Promise<string[]> {
    const cacheKey = cacheEngine.generateCacheKey('outline', topic, depth.toString());
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Generate a detailed outline for an article about: ${topic}

Create ${depth} levels of hierarchy. Format as a numbered list with indentation for sub-points.
Focus on logical flow and comprehensive coverage of the topic.`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'outline',
      userId,
      temperature: 0.7,
      maxTokens: 2048,
    });

    const outline = response.content.split('\n').filter(line => line.trim());
    await cacheEngine.set(cacheKey, outline, 'ai', 7 * 24 * 60 * 60); // 7 days
    return outline;
  }

  async generateHeadline(content: string, userId?: string): Promise<string[]> {
    const cacheKey = cacheEngine.generateCacheKey('headline', content.substring(0, 100));
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Generate 5 compelling headlines for the following content:

${content.substring(0, 1000)}

Headlines should be:
- Attention-grabbing
- Accurate to the content
- Under 70 characters each
- Varied in style (question, list, how-to, etc.)

Return as a numbered list.`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'headline',
      userId,
      temperature: 0.8,
      maxTokens: 1024,
    });

    const headlines = response.content.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim());

    await cacheEngine.set(cacheKey, headlines, 'ai', 7 * 24 * 60 * 60); // 7 days
    return headlines;
  }

  async suggestTags(content: string, existingTags: string[] = [], userId?: string): Promise<string[]> {
    const cacheKey = cacheEngine.generateCacheKey('tags', content.substring(0, 100), existingTags.join(','));
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Suggest relevant tags for the following content:

${content.substring(0, 1500)}

Existing tags: ${existingTags.join(', ')}

Suggest 5-10 additional relevant tags. Tags should be:
- Lowercase
- Single words or short phrases
- Relevant to the content
- Not duplicates of existing tags

Return as a comma-separated list.`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'tags',
      userId,
      temperature: 0.6,
      maxTokens: 512,
    });

    const tags = response.content
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag && !existingTags.includes(tag));

    await cacheEngine.set(cacheKey, tags, 'ai', 7 * 24 * 60 * 60); // 7 days
    return tags;
  }

  async suggestCategory(content: string, categories: string[] = [], userId?: string): Promise<string> {
    const cacheKey = cacheEngine.generateCacheKey('category', content.substring(0, 100));
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const categoryList = categories.length > 0 
      ? `Available categories: ${categories.join(', ')}`
      : 'Suggest an appropriate category from: Technology, Business, Science, Health, Education, Entertainment, Sports, Politics, Lifestyle, Arts';

    const prompt = `Categorize the following content:

${content.substring(0, 1000)}

${categoryList}

Return only the category name, nothing else.`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'category',
      userId,
      temperature: 0.3,
      maxTokens: 256,
    });

    const category = response.content.trim();
    await cacheEngine.set(cacheKey, category, 'ai', 30 * 24 * 60 * 60); // 30 days
    return category;
  }

  async estimateReadingTime(content: string): Promise<number> {
    // Deterministic approach - no AI needed
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Promise.resolve(Math.ceil(wordCount / wordsPerMinute));
  }

  async rewrite(text: string, tone: string = 'professional', userId?: string): Promise<string> {
    const cacheKey = cacheEngine.generateCacheKey('rewrite', text.substring(0, 50), tone);
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Rewrite the following text with a ${tone} tone:

${text}

Maintain the original meaning but improve clarity, flow, and engagement.
Return only the rewritten text, no explanations.`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'rewrite',
      userId,
      temperature: 0.7,
      maxTokens: 2048,
    });

    await cacheEngine.set(cacheKey, response.content, 'ai', 7 * 24 * 60 * 60); // 7 days
    return response.content;
  }

  async expand(text: string, targetLength: number = 500, userId?: string): Promise<string> {
    const prompt = `Expand the following text to approximately ${targetLength} words:

${text}

Add relevant details, examples, and context while maintaining the original message and tone.
Return only the expanded text, no explanations.`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'expand',
      userId,
      temperature: 0.7,
      maxTokens: 4096,
    });

    return response.content;
  }

  async simplify(text: string, targetGrade: number = 8, userId?: string): Promise<string> {
    const prompt = `Simplify the following text to a ${targetGrade}th grade reading level:

${text}

Maintain the key information and meaning but use simpler language and shorter sentences.
Return only the simplified text, no explanations.`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'simplify',
      userId,
      temperature: 0.5,
      maxTokens: 2048,
    });

    return response.content;
  }

  async translate(text: string, targetLanguage: string, userId?: string): Promise<string> {
    const cacheKey = cacheEngine.generateCacheKey('translate', text.substring(0, 50), targetLanguage);
    const cached = await cacheEngine.get(cacheKey, 'ai');
    if (cached) {
      return cached;
    }

    const prompt = `Translate the following text to ${targetLanguage}:

${text}

Maintain the original meaning and tone. Return only the translation, no explanations.`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'translation',
      userId,
      temperature: 0.3,
      maxTokens: 2048,
    });

    await cacheEngine.set(cacheKey, response.content, 'ai', 30 * 24 * 60 * 60); // 30 days
    return response.content;
  }

  async analyzeTone(text: string, userId?: string): Promise<{
    tone: string;
    confidence: number;
    suggestions: string[];
  }> {
    const prompt = `Analyze the tone of the following text:

${text}

Provide:
1. The primary tone (e.g., professional, casual, formal, friendly, authoritative)
2. Confidence level (0-1)
3. Suggestions for improvement if needed

Format as JSON with fields: tone, confidence, suggestions`;

    const response = await llmEngine.generate({
      prompt,
      feature: 'tone_analysis',
      userId,
      temperature: 0.3,
      maxTokens: 1024,
    });

    let parsed;
    try {
      parsed = JSON.parse(response.content);
    } catch {
      parsed = {
        tone: 'neutral',
        confidence: 0.5,
        suggestions: [],
      };
    }

    return parsed;
  }
}

export const writingEngine = new WritingEngine();
