-- Migration: Create Billing and Premium Subscription Tables
-- This migration adds the core billing infrastructure for WhisprWords premium features
-- Includes: Plans, Features, Subscriptions, Entitlements, Usage Tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  paystack_monthly_price_code text,
  paystack_yearly_price_code text,
  trial_days integer NOT NULL DEFAULT 7,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. FEATURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text DEFAULT 'general',
  coming_soon boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. PLAN FEATURES TABLE (Mapping)
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_plan_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL,
  feature_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_plan_features_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.billing_plans(id) ON DELETE CASCADE,
  CONSTRAINT billing_plan_features_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.billing_features(id) ON DELETE CASCADE,
  UNIQUE(plan_id, feature_id)
);

-- ============================================
-- 4. PLAN LIMITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_plan_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL UNIQUE,
  daily_chat_limit integer,
  monthly_chat_limit integer,
  daily_token_limit bigint,
  monthly_token_limit bigint,
  daily_image_limit integer,
  monthly_image_limit integer,
  voice_minutes integer,
  storage_mb integer,
  priority_level integer DEFAULT 1,
  max_response_length integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_plan_limits_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.billing_plans(id) ON DELETE CASCADE
);

-- ============================================
-- 5. USER SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'paystack',
  provider_customer_id text,
  provider_subscription_id text,
  provider_price_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired', 'incomplete')),
  billing_interval text CHECK (billing_interval IN ('monthly', 'yearly')),
  trial_ends_at timestamp with time zone,
  started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamp with time zone,
  trial_used boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT billing_user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.billing_plans(id)
);

-- ============================================
-- 6. USER ENTITLEMENTS TABLE (Cache)
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_user_entitlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone,
  source_subscription_id uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_user_entitlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT billing_user_entitlements_source_subscription_id_fkey FOREIGN KEY (source_subscription_id) REFERENCES public.billing_user_subscriptions(id) ON DELETE SET NULL,
  UNIQUE(user_id, feature_key)
);

-- ============================================
-- 7. AI USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_ai_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month text NOT NULL, -- Format: YYYY-MM
  tokens_used bigint NOT NULL DEFAULT 0,
  input_tokens bigint NOT NULL DEFAULT 0,
  output_tokens bigint NOT NULL DEFAULT 0,
  chat_count integer NOT NULL DEFAULT 0,
  completion_count integer NOT NULL DEFAULT 0,
  image_requests integer NOT NULL DEFAULT 0,
  voice_minutes integer NOT NULL DEFAULT 0,
  research_requests integer NOT NULL DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_ai_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, month)
);

-- ============================================
-- 8. AI USAGE LOGS TABLE (Detailed)
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_ai_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  feature text NOT NULL,
  request_tokens bigint NOT NULL DEFAULT 0,
  response_tokens bigint NOT NULL DEFAULT 0,
  total_tokens bigint NOT NULL DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  response_time_ms integer,
  status text DEFAULT 'success',
  error_message text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_ai_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- 9. AI MODELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_ai_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL,
  model_name text NOT NULL,
  display_name text NOT NULL,
  input_cost_per_1m_tokens numeric NOT NULL DEFAULT 0,
  output_cost_per_1m_tokens numeric NOT NULL DEFAULT 0,
  supports_images boolean DEFAULT false,
  supports_voice boolean DEFAULT false,
  supports_streaming boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, model_name)
);

-- ============================================
-- 10. FEATURE FLAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. PAYMENT TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subscription_id uuid,
  transaction_type text NOT NULL CHECK (transaction_type IN ('subscription', 'upgrade', 'downgrade', 'renewal', 'refund', 'trial_start')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  provider_transaction_id text,
  provider_payment_method text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamp with time zone,
  CONSTRAINT billing_payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT billing_payment_transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.billing_user_subscriptions(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_billing_plans_slug ON public.billing_plans(slug);
CREATE INDEX IF NOT EXISTS idx_billing_plans_active ON public.billing_plans(active);
CREATE INDEX IF NOT EXISTS idx_billing_features_key ON public.billing_features(key);
CREATE INDEX IF NOT EXISTS idx_billing_plan_features_plan ON public.billing_plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_billing_plan_features_feature ON public.billing_plan_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_billing_user_subscriptions_user ON public.billing_user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_user_subscriptions_status ON public.billing_user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_user_subscriptions_provider_sub ON public.billing_user_subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_user_entitlements_user ON public.billing_user_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_user_entitlements_feature ON public.billing_user_entitlements(feature_key);
CREATE INDEX IF NOT EXISTS idx_billing_ai_usage_user_month ON public.billing_ai_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_billing_ai_usage_logs_user ON public.billing_ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_ai_usage_logs_created ON public.billing_ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_payment_transactions_user ON public.billing_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_payment_transactions_subscription ON public.billing_payment_transactions(subscription_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payment_transactions ENABLE ROW LEVEL SECURITY;

-- Public can read active plans
CREATE POLICY "Public can read active plans" ON public.billing_plans
FOR SELECT USING (active = true);

-- Public can read features
CREATE POLICY "Public can read features" ON public.billing_features
FOR SELECT USING (true);

-- Public can read plan features
CREATE POLICY "Public can read plan features" ON public.billing_plan_features
FOR SELECT USING (true);

-- Public can read plan limits
CREATE POLICY "Public can read plan limits" ON public.billing_plan_limits
FOR SELECT USING (true);

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON public.billing_user_subscriptions
FOR SELECT USING (user_id = auth.uid());

-- Users can read their own entitlements
CREATE POLICY "Users can read own entitlements" ON public.billing_user_entitlements
FOR SELECT USING (user_id = auth.uid());

-- Users can read their own usage
CREATE POLICY "Users can read own usage" ON public.billing_ai_usage
FOR SELECT USING (user_id = auth.uid());

-- Users can read their own usage logs
CREATE POLICY "Users can read own usage logs" ON public.billing_ai_usage_logs
FOR SELECT USING (user_id = auth.uid());

-- Public can read active AI models
CREATE POLICY "Public can read active AI models" ON public.billing_ai_models
FOR SELECT USING (active = true);

-- Public can read feature flags
CREATE POLICY "Public can read feature flags" ON public.billing_feature_flags
FOR SELECT USING (true);

-- Users can read their own transactions
CREATE POLICY "Users can read own transactions" ON public.billing_payment_transactions
FOR SELECT USING (user_id = auth.uid());

-- Service role can manage all billing tables
CREATE POLICY "Service role can manage plans" ON public.billing_plans
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage features" ON public.billing_features
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage plan features" ON public.billing_plan_features
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage plan limits" ON public.billing_plan_limits
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage user subscriptions" ON public.billing_user_subscriptions
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage user entitlements" ON public.billing_user_entitlements
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage AI usage" ON public.billing_ai_usage
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage AI usage logs" ON public.billing_ai_usage_logs
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage AI models" ON public.billing_ai_models
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage feature flags" ON public.billing_feature_flags
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage payment transactions" ON public.billing_payment_transactions
FOR ALL USING (auth.role() = 'service_role');
