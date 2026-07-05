-- Migration: Seed Initial Billing Data
-- This migration seeds the database with initial plans, features, and configuration

-- ============================================
-- 1. SEED FEATURES
-- ============================================
INSERT INTO public.billing_features (key, name, description, category, coming_soon) VALUES
-- AI Features
('AI_CHAT', 'AI Chat', 'Access to AI-powered chat conversations', 'ai', false),
('AI_WRITER', 'AI Writer', 'AI-powered content writing assistance', 'ai', false),
('AI_REWRITE', 'AI Rewrite', 'Rewrite and improve existing content', 'ai', false),
('AI_SUMMARIZER', 'AI Summarizer', 'Summarize long documents and articles', 'ai', false),
('AI_TRANSLATE', 'AI Translate', 'Translate text between languages', 'ai', false),
('AI_RESEARCH', 'AI Research', 'Research assistant for deep analysis', 'ai', false),
('AI_IMAGE_GENERATION', 'AI Image Generation', 'Generate images using AI', 'ai', true),
('AI_VIDEO_GENERATION', 'AI Video Generation', 'Generate videos using AI', 'ai', true),
('AI_VOICE', 'AI Voice', 'Text-to-speech and voice features', 'ai', true),
('BLOG_ASSISTANT', 'Blog Assistant', 'AI-powered blog post generation', 'ai', false),
('DOCUMENT_ANALYSIS', 'Document Analysis', 'Analyze and extract insights from documents', 'ai', false),
('CUSTOM_PROMPTS', 'Custom Prompts', 'Create and use custom AI prompts', 'ai', false),

-- Games Features
('PREMIUM_GAMES', 'Premium Games', 'Access to premium game content', 'games', false),
('MULTIPLAYER', 'Multiplayer', 'Play games with other users', 'games', true),
('LEADERBOARDS', 'Leaderboards', 'Compete on global leaderboards', 'games', true),
('DAILY_CHALLENGES', 'Daily Challenges', 'Daily challenge modes', 'games', true),
('STORY_MODE', 'Story Mode', 'Story-based game modes', 'games', false),

