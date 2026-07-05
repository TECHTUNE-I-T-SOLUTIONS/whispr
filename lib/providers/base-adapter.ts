// Base Adapter Interface
// All providers must implement this interface following docs/V2/ section 8, 53

import { ProviderAdapter, ProviderLog } from '../types/ai.types';
import { createSupabaseServer } from '../supabase-server';

export abstract class BaseAdapter implements ProviderAdapter {
  abstract name: string;
  protected maxRetries: number = 3;
  protected timeout: number = 30000;

  abstract search(query: string, options?: any): Promise<any>;
  abstract fetch?(id: string, options?: any): Promise<any>;
  abstract latest?(options?: any): Promise<any>;
  abstract trending?(options?: any): Promise<any>;
  abstract details?(url: string, options?: any): Promise<any>;

  protected async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
          ),
        ]);
        const duration = Date.now() - startTime;

        // Log success
        await this.logProvider({
          provider: this.name,
          endpoint: context,
          method: 'GET',
          responseTimeMs: duration,
          success: true,
          cacheHit: false,
        });

        // Update provider health
        await this.updateProviderHealth(true, duration);

        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Log failure
        await this.logProvider({
          provider: this.name,
          endpoint: context,
          method: 'GET',
          success: false,
          errorMessage: (error as Error).message,
          cacheHit: false,
        });

        // Update provider health
        await this.updateProviderHealth(false);

        if (attempt === this.maxRetries) {
          throw new Error(
            `${this.name} ${context} failed after ${attempt} attempts: ${lastError.message}`
          );
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError || new Error('Unknown error');
  }

  protected async logProvider(log: Omit<ProviderLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const supabase = createSupabaseServer();
      await supabase.from('provider_logs').insert({
        provider: log.provider,
        endpoint: log.endpoint,
        method: log.method,
        status_code: log.statusCode,
        response_time_ms: log.responseTimeMs,
        success: log.success,
        error_message: log.errorMessage,
        cache_hit: log.cacheHit,
        timestamp: new Date().toISOString(),
        metadata: log.metadata,
      });
    } catch (error) {
      console.error('Failed to log provider activity:', error);
    }
  }

  protected async updateProviderHealth(
    success: boolean,
    responseTime?: number
  ): Promise<void> {
    try {
      const supabase = createSupabaseServer();
      const now = new Date().toISOString();
      
      const { data: current } = await supabase
        .from('provider_health')
        .select('*')
        .eq('provider', this.name)
        .single();

      if (!current) {
        // Create initial health record
        await supabase.from('provider_health').insert({
          provider: this.name,
          healthy: success,
          average_response_time: responseTime || 0,
          last_success: success ? now : null,
          last_failure: !success ? now : null,
          error_count: !success ? 1 : 0,
          success_count: success ? 1 : 0,
          last_checked_at: now,
        });
      } else {
        // Update existing health record
        const updates: any = {
          last_checked_at: now,
        };

        if (success) {
          updates.last_success = now;
          updates.success_count = (current.success_count || 0) + 1;
          updates.healthy = true;
          
          if (responseTime) {
            const currentAvg = current.average_response_time || 0;
            const currentCount = current.success_count || 0;
            updates.average_response_time = 
              (currentAvg * currentCount + responseTime) / (currentCount + 1);
          }
        } else {
          updates.last_failure = now;
          updates.error_count = (current.error_count || 0) + 1;
          
          // Mark as unhealthy if error rate is high
          const totalRequests = (current.success_count || 0) + (current.error_count || 0) + 1;
          const errorRate = updates.error_count / totalRequests;
          if (errorRate > 0.5) {
            updates.healthy = false;
          }
        }

        await supabase
          .from('provider_health')
          .update(updates)
          .eq('provider', this.name);
      }
    } catch (error) {
      console.error('Failed to update provider health:', error);
    }
  }

  protected async isHealthy(): Promise<boolean> {
    try {
      const supabase = createSupabaseServer();
      const { data } = await supabase
        .from('provider_health')
        .select('healthy')
        .eq('provider', this.name)
        .single();

      return data?.healthy ?? true;
    } catch (error) {
      console.error('Failed to check provider health:', error);
      return true; // Assume healthy if we can't check
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected normalizeUrl(url: string): string {
    try {
      return new URL(url).href;
    } catch {
      return url;
    }
  }

  protected generateHash(content: string): string {
    // Simple hash generation for deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
