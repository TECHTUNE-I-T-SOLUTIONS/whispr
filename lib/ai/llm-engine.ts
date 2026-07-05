// LLM Engine
// The only component allowed to invoke language models following docs/V2/ section 52

import { GoogleGenAI } from '@google/genai';
import { AIRequest, AIResponse, AILog } from '../types/ai.types';
import { createSupabaseServer } from '../supabase-server';

class LLMEngine {
  private client: GoogleGenAI | null = null;
  private model: string = 'gemini-1.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Check GEMINI_API_KEY.');
    }

    const startTime = Date.now();
    let success = false;
    let errorMessage: string | undefined;
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    try {
      // Using the new SDK API - models.generateContent
      const result = await this.client.models.generateContent({
        model: request.model || this.model,
        contents: request.prompt,
        config: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 4096,
        },
      });

      const text = result.text || '';

      // Extract usage if available
      if (result.usageMetadata) {
        usage = {
          promptTokens: result.usageMetadata.promptTokenCount || 0,
          completionTokens: result.usageMetadata.candidatesTokenCount || 0,
          totalTokens: result.usageMetadata.totalTokenCount || 0,
        };
      }

      success = true;
      const latency = Date.now() - startTime;

      // Log the AI request
      await this.logAIRequest({
        userId: request.userId,
        provider: 'gemini',
        model: request.model || this.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        latencyMs: latency,
        success: true,
        feature: request.feature,
      });

      return {
        content: text,
        usage,
        latency,
      };
    } catch (error) {
      errorMessage = (error as Error).message;
      const latency = Date.now() - startTime;

      // Log the failed AI request
      await this.logAIRequest({
        userId: request.userId,
        provider: 'gemini',
        model: request.model || this.model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: latency,
        success: false,
        errorMessage,
        feature: request.feature,
      });

      throw new Error(`LLM Engine failed: ${errorMessage}`);
    }
  }

  async generateWithCache(request: AIRequest): Promise<AIResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = await this.getFromCache(cacheKey);
    
    if (cached) {
      return {
        ...cached,
        cached: true,
      };
    }

    // Generate new response
    const response = await this.generate(request);

    // Cache the response
    await this.saveToCache(cacheKey, response, request.feature);

    return response;
  }

  private generateCacheKey(request: AIRequest): string {
    const normalizedPrompt = request.prompt.trim().toLowerCase();
    const context = request.context ? request.context.trim().toLowerCase() : '';
    return `${request.feature}:${normalizedPrompt}:${context}`;
  }

  private async getFromCache(cacheKey: string): Promise<AIResponse | null> {
    try {
      const supabase = createSupabaseServer();
      const { data, error } = await supabase
        .from('cached_ai')
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
        .from('cached_ai')
        .update({
          hit_count: (data.hit_count || 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      const payload = data.payload as AIResponse;
      return payload;
    } catch (error) {
      console.error('Failed to get from cache:', error);
      return null;
    }
  }

  private async saveToCache(
    cacheKey: string,
    response: AIResponse,
    feature: string
  ): Promise<void> {
    try {
      const supabase = createSupabaseServer();
      
      // Calculate expiry based on feature type
      const expiresAt = this.calculateExpiry(feature);

      await supabase.from('cached_ai').insert({
        cache_key: cacheKey,
        provider: 'gemini',
        payload: response,
        version: 1,
        expires_at: expiresAt,
        status: 'active',
      });
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  private calculateExpiry(feature: string): string {
    const now = new Date();
    const ttlMap: Record<string, number> = {
      'summary': 30 * 24 * 60 * 60 * 1000, // 30 days
      'rewrite': 7 * 24 * 60 * 60 * 1000, // 7 days
      'research': 24 * 60 * 60 * 1000, // 1 day
      'default': 24 * 60 * 60 * 1000, // 1 day default
    };

    const ttl = ttlMap[feature] || ttlMap['default'];
    return new Date(now.getTime() + ttl).toISOString();
  }

  private async logAIRequest(log: Omit<AILog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const supabase = createSupabaseServer();
      await supabase.from('ai_logs').insert({
        user_id: log.userId,
        provider: log.provider,
        model: log.model,
        prompt_tokens: log.promptTokens,
        completion_tokens: log.completionTokens,
        total_tokens: log.totalTokens,
        latency_ms: log.latencyMs,
        success: log.success,
        error_message: log.errorMessage,
        feature: log.feature,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log AI request:', error);
    }
  }

  setModel(model: string): void {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }
}

export const llmEngine = new LLMEngine();
