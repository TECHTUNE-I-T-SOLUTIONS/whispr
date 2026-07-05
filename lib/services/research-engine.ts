// Research Engine
// Collects information from external sources following docs/V2/ sections 18, 28

import { ResearchPackage, KnowledgeDocument } from '../types/ai.types';
import { knowledgeEngine } from '../knowledge/knowledge-engine';
import { cacheEngine } from '../cache/cache-engine';
import { googleNewsRSSAdapter } from '../providers/google-news-rss-adapter';
import { wikipediaAdapter } from '../providers/wikipedia-adapter';
import { githubAdapter } from '../providers/github-adapter';
import { youtubeAdapter } from '../providers/youtube-adapter';
import { llmEngine } from '../ai/llm-engine';

class ResearchEngine {
  async research(topic: string, options?: {
    sources?: string[];
    depth?: 'quick' | 'standard' | 'deep';
    userId?: string;
  }): Promise<ResearchPackage> {
    const sources = options?.sources || ['news', 'wikipedia', 'github'];
    const depth = options?.depth || 'standard';

    // Check cache first
    const cacheKey = cacheEngine.generateCacheKey('research', topic, depth, sources.join(','));
    const cached = await cacheEngine.get(cacheKey, 'research');
    if (cached) {
      return cached;
    }

    // Collect information from providers
    const knowledgeDocs: KnowledgeDocument[] = [];

    for (const source of sources) {
      try {
        const docs = await this.fetchFromSource(source, topic);
        knowledgeDocs.push(...docs);
      } catch (error) {
        console.error(`Failed to fetch from ${source}:`, error);
      }
    }

    // Normalize and deduplicate
    const normalizedDocs = await Promise.all(
      knowledgeDocs.map(doc => knowledgeEngine.normalize(doc.provider, doc))
    );
    const uniqueDocs = await knowledgeEngine.deduplicate(normalizedDocs);

    // Store in knowledge base
    for (const doc of uniqueDocs) {
      await knowledgeEngine.store(doc);
    }

    // Rank by credibility and trending
    const rankedDocs = uniqueDocs.sort((a, b) => {
      const scoreA = (a.credibilityScore || 0) * 0.7 + (a.trendingScore || 0) * 0.3;
      const scoreB = (b.credibilityScore || 0) * 0.7 + (b.trendingScore || 0) * 0.3;
      return scoreB - scoreA;
    });

    // Generate research package using AI
    const researchPackage = await this.generateResearchPackage(topic, rankedDocs, depth, options?.userId);

    // Cache the result
    await cacheEngine.set(cacheKey, researchPackage, 'research', 24 * 60 * 60); // 24 hours

    return researchPackage;
  }

  private async fetchFromSource(source: string, topic: string): Promise<any[]> {
    const docs: any[] = [];

    switch (source) {
      case 'news':
        const newsResults = await googleNewsRSSAdapter.search(topic);
        if (newsResults.items) {
          docs.push(...newsResults.items.map((item: any) => ({
            provider: 'google_news_rss',
            title: item.title,
            summary: item.content,
            sourceUrl: item.link,
            publishedAt: item.pubDate,
          })));
        }
        break;

      case 'wikipedia':
        const wikiResults = await wikipediaAdapter.search(topic);
        if (wikiResults.pages) {
          docs.push(...wikiResults.pages.map((page: any) => ({
            provider: 'wikipedia',
            title: page.title,
            summary: page.excerpt,
            description: page.description,
          })));
        }
        break;

      case 'github':
        const githubResults = await githubAdapter.search(topic);
        if (githubResults.items) {
          docs.push(...githubResults.items.map((repo: any) => ({
            provider: 'github',
            title: repo.name,
            summary: repo.description,
            sourceUrl: repo.url,
            stars: repo.stars,
            language: repo.language,
          })));
        }
        break;

      case 'youtube':
        const youtubeResults = await youtubeAdapter.search(topic);
        if (youtubeResults.items) {
          docs.push(...youtubeResults.items.map((video: any) => ({
            provider: 'youtube',
            title: video.title,
            summary: video.description,
            sourceUrl: video.url,
            channelTitle: video.channelTitle,
            publishedAt: video.publishedAt,
          })));
        }
        break;
    }

    return docs;
  }

  private async generateResearchPackage(
    topic: string,
    docs: KnowledgeDocument[],
    depth: string,
    userId?: string
  ): Promise<ResearchPackage> {
    const topDocs = docs.slice(0, depth === 'deep' ? 20 : depth === 'standard' ? 10 : 5);
    
    const context = topDocs.map(doc => 
      `Title: ${doc.title}\nSummary: ${doc.summary}\nSource: ${doc.sourceUrl}\nCredibility: ${doc.credibilityScore}`
    ).join('\n\n');

    const prompt = `Research the following topic: ${topic}

Here are the relevant sources:

${context}

Please provide:
1. A comprehensive summary
2. Key facts (bullet points)
3. Source references
4. Suggested titles for content
5. A suggested outline
6. Relevant keywords
7. Relevant tags
8. Suggested questions for further exploration
9. Related topics

Format your response as a structured JSON object with these fields.`;

    try {
      const response = await llmEngine.generate({
        prompt,
        feature: 'research',
        userId,
        temperature: 0.7,
        maxTokens: 4096,
      });

      // Parse the AI response
      let parsed;
      try {
        parsed = JSON.parse(response.content);
      } catch {
        // If JSON parsing fails, create a basic structure
        parsed = {
          summary: response.content,
          keyFacts: [],
          sources: topDocs.map(d => d.sourceUrl),
          suggestedTitles: [topic],
          suggestedOutline: [],
          suggestedKeywords: [],
          suggestedTags: [],
          suggestedQuestions: [],
          relatedTopics: [],
        };
      }

      return {
        summary: parsed.summary || response.content,
        keyFacts: parsed.keyFacts || [],
        sources: topDocs,
        references: topDocs.map(d => d.sourceUrl).filter((url): url is string => url !== undefined),
        suggestedTitles: parsed.suggestedTitles || [topic],
        suggestedOutline: parsed.suggestedOutline || [],
        suggestedKeywords: parsed.suggestedKeywords || [],
        suggestedTags: parsed.suggestedTags || [],
        suggestedQuestions: parsed.suggestedQuestions || [],
        relatedTopics: parsed.relatedTopics || [],
      };
    } catch (error) {
      console.error('Failed to generate research package:', error);
      
      // Fallback to basic package without AI
      return {
        summary: `Research on ${topic} based on ${topDocs.length} sources.`,
        keyFacts: topDocs.map(d => d.summary).filter((s): s is string => s !== undefined).slice(0, 5),
        sources: topDocs,
        references: topDocs.map(d => d.sourceUrl).filter((url): url is string => url !== undefined),
        suggestedTitles: [topic],
        suggestedOutline: [],
        suggestedKeywords: [],
        suggestedTags: [],
        suggestedQuestions: [],
        relatedTopics: [],
      };
    }
  }
}

export const researchEngine = new ResearchEngine();
