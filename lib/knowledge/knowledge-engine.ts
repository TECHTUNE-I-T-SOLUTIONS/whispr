// Knowledge Engine
// Transforms raw information into structured knowledge following docs/V2/ sections 16, 29

import { KnowledgeDocument } from '../types/ai.types';
import { createSupabaseServer } from '../supabase-server';

class KnowledgeEngine {
  async normalize(
    provider: string,
    rawData: any
  ): Promise<KnowledgeDocument> {
    const baseDoc: KnowledgeDocument = {
      provider,
      title: this.extractTitle(rawData),
      summary: this.extractSummary(rawData),
      content: this.extractContent(rawData),
      sourceUrl: this.extractSourceUrl(rawData),
      publishedAt: this.extractPublishedAt(rawData),
      category: this.extractCategory(rawData),
      tags: this.extractTags(rawData),
      keywords: this.extractKeywords(rawData),
      language: this.extractLanguage(rawData),
      country: this.extractCountry(rawData),
      credibilityScore: this.calculateCredibilityScore(provider, rawData),
      trendingScore: this.calculateTrendingScore(rawData),
      hash: this.generateHash(rawData),
    };

    return baseDoc;
  }

  async store(document: KnowledgeDocument): Promise<string | null> {
    try {
      const supabase = createSupabaseServer();

      // Check for duplicates using hash
      const { data: existing } = await supabase
        .from('knowledge_documents')
        .select('id')
        .eq('hash', document.hash)
        .single();

      if (existing) {
        return existing.id;
      }

      // Insert new document
      const { data, error } = await supabase
        .from('knowledge_documents')
        .insert({
          provider: document.provider,
          title: document.title,
          summary: document.summary,
          content: document.content,
          category: document.category,
          tags: document.tags || [],
          keywords: document.keywords || [],
          source_url: document.sourceUrl,
          published_at: document.publishedAt?.toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: document.expiresAt?.toISOString(),
          language: document.language,
          country: document.country,
          credibility_score: document.credibilityScore,
          trending_score: document.trendingScore,
          hash: document.hash,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to store knowledge document:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Knowledge store failed:', error);
      return null;
    }
  }

  async retrieve(
    query: string,
    options?: {
      category?: string;
      provider?: string;
      limit?: number;
      minCredibility?: number;
    }
  ): Promise<KnowledgeDocument[]> {
    try {
      const supabase = createSupabaseServer();
      let queryBuilder = supabase
        .from('knowledge_documents')
        .select('*')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

      if (options?.category) {
        queryBuilder = queryBuilder.eq('category', options.category);
      }

      if (options?.provider) {
        queryBuilder = queryBuilder.eq('provider', options.provider);
      }

      if (options?.minCredibility) {
        queryBuilder = queryBuilder.gte('credibility_score', options.minCredibility);
      }

      // Text search for query
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`
      );

      queryBuilder = queryBuilder
        .order('trending_score', { ascending: false })
        .order('credibility_score', { ascending: false })
        .limit(options?.limit || 20);

      const { data, error } = await queryBuilder;

      if (error || !data) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        provider: row.provider,
        title: row.title,
        summary: row.summary,
        content: row.content,
        category: row.category,
        tags: row.tags,
        keywords: row.keywords,
        sourceUrl: row.source_url,
        publishedAt: row.published_at ? new Date(row.published_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        language: row.language,
        country: row.country,
        credibilityScore: row.credibility_score,
        trendingScore: row.trending_score,
        hash: row.hash,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
      }));
    } catch (error) {
      console.error('Knowledge retrieve failed:', error);
      return [];
    }
  }

  async deduplicate(documents: KnowledgeDocument[]): Promise<KnowledgeDocument[]> {
    const seen = new Set<string>();
    const unique: KnowledgeDocument[] = [];

    for (const doc of documents) {
      const key = `${doc.provider}:${doc.hash}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(doc);
      }
    }

    return unique;
  }

  async assignTopics(documents: KnowledgeDocument[]): Promise<KnowledgeDocument[]> {
    // Simple topic assignment based on keywords and categories
    // In production, this could use AI or more sophisticated NLP
    const topicMap: Record<string, string> = {
      'technology': 'Technology',
      'ai': 'Artificial Intelligence',
      'programming': 'Programming',
      'science': 'Science',
      'business': 'Business',
      'politics': 'Politics',
      'entertainment': 'Entertainment',
      'sports': 'Sports',
      'health': 'Health',
      'education': 'Education',
    };

    return documents.map(doc => {
      const keywords = doc.keywords || [];
      const tags = doc.tags || [];
      const allTerms = [...keywords, ...tags, doc.category || ''].map(t => t.toLowerCase());

      for (const [keyword, topic] of Object.entries(topicMap)) {
        if (allTerms.some(term => term.includes(keyword))) {
          return { ...doc, category: topic };
        }
      }

      return doc;
    });
  }

  async updateFreshness(): Promise<void> {
    try {
      const supabase = createSupabaseServer();
      const now = new Date().toISOString();

      // Mark expired documents
      await supabase
        .from('knowledge_documents')
        .update({ trending_score: 0 })
        .lt('expires_at', now);
    } catch (error) {
      console.error('Failed to update freshness:', error);
    }
  }

  private extractTitle(rawData: any): string {
    return rawData.title || rawData.headline || rawData.name || 'Untitled';
  }

  private extractSummary(rawData: any): string {
    return rawData.summary || rawData.description || rawData.excerpt || '';
  }

  private extractContent(rawData: any): string {
    return rawData.content || rawData.body || rawData.text || '';
  }

  private extractSourceUrl(rawData: any): string {
    return rawData.url || rawData.link || rawData.sourceUrl || '';
  }

  private extractPublishedAt(rawData: any): Date | undefined {
    const date = rawData.publishedAt || rawData.date || rawData.pubDate;
    return date ? new Date(date) : undefined;
  }

  private extractCategory(rawData: any): string | undefined {
    return rawData.category || rawData.section;
  }

  private extractTags(rawData: any): string[] {
    return rawData.tags || rawData.keywords || [];
  }

  private extractKeywords(rawData: any): string[] {
    return rawData.keywords || [];
  }

  private extractLanguage(rawData: any): string {
    return rawData.language || 'en';
  }

  private extractCountry(rawData: any): string | undefined {
    return rawData.country;
  }

  private calculateCredibilityScore(provider: string, rawData: any): number {
    // Base credibility scores by provider
    const baseScores: Record<string, number> = {
      wikipedia: 0.9,
      github: 0.85,
      google_news_rss: 0.8,
      youtube: 0.7,
      reddit: 0.6,
    };

    const base = baseScores[provider] || 0.5;

    // Adjust based on data quality indicators
    let score = base;

    if (rawData.author) score += 0.05;
    if (rawData.publishedAt) score += 0.05;
    if (rawData.content && rawData.content.length > 500) score += 0.05;

    return Math.min(score, 1.0);
  }

  private calculateTrendingScore(rawData: any): number {
    let score = 0;

    if (rawData.views) score += Math.log(rawData.views + 1) * 0.1;
    if (rawData.likes) score += Math.log(rawData.likes + 1) * 0.05;
    if (rawData.comments) score += Math.log(rawData.comments + 1) * 0.03;

    // Recent content gets higher trending score
    if (rawData.publishedAt) {
      const age = Date.now() - new Date(rawData.publishedAt).getTime();
      const ageInHours = age / (1000 * 60 * 60);
      if (ageInHours < 24) score += 0.5;
      else if (ageInHours < 48) score += 0.3;
      else if (ageInHours < 168) score += 0.1;
    }

    return Math.min(score, 100);
  }

  private generateHash(rawData: any): string {
    const content = JSON.stringify(rawData);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

export const knowledgeEngine = new KnowledgeEngine();
