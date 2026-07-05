-- AI Platform Migration for Whispr V2
-- This migration adds all tables required for the AI-powered platform
-- Following the architecture specified in docs/V2/

-- ============================================
-- CACHE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.cached_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cache_key text NOT NULL,
  provider text NOT NULL,
  payload jsonb NOT NULL,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  last_accessed_at timestamp with time zone DEFAULT now(),
  hit_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalidated')),
  CONSTRAINT cached_searches_pkey PRIMARY KEY (id),
  CONSTRAINT cached_searches_cache_key_unique UNIQUE (cache_key)
);

CREATE INDEX IF NOT EXISTS idx_cached_searches_cache_key ON public.cached_searches(cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_searches_expires_at ON public.cached_searches(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_searches_provider ON public.cached_searches(provider);

CREATE TABLE IF NOT EXISTS public.cached_news (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cache_key text NOT NULL,
  provider text NOT NULL,
  payload jsonb NOT NULL,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  last_accessed_at timestamp with time zone DEFAULT now(),
  hit_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalidated')),
  CONSTRAINT cached_news_pkey PRIMARY KEY (id),
  CONSTRAINT cached_news_cache_key_unique UNIQUE (cache_key)
);

CREATE INDEX IF NOT EXISTS idx_cached_news_cache_key ON public.cached_news(cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_news_expires_at ON public.cached_news(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_news_provider ON public.cached_news(provider);

CREATE TABLE IF NOT EXISTS public.cached_ai (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cache_key text NOT NULL,
  provider text NOT NULL,
  payload jsonb NOT NULL,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  last_accessed_at timestamp with time zone DEFAULT now(),
  hit_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalidated')),
  CONSTRAINT cached_ai_pkey PRIMARY KEY (id),
  CONSTRAINT cached_ai_cache_key_unique UNIQUE (cache_key)
);

CREATE INDEX IF NOT EXISTS idx_cached_ai_cache_key ON public.cached_ai(cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_ai_expires_at ON public.cached_ai(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_ai_provider ON public.cached_ai(provider);

CREATE TABLE IF NOT EXISTS public.cached_research (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cache_key text NOT NULL,
  provider text NOT NULL,
  payload jsonb NOT NULL,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  last_accessed_at timestamp with time zone DEFAULT now(),
  hit_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalidated')),
  CONSTRAINT cached_research_pkey PRIMARY KEY (id),
  CONSTRAINT cached_research_cache_key_unique UNIQUE (cache_key)
);

CREATE INDEX IF NOT EXISTS idx_cached_research_cache_key ON public.cached_research(cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_research_expires_at ON public.cached_research(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_research_provider ON public.cached_research(provider);

CREATE TABLE IF NOT EXISTS public.cached_trending (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cache_key text NOT NULL,
  provider text NOT NULL,
  payload jsonb NOT NULL,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  last_accessed_at timestamp with time zone DEFAULT now(),
  hit_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalidated')),
  CONSTRAINT cached_trending_pkey PRIMARY KEY (id),
  CONSTRAINT cached_trending_cache_key_unique UNIQUE (cache_key)
);

CREATE INDEX IF NOT EXISTS idx_cached_trending_cache_key ON public.cached_trending(cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_trending_expires_at ON public.cached_trending(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_trending_provider ON public.cached_trending(provider);

-- ============================================
-- KNOWLEDGE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  title text NOT NULL,
  summary text,
  content text,
  category text,
  tags text[] DEFAULT ARRAY[]::text[],
  keywords text[] DEFAULT ARRAY[]::text[],
  source_url text,
  published_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  language text DEFAULT 'en',
  country text,
  credibility_score numeric DEFAULT 0.5 CHECK (credibility_score >= 0 AND credibility_score <= 1),
  trending_score numeric DEFAULT 0 CHECK (trending_score >= 0),
  hash text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT knowledge_documents_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_documents_hash_unique UNIQUE (hash)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_provider ON public.knowledge_documents(provider);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category ON public.knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_tags ON public.knowledge_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_keywords ON public.knowledge_documents USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_published_at ON public.knowledge_documents(published_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_expires_at ON public.knowledge_documents(expires_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_trending_score ON public.knowledge_documents(trending_score);

-- ============================================
-- PROVIDER HEALTH TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.provider_health (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  healthy boolean DEFAULT true,
  average_response_time numeric DEFAULT 0,
  last_success timestamp with time zone,
  last_failure timestamp with time zone,
  cache_hit_rate numeric DEFAULT 0,
  estimated_quota_remaining integer,
  error_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  last_checked_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT provider_health_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_provider_health_provider ON public.provider_health(provider);
CREATE INDEX IF NOT EXISTS idx_provider_health_healthy ON public.provider_health(healthy);

CREATE TABLE IF NOT EXISTS public.provider_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  endpoint text,
  method text,
  status_code integer,
  response_time_ms numeric,
  success boolean,
  error_message text,
  cache_hit boolean DEFAULT false,
  timestamp timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT provider_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_provider_logs_provider ON public.provider_logs(provider);
CREATE INDEX IF NOT EXISTS idx_provider_logs_timestamp ON public.provider_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_provider_logs_success ON public.provider_logs(success);

-- ============================================
-- RECOMMENDATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.recommendation_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recommendation_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT recommendation_profiles_user_id_unique UNIQUE (user_id),
  CONSTRAINT recommendation_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recommendation_profiles_user_id ON public.recommendation_profiles(user_id);

CREATE TABLE IF NOT EXISTS public.recommendation_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL,
  score numeric NOT NULL,
  reason text,
  calculated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT recommendation_scores_pkey PRIMARY KEY (id),
  CONSTRAINT recommendation_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recommendation_scores_user_id ON public.recommendation_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_content_id ON public.recommendation_scores(content_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_score ON public.recommendation_scores(score);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_expires_at ON public.recommendation_scores(expires_at);

-- ============================================
-- USER PERSONALIZATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  interest text NOT NULL,
  weight numeric DEFAULT 1.0,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'inferred', 'behavior')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_interests_pkey PRIMARY KEY (id),
  CONSTRAINT user_interests_user_id_interest_unique UNIQUE (user_id, interest),
  CONSTRAINT user_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON public.user_interests(interest);
CREATE INDEX IF NOT EXISTS idx_user_interests_weight ON public.user_interests(weight);

CREATE TABLE IF NOT EXISTS public.user_topics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  follow_count integer DEFAULT 0,
  last_engaged_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_topics_pkey PRIMARY KEY (id),
  CONSTRAINT user_topics_user_id_topic_unique UNIQUE (user_id, topic),
  CONSTRAINT user_topics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_topics_user_id ON public.user_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topics_topic ON public.user_topics(topic);
CREATE INDEX IF NOT EXISTS idx_user_topics_follow_count ON public.user_topics(follow_count);

CREATE TABLE IF NOT EXISTS public.user_search_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  query text NOT NULL,
  results_count integer DEFAULT 0,
  clicked_result_id uuid,
  clicked_result_type text,
  timestamp timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_search_history_pkey PRIMARY KEY (id),
  CONSTRAINT user_search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON public.user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_timestamp ON public.user_search_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_search_history_query ON public.user_search_history(query);

-- ============================================
-- ANALYTICS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.search_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  query text NOT NULL,
  result_count integer DEFAULT 0,
  has_results boolean DEFAULT true,
  search_type text DEFAULT 'general',
  timestamp timestamp with time zone DEFAULT now(),
  user_id uuid,
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT search_analytics_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON public.search_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON public.search_analytics(user_id);

CREATE TABLE IF NOT EXISTS public.ai_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  provider text NOT NULL,
  model text,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  latency_ms numeric,
  success boolean DEFAULT true,
  error_message text,
  feature text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT ai_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_timestamp ON public.ai_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_logs_provider ON public.ai_logs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature ON public.ai_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_success ON public.ai_logs(success);

-- ============================================
-- CONFIGURATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flag_name text NOT NULL UNIQUE,
  enabled boolean DEFAULT false,
  description text,
  rollout_percentage numeric DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_whitelist uuid[] DEFAULT ARRAY[]::uuid[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feature_flags_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_name ON public.feature_flags(flag_name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(enabled);

CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_name text NOT NULL,
  version text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT prompt_versions_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_versions_name_version_unique UNIQUE (prompt_name, version),
  CONSTRAINT prompt_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_name ON public.prompt_versions(prompt_name);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_is_active ON public.prompt_versions(is_active);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  setting_type text DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description text,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_setting_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_public ON public.system_settings(is_public);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default feature flags based on documentation
-- All features disabled by default - admin will enable via control panel
INSERT INTO public.feature_flags (flag_name, enabled, description, rollout_percentage) VALUES
('ENABLE_EDITOR_AI', false, 'Enable AI-powered editor features (grammar, SEO, outlines, headlines)', 0),
('ENABLE_RESEARCH_ENGINE', false, 'Enable research engine with multi-source synthesis', 0),
('ENABLE_RECOMMENDATION_ENGINE', false, 'Enable personalized recommendation engine', 0),
('ENABLE_TRENDING_ENGINE', false, 'Enable trending content engine', 0),
('ENABLE_LEARNING_ENGINE', false, 'Enable learning engine for creators', 0),
('ENABLE_SMART_SEARCH', false, 'Enable category-aware smart search', 0),
('ENABLE_YOUTUBE_PROVIDER', false, 'Enable YouTube provider', 0),
('ENABLE_REDDIT_PROVIDER', false, 'Enable Reddit provider', 0),
('ENABLE_GITHUB_PROVIDER', false, 'Enable GitHub provider', 0),
('ENABLE_WIKIPEDIA_PROVIDER', false, 'Enable Wikipedia provider', 0),
('ENABLE_SEARCH_PROVIDER', false, 'Enable Google Search provider', 0),
('ENABLE_GOOGLE_NEWS_RSS', false, 'Enable Google News RSS provider', 0)
ON CONFLICT (flag_name) DO NOTHING;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('CACHE_DEFAULT_TTL_SECONDS', '86400', 'number', 'Default cache TTL in seconds (24 hours)', false),
('AI_MAX_TOKENS', '4096', 'number', 'Maximum tokens for AI requests', false),
('AI_TEMPERATURE', '0.7', 'number', 'Default AI temperature', false),
('MAX_RETRIES', '3', 'number', 'Maximum retry attempts for failed requests', false),
('REQUEST_TIMEOUT_MS', '30000', 'number', 'Request timeout in milliseconds', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Initialize provider health entries
INSERT INTO public.provider_health (provider, healthy, average_response_time, last_checked_at) VALUES
('gemini', true, 0, now()),
('google_search', true, 0, now()),
('google_news_rss', true, 0, now()),
('wikipedia', true, 0, now()),
('github', true, 0, now()),
('youtube', true, 0, now()),
('reddit', true, 0, now())
ON CONFLICT (provider) DO NOTHING;