-- Platform Features
('PRIORITY_QUEUE', 'Priority Queue', 'Priority processing for AI requests', 'platform', false),
('EARLY_ACCESS', 'Early Access', 'Early access to new features', 'platform', false),
('UNLIMITED_HISTORY', 'Unlimited History', 'Unlimited chat and usage history', 'platform', false),
('ADVANCED_ANALYTICS', 'Advanced Analytics', 'Detailed usage and performance analytics', 'platform', false),
('CLOUD_STORAGE', 'Cloud Storage', 'Cloud storage for documents and media', 'platform', true),
('TEAM_WORKSPACES', 'Team Workspaces', 'Collaborative workspaces for teams', 'platform', true),
('API_ACCESS', 'API Access', 'Programmatic access to WhisprWords API', 'platform', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 2. SEED PLANS
-- ============================================
INSERT INTO public.billing_plans (slug, name, description, price_monthly, price_yearly, currency, paystack_monthly_price_code, paystack_yearly_price_code, trial_days, active, sort_order, features) VALUES
('FREE', 'Free Plan', 'Basic access with limited features', 0, 0, 'USD', NULL, NULL, 0, true, 1, '{"daily_chats": 2, "daily_tokens": 15000, "monthly_tokens": 450000}'::jsonb),
('AI_STARTER', 'AI Starter', 'Perfect for individuals starting with AI', 4.99, 49.99, 'USD', '2603307', '2603308', 7, true, 2, '{"monthly_chats": 1000, "monthly_tokens": 750000}'::jsonb),
('AI_PRO', 'AI Pro', 'For power users who need more AI capabilities', 12.99, 129, 'USD', '2603309', '2603310', 7, true, 3, '{"monthly_chats": 5000, "monthly_tokens": 5000000}'::jsonb),
('GAMES_PREMIUM', 'Games Premium', 'Unlimited access to premium games', 5.99, 59, 'USD', '2603312', '2603313', 7, true, 4, '{"unlimited_games": true}'::jsonb),
('WHISPR_PREMIUM', 'Whispr Premium', 'Complete access to all features', 14.99, 149, 'USD', '2603315', '2603316', 7, true, 5, '{"everything": true, "priority": "highest"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. SEED PLAN FEATURES MAPPING
-- ============================================
-- Get plan IDs
WITH plan_ids AS (
  SELECT id, slug FROM public.billing_plans WHERE slug IN ('FREE', 'AI_STARTER', 'AI_PRO', 'GAMES_PREMIUM', 'WHISPR_PREMIUM')
),
feature_ids AS (
  SELECT id, key FROM public.billing_features
)

-- Free Plan Features
INSERT INTO public.billing_plan_features (plan_id, feature_id, enabled)
SELECT 
  (SELECT id FROM plan_ids WHERE slug = 'FREE'),
  id,
  CASE 
    WHEN key IN ('AI_CHAT', 'AI_WRITER', 'BLOG_ASSISTANT') THEN true
    ELSE false
  END
FROM feature_ids
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- AI Starter Features
INSERT INTO public.billing_plan_features (plan_id, feature_id, enabled)
SELECT 
  (SELECT id FROM plan_ids WHERE slug = 'AI_STARTER'),
  id,
  CASE 
    WHEN key IN ('AI_CHAT', 'AI_WRITER', 'AI_REWRITE', 'AI_SUMMARIZER', 'AI_TRANSLATE', 'BLOG_ASSISTANT', 'CUSTOM_PROMPTS', 'PRIORITY_QUEUE') THEN true
    ELSE false
  END
FROM feature_ids
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- AI Pro Features
INSERT INTO public.billing_plan_features (plan_id, feature_id, enabled)
SELECT 
  (SELECT id FROM plan_ids WHERE slug = 'AI_PRO'),
  id,
  CASE 
    WHEN key IN ('AI_CHAT', 'AI_WRITER', 'AI_REWRITE', 'AI_SUMMARIZER', 'AI_TRANSLATE', 'AI_RESEARCH', 'BLOG_ASSISTANT', 'DOCUMENT_ANALYSIS', 'CUSTOM_PROMPTS', 'PRIORITY_QUEUE', 'EARLY_ACCESS', 'UNLIMITED_HISTORY', 'ADVANCED_ANALYTICS') THEN true
    ELSE false
  END
FROM feature_ids
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- Games Premium Features
INSERT INTO public.billing_plan_features (plan_id, feature_id, enabled)
SELECT 
  (SELECT id FROM plan_ids WHERE slug = 'GAMES_PREMIUM'),
  id,
  CASE 
    WHEN key IN ('PREMIUM_GAMES', 'STORY_MODE', 'DAILY_CHALLENGES', 'LEADERBOARDS') THEN true
    ELSE false
  END
FROM feature_ids
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- Whispr Premium Features (Everything)
INSERT INTO public.billing_plan_features (plan_id, feature_id, enabled)
SELECT 
  (SELECT id FROM plan_ids WHERE slug = 'WHISPR_PREMIUM'),
  id,
  CASE 
    WHEN coming_soon = false THEN true
    ELSE false
  END
FROM feature_ids
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- ============================================
-- 4. SEED PLAN LIMITS
-- ============================================
WITH plan_ids AS (
  SELECT id, slug FROM public.billing_plans WHERE slug IN ('FREE', 'AI_STARTER', 'AI_PRO', 'GAMES_PREMIUM', 'WHISPR_PREMIUM')
)

INSERT INTO public.billing_plan_limits (plan_id, daily_chat_limit, monthly_chat_limit, daily_token_limit, monthly_token_limit, daily_image_limit, monthly_image_limit, voice_minutes, storage_mb, priority_level, max_response_length)
SELECT
  id,
  CASE slug
    WHEN 'FREE' THEN 2
    WHEN 'AI_STARTER' THEN NULL -- Unlimited
    WHEN 'AI_PRO' THEN NULL -- Unlimited
    WHEN 'GAMES_PREMIUM' THEN 2
    WHEN 'WHISPR_PREMIUM' THEN NULL -- Unlimited
  END,
  CASE slug
    WHEN 'FREE' THEN 60
    WHEN 'AI_STARTER' THEN 1000
    WHEN 'AI_PRO' THEN 5000
    WHEN 'GAMES_PREMIUM' THEN 60
    WHEN 'WHISPR_PREMIUM' THEN NULL -- Unlimited
  END,
  CASE slug
    WHEN 'FREE' THEN 15000
    WHEN 'AI_STARTER' THEN 25000
    WHEN 'AI_PRO' THEN 166666
    WHEN 'GAMES_PREMIUM' THEN 15000
    WHEN 'WHISPR_PREMIUM' THEN 166666
  END,
  CASE slug
    WHEN 'FREE' THEN 450000
    WHEN 'AI_STARTER' THEN 750000
    WHEN 'AI_PRO' THEN 5000000
    WHEN 'GAMES_PREMIUM' THEN 450000
    WHEN 'WHISPR_PREMIUM' THEN 5000000
  END,
  CASE slug
    WHEN 'FREE' THEN 0
    WHEN 'AI_STARTER' THEN 0
    WHEN 'AI_PRO' THEN 50
    WHEN 'GAMES_PREMIUM' THEN 0
    WHEN 'WHISPR_PREMIUM' THEN 100
  END,
  CASE slug
    WHEN 'FREE' THEN 0
    WHEN 'AI_STARTER' THEN 0
    WHEN 'AI_PRO' THEN 500
    WHEN 'GAMES_PREMIUM' THEN 0
    WHEN 'WHISPR_PREMIUM' THEN 1000
  END,
  CASE slug
    WHEN 'FREE' THEN 0
    WHEN 'AI_STARTER' THEN 0
    WHEN 'AI_PRO' THEN 60
    WHEN 'GAMES_PREMIUM' THEN 0
    WHEN 'WHISPR_PREMIUM' THEN 120
  END,
  CASE slug
    WHEN 'FREE' THEN 100
    WHEN 'AI_STARTER' THEN 500
    WHEN 'AI_PRO' THEN 2000
    WHEN 'GAMES_PREMIUM' THEN 100
    WHEN 'WHISPR_PREMIUM' THEN 5000
  END,
  CASE slug
    WHEN 'FREE' THEN 1
    WHEN 'AI_STARTER' THEN 2
    WHEN 'AI_PRO' THEN 3
    WHEN 'GAMES_PREMIUM' THEN 1
    WHEN 'WHISPR_PREMIUM' THEN 5
  END,
  CASE slug
    WHEN 'FREE' THEN 500
    WHEN 'AI_STARTER' THEN 2000
    WHEN 'AI_PRO' THEN 4000
    WHEN 'GAMES_PREMIUM' THEN 500
    WHEN 'WHISPR_PREMIUM' THEN 8000
  END
FROM plan_ids
ON CONFLICT (plan_id) DO NOTHING;

-- ============================================
-- 5. SEED AI MODELS (Gemini Only)
-- ============================================
INSERT INTO public.billing_ai_models (provider, model_name, display_name, input_cost_per_1m_tokens, output_cost_per_1m_tokens, supports_images, supports_voice, supports_streaming, active) VALUES
('google', 'gemini-3.5-flash', 'Gemini 3.5 Flash', 0.075, 0.30, true, false, true, true),
('google', 'gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite', 0.05, 0.20, true, false, true, true),
('google', 'gemini-3-flash-preview', 'Gemini 3 Flash Preview', 0.075, 0.30, true, false, true, true),
('google', 'gemini-2.5-pro', 'Gemini 2.5 Pro', 1.25, 5.00, true, false, true, true),
('google', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 0.075, 0.30, true, false, true, true),
('google', 'gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 0.05, 0.20, true, false, true, true),
('google', 'gemini-2.5-flash-lite-preview-09-2025', 'Gemini 2.5 Flash Lite Preview', 0.05, 0.20, true, false, true, true)
ON CONFLICT (provider, model_name) DO NOTHING;

-- ============================================
-- 6. SEED FEATURE FLAGS
-- ============================================
INSERT INTO public.billing_feature_flags (key, enabled, description) VALUES
('PREMIUM_ENABLED', true, 'Master switch for premium features'),
('AI_PREMIUM_ENABLED', true, 'Enable AI premium features'),
('GAMES_PREMIUM_ENABLED', true, 'Enable games premium features'),
('FREE_TRIAL_ENABLED', true, 'Enable free trials for paid plans'),
('IMAGE_GENERATION_ENABLED', false, 'Enable AI image generation'),
('VOICE_FEATURES_ENABLED', false, 'Enable voice features'),
('VIDEO_GENERATION_ENABLED', false, 'Enable AI video generation'),
('MULTIPLAYER_ENABLED', false, 'Enable multiplayer games'),
('LEADERBOARDS_ENABLED', false, 'Enable leaderboards'),
('TEAM_WORKSPACES_ENABLED', false, 'Enable team workspaces')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 7. SEED BILLING SETTINGS
-- ============================================
INSERT INTO public.billing_settings (premium_enabled, ai_premium_enabled, games_premium_enabled, free_trial_enabled, trial_days, currency, exchange_rate_to_ngn, auto_renewal_enabled, grace_period_days, dunning_enabled, max_retry_attempts)
VALUES (true, true, true, true, 7, 'USD', 1500, true, 3, true, 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. SEED INITIAL COUPONS (Optional)
-- ============================================
INSERT INTO public.billing_coupons (code, description, discount_type, discount_value, max_uses, valid_from, valid_until, active)
VALUES
('WELCOME20', 'Welcome discount - 20% off first month', 'percentage', 20, 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', true),
('LAUNCH50', 'Launch special - 50% off first month', 'percentage', 50, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', true)
ON CONFLICT (code) DO NOTHING;
