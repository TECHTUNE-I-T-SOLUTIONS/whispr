// AI Platform Type Definitions
// Following the architecture specified in docs/V2/

export interface ProviderAdapter {
  name: string;
  search?(query: string, options?: any): Promise<any>;
  fetch?(id: string, options?: any): Promise<any>;
  latest?(options?: any): Promise<any>;
  trending?(options?: any): Promise<any>;
  details?(url: string, options?: any): Promise<any>;
}

export interface KnowledgeDocument {
  id?: string;
  provider: string;
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  sourceUrl?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
  language?: string;
  country?: string;
  credibilityScore?: number;
  trendingScore?: number;
  hash?: string;
  createdAt?: Date;
}

export interface CacheEntry {
  id?: string;
  cacheKey: string;
  provider: string;
  payload: any;
  version?: number;
  createdAt?: Date;
  expiresAt: Date;
  lastAccessedAt?: Date;
  hitCount?: number;
  status?: 'active' | 'expired' | 'invalidated';
}

export interface ProviderHealth {
  id?: string;
  provider: string;
  healthy: boolean;
  averageResponseTime: number;
  lastSuccess?: Date;
  lastFailure?: Date;
  cacheHitRate: number;
  estimatedQuotaRemaining?: number;
  errorCount: number;
  successCount: number;
  lastCheckedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProviderLog {
  id?: string;
  provider: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTimeMs?: number;
  success: boolean;
  errorMessage?: string;
  cacheHit: boolean;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface AILog {
  id?: string;
  userId?: string;
  provider: string;
  model?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs?: number;
  success: boolean;
  errorMessage?: string;
  feature: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ResearchPackage {
  summary: string;
  keyFacts: string[];
  sources: KnowledgeDocument[];
  references: string[];
  suggestedTitles: string[];
  suggestedOutline: string[];
  suggestedKeywords: string[];
  suggestedTags: string[];
  suggestedQuestions: string[];
  relatedTopics: string[];
}

export interface AIRequest {
  prompt: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  feature: string;
  userId?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency?: number;
  cached?: boolean;
}

export interface RecommendationProfile {
  id?: string;
  userId: string;
  profileData: Record<string, any>;
  lastUpdatedAt?: Date;
  createdAt?: Date;
}

export interface RecommendationScore {
  id?: string;
  userId: string;
  contentId: string;
  contentType: string;
  score: number;
  reason?: string;
  calculatedAt?: Date;
  expiresAt?: Date;
}

export interface FeatureFlag {
  id?: string;
  flagName: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  userWhitelist?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PromptVersion {
  id?: string;
  promptName: string;
  version: string;
  content: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  createdBy?: string;
}

export interface SystemSetting {
  id?: string;
  settingKey: string;
  settingValue?: string;
  settingType?: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}
