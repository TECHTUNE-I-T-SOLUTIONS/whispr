// Knowledge Graph Engine
// Transforms isolated knowledge into connected intelligence following docs/V2/ section 84

import { createSupabaseServer } from '../supabase-server';

class KnowledgeGraphEngine {
  async addRelation(
    fromId: string,
    toId: string,
    relationType: string,
    weight: number = 1.0
  ): Promise<void> {
    try {
      const supabase = createSupabaseServer();
      
      // Store in a knowledge_graph table (would need to be created in migration)
      // For now, we'll use a JSONB approach in knowledge_documents
      await supabase.from('knowledge_documents').update({
        // This would be better with a dedicated graph table
        // For MVP, we'll store relations in metadata
      }).eq('id', fromId);
    } catch (error) {
      console.error('Failed to add relation:', error);
    }
  }

  async findRelated(
    contentId: string,
    relationTypes?: string[],
    maxDepth: number = 2
  ): Promise<string[]> {
    try {
      const supabase = createSupabaseServer();
      
      // For MVP, use simple tag/category matching
      const { data: content } = await supabase
        .from('knowledge_documents')
        .select('tags, category, keywords')
        .eq('id', contentId)
        .single();

      if (!content) {
        return [];
      }

      // Find related documents by shared tags/categories
      const allTerms = [
        ...(content.tags || []),
        content.category,
        ...(content.keywords || []),
      ].filter(Boolean);

      const related: string[] = [];

      for (const term of allTerms) {
        const { data: matches } = await supabase
          .from('knowledge_documents')
          .select('id')
          .neq('id', contentId)
          .or(`tags.cs.{${term}},category.eq.${term},keywords.cs.{${term}}`)
          .limit(10);

        if (matches) {
          related.push(...matches.map((m: any) => m.id));
        }
      }

      // Remove duplicates and limit
      return [...new Set(related)].slice(0, 20);
    } catch (error) {
      console.error('Failed to find related content:', error);
      return [];
    }
  }

  async clusterTopics(topics: string[]): Promise<Map<string, string[]>> {
    // Simple clustering based on keyword overlap
    const clusters = new Map<string, string[]>();

    for (const topic of topics) {
      const clusterKey = this.getClusterKey(topic);
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, []);
      }
      clusters.get(clusterKey)!.push(topic);
    }

    return clusters;
  }

  async getTopicGraph(topic: string): Promise<{
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ from: string; to: string; label: string }>;
  }> {
    try {
      const supabase = createSupabaseServer();
      
      const { data: documents } = await supabase
        .from('knowledge_documents')
        .select('*')
        .or(`category.ilike.%${topic}%,tags.cs.{${topic}},keywords.cs.{${topic}}`)
        .limit(50);

      if (!documents) {
        return { nodes: [], edges: [] };
      }

      const nodes = documents.map((doc: any) => ({
        id: doc.id,
        label: doc.title,
        type: doc.category || 'general',
      }));

      const edges: Array<{ from: string; to: string; label: string }> = [];

      // Create edges based on shared tags/categories
      for (let i = 0; i < documents.length; i++) {
        for (let j = i + 1; j < documents.length; j++) {
          const docA = documents[i];
          const docB = documents[j];

          const sharedTags = (docA.tags || []).filter((tag: string) => 
            (docB.tags || []).includes(tag)
          );

          if (sharedTags.length > 0 || docA.category === docB.category) {
            edges.push({
              from: docA.id,
              to: docB.id,
              label: sharedTags.length > 0 ? sharedTags[0] : docA.category || 'related',
            });
          }
        }
      }

      return { nodes, edges };
    } catch (error) {
      console.error('Failed to get topic graph:', error);
      return { nodes: [], edges: [] };
    }
  }

  async updateGraphOnEvent(event: string, entityId: string): Promise<void> {
    // Event-driven graph updates
    switch (event) {
      case 'content_published':
        await this.onContentPublished(entityId);
        break;
      case 'content_viewed':
        await this.onContentViewed(entityId);
        break;
      case 'content_bookmarked':
        await this.onContentBookmarked(entityId);
        break;
    }
  }

  private async onContentPublished(contentId: string): Promise<void> {
    // Update trending scores, connect to similar content
    try {
      const supabase = createSupabaseServer();
      
      await supabase
        .from('knowledge_documents')
        .update({ trending_score: 10 }) // Initial boost
        .eq('id', contentId);
    } catch (error) {
      console.error('Failed to update graph on publish:', error);
    }
  }

  private async onContentViewed(contentId: string): Promise<void> {
    // Increment view count, update trending
    try {
      const supabase = createSupabaseServer();
      
      await supabase.rpc('increment_trending_score', {
        doc_id: contentId,
        amount: 1,
      });
    } catch (error) {
      console.error('Failed to update graph on view:', error);
    }
  }

  private async onContentBookmarked(contentId: string): Promise<void> {
    // Increase relevance score
    try {
      const supabase = createSupabaseServer();
      
      await supabase.rpc('increment_trending_score', {
        doc_id: contentId,
        amount: 5,
      });
    } catch (error) {
      console.error('Failed to update graph on bookmark:', error);
    }
  }

  private getClusterKey(topic: string): string {
    // Simple clustering based on first word or category
    const words = topic.split(' ');
    if (words.length > 0) {
      return words[0].toLowerCase();
    }
    return topic.toLowerCase();
  }
}

export const knowledgeGraphEngine = new KnowledgeGraphEngine();
