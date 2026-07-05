// Feature Flags Service
// Centralized feature flag management following docs/V2/ section 77

import { createClient } from '@supabase/supabase-js';
import { FeatureFlag } from '../types/ai.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

class FeatureFlagsService {
  private cache: Map<string, FeatureFlag> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async isEnabled(flagName: string, userId?: string): Promise<boolean> {
    try {
      const flag = await this.getFlag(flagName);
      
      if (!flag) {
        return false;
      }

      if (!flag.enabled) {
        return false;
      }

      // Check user whitelist
      if (userId && flag.userWhitelist && flag.userWhitelist.length > 0) {
        return flag.userWhitelist.includes(userId);
      }

      // Check rollout percentage (simplified - in production, use consistent hashing)
      if (flag.rolloutPercentage && flag.rolloutPercentage < 100) {
        if (!userId) {
          return Math.random() * 100 < flag.rolloutPercentage;
        }
        // Use consistent hashing based on user ID
        const hash = this.hashCode(userId);
        return (hash % 100) < flag.rolloutPercentage;
      }

      return true;
    } catch (error) {
      console.error(`Error checking feature flag ${flagName}:`, error);
      return false;
    }
  }

  async getFlag(flagName: string): Promise<FeatureFlag | null> {
    // Check cache first
    const cached = this.cache.get(flagName);
    const expiry = this.cacheExpiry.get(flagName);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_name', flagName)
      .single();

    if (error || !data) {
      return null;
    }

    const flag: FeatureFlag = {
      id: data.id,
      flagName: data.flag_name,
      enabled: data.enabled,
      description: data.description,
      rolloutPercentage: data.rollout_percentage,
      userWhitelist: data.user_whitelist,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Cache the result
    this.cache.set(flagName, flag);
    this.cacheExpiry.set(flagName, Date.now() + this.CACHE_TTL);

    return flag;
  }

  async getAllFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_name');

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      flagName: row.flag_name,
      enabled: row.enabled,
      description: row.description,
      rolloutPercentage: row.rollout_percentage,
      userWhitelist: row.user_whitelist,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async setFlag(flagName: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('flag_name', flagName);

    if (error) {
      throw new Error(`Failed to set feature flag ${flagName}: ${error.message}`);
    }

    // Invalidate cache
    this.cache.delete(flagName);
    this.cacheExpiry.delete(flagName);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export const featureFlagsService = new FeatureFlagsService();
