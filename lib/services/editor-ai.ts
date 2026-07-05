// Editor AI
// AI-powered editor features following docs/V2/

import { writingEngine } from './writing-engine';
import { researchEngine } from './research-engine';
import { featureFlagsService } from './feature-flags.service';

class EditorAI {
  async initializeEditor(content: string, userId?: string): Promise<{
    suggestions: {
      grammar: string[];
      tone: string;
      readability: number;
    };
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
    outline: string[];
  }> {
    const isEnabled = await featureFlagsService.isEnabled('ENABLE_EDITOR_AI', userId);
    if (!isEnabled) {
      throw new Error('Editor AI is not enabled');
    }

    const [grammar, seo, outline] = await Promise.all([
      writingEngine.improveGrammar(content.substring(0, 500), userId).catch(() => content),
      writingEngine.generateSEO(content, undefined, userId),
      writingEngine.generateOutline(content.substring(0, 200), 2, userId),
      writingEngine.analyzeTone(content, userId),
    ]);

    const readingTime = await writingEngine.estimateReadingTime(content);

    return {
      suggestions: {
        grammar: [grammar],
        tone: grammar,
        readability: readingTime,
      },
      seo,
      outline,
    };
  }

  async getSuggestions(
    content: string,
    type: 'grammar' | 'seo' | 'outline' | 'headline' | 'tags' | 'category',
    userId?: string
  ): Promise<any> {
    const isEnabled = await featureFlagsService.isEnabled('ENABLE_EDITOR_AI', userId);
    if (!isEnabled) {
      throw new Error('Editor AI is not enabled');
    }

    switch (type) {
      case 'grammar':
        return writingEngine.improveGrammar(content, userId);
      case 'seo':
        return writingEngine.generateSEO(content, undefined, userId);
      case 'outline':
        return writingEngine.generateOutline(content, 3, userId);
      case 'headline':
        return writingEngine.generateHeadline(content, userId);
      case 'tags':
        return writingEngine.suggestTags(content, [], userId);
      case 'category':
        return writingEngine.suggestCategory(content, [], userId);
      default:
        throw new Error(`Unknown suggestion type: ${type}`);
    }
  }

  async enhanceContent(
    content: string,
    enhancement: 'rewrite' | 'expand' | 'simplify' | 'translate',
    options?: {
      tone?: string;
      targetLength?: number;
      targetLanguage?: string;
      targetGrade?: number;
    },
    userId?: string
  ): Promise<string> {
    const isEnabled = await featureFlagsService.isEnabled('ENABLE_EDITOR_AI', userId);
    if (!isEnabled) {
      throw new Error('Editor AI is not enabled');
    }

    switch (enhancement) {
      case 'rewrite':
        return writingEngine.rewrite(content, options?.tone || 'professional', userId);
      case 'expand':
        return writingEngine.expand(content, options?.targetLength || 500, userId);
      case 'simplify':
        return writingEngine.simplify(content, options?.targetGrade || 8, userId);
      case 'translate':
        return writingEngine.translate(content, options?.targetLanguage || 'Spanish', userId);
      default:
        throw new Error(`Unknown enhancement type: ${enhancement}`);
    }
  }

  async researchForContent(topic: string, userId?: string): Promise<any> {
    const isEnabled = await featureFlagsService.isEnabled('ENABLE_RESEARCH_ENGINE', userId);
    if (!isEnabled) {
      throw new Error('Research Engine is not enabled');
    }

    return researchEngine.research(topic, { userId });
  }
}

export const editorAI = new EditorAI();
