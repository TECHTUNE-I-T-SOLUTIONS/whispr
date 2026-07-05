// Cache Engine
// Centralized caching following docs/V2/ sections 45-47

import { CacheEntry } from '../types/ai.types';
import { createSupabaseServer } from '../supabase-server';

class CacheEngine {
  private cacheTypeMap: Record<string, string> = {
    search: 'cached_searches',
    news: 'cached_news',
    ai: 'cached_ai',
    research: 'cached_research',
    trending: 'cached_trending',
  };

  async get(
    cacheKey: string,
    type: 'search' | 'news' | 'ai' | 'research' | 'trending'
  ): Promise<any | null> {
    try {
      const tableName = this.cacheTypeMap[type];
      const supabase = createSupabaseServer();

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('cache_key', cacheKey)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Update hit count and last accessed
      await supabase
        .from(tableName)
        .update({
          hit_count: (data.hit_count || 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      return data.payload;
    } catch (error) {
      console.error(`Cache get failed for ${type}:`, error);
      return null;
    }
  }

  async set(
    cacheKey: string,
    payload: any,
    type: 'search' | 'news' | 'ai' | 'research' | 'trending',
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const tableName = this.cacheTypeMap[type];
      const supabase = createSupabaseServer();

      const expiresAt = this.calculateExpiry(type, ttlSeconds);

      // Check if entry already exists
      const { data: existing } = await supabase
        .from(tableName)
        .select('id')
        .eq('cache_key', cacheKey)
        .single();

      if (existing) {
        // Update existing entry
        await supabase
          .from(tableName)
          .update({
            payload,
            expires_at: expiresAt,
            status: 'active',
            last_accessed_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Insert new entry
        await supabase.from(tableName).insert({
          cache_key: cacheKey,
          provider: type,
          payload,
          version: 1,
          expires_at: expiresAt,
          status: 'active',
        });
      }
    } catch (error) {
      console.error(`Cache set failed for ${type}:`, error);
    }
  }

  async invalidate(
    cacheKey: string,
    type: 'search' | 'news' | 'ai' | 'research' | 'trending'
  ): Promise<void> {
    try {
      const tableName = this.cacheTypeMap[type];
      const supabase = createSupabaseServer();

      await supabase
        .from(tableName)
        .update({ status: 'invalidated' })
        .eq('cache_key', cacheKey);
    } catch (error) {
      console.error(`Cache invalidate failed for ${type}:`, error);
    }
  }

  async invalidateByProvider(provider: string): Promise<void> {
    try {
      const supabase = createSupabaseServer();

      for (const tableName of Object.values(this.cacheTypeMap)) {
        await supabase
          .from(tableName)
          .update({ status: 'invalidated' })
          .eq('provider', provider);
      }
    } catch (error) {
      console.error('Cache invalidate by provider failed:', error);
    }
  }

  async clearExpired(): Promise<void> {
    try {
      const supabase = createSupabaseServer();
      const now = new Date().toISOString();

      for (const tableName of Object.values(this.cacheTypeMap)) {
        await supabase
          .from(tableName)
          .update({ status: 'expired' })
          .lt('expires_at', now);
      }
    } catch (error) {
      console.error('Cache clear expired failed:', error);
    }
  }

  async getStats(type?: 'search' | 'news' | 'ai' | 'research' | 'trending'): Promise<{
    total: number;
    active: number;
    expired: number;
    invalidated: number;
  }> {
    try {
      const supabase = createSupabaseServer();
      const tables = type ? [this.cacheTypeMap[type]] : Object.values(this.cacheTypeMap);

      let total = 0;
      let active = 0;
      let expired = 0;
      let invalidated = 0;

      for (const tableName of tables) {
        const { data } = await supabase
          .from(tableName)
          .select('status');

        if (data) {
          total += data.length;
          active += data.filter((row: any) => row.status === 'active').length;
          expired += data.filter((row: any) => row.status === 'expired').length;
          invalidated += data.filter((row: any) => row.status === 'invalidated').length;
        }
      }

      return { total, active, expired, invalidated };
    } catch (error) {
      console.error('Cache get stats failed:', error);
      return { total: 0, active: 0, expired: 0, invalidated: 0 };
    }
  }

  private calculateExpiry(
    type: string,
    customTtl?: number
  ): string {
    const now = new Date();
    const ttlMap: Record<string, number> = {
      search: 24 * 60 * 60 * 1000, // 24 hours
      news: 30 * 60 * 1000, // 30 minutes
      ai: 30 * 24 * 60 * 60 * 1000, // 30 days (permanent unless source changes)
      research: 24 * 60 * 60 * 1000, // 1 day
      trending: 30 * 60 * 1000, // 30 minutes
    };

    const ttl = customTtl ? customTtl * 1000 : (ttlMap[type] || ttlMap['search']);
    return new Date(now.getTime() + ttl).toISOString();
  }

  generateCacheKey(...parts: string[]): string {
    return parts
      .map(part => part.trim().toLowerCase())
      .filter(part => part.length > 0)
      .join(':');
  }
}

export const cacheEngine = new CacheEngine();
