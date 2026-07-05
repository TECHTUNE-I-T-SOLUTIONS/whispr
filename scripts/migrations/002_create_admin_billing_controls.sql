-- Migration: Create Admin Billing Controls and Management Tables
-- This migration adds admin controls for managing premium features, pricing, and subscriptions

-- ============================================
-- 1. BILLING SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  premium_enabled boolean NOT NULL DEFAULT true,
  ai_premium_enabled boolean NOT NULL DEFAULT true,
  games_premium_enabled boolean NOT NULL DEFAULT true,
  free_trial_enabled boolean NOT NULL DEFAULT true,
  trial_days integer NOT NULL DEFAULT 7,
  currency text NOT NULL DEFAULT 'USD',
  exchange_rate_to_ngn numeric NOT NULL DEFAULT 1500, -- USD to NGN conversion rate
  paystack_public_key text,
  paystack_secret_key text,
  auto_renewal_enabled boolean NOT NULL DEFAULT true,
  grace_period_days integer NOT NULL DEFAULT 3,
  dunning_enabled boolean NOT NULL DEFAULT true,
  max_retry_attempts integer NOT NULL DEFAULT 3,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. ADMIN SUBSCRIPTION MANAGEMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_admin_subscription_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('manual_upgrade', 'manual_downgrade', 'extend_trial', 'grant_free_access', 'revoke_access', 'refund', 'adjust_quota', 'pause_subscription', 'resume_subscription')),
  action_details jsonb DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_admin_subscription_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id) ON DELETE CASCADE,
  CONSTRAINT billing_admin_subscription_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- 3. SUBSCRIPTION DISPUTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_subscription_disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subscription_id uuid,
  dispute_type text NOT NULL CHECK (dispute_type IN ('unauthorized_charge', 'service_not_received', 'quality_issue', 'billing_error', 'refund_request', 'other')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'rejected', 'escalated')),
  provider_dispute_id text,
  resolution text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  refund_amount numeric,
  refund_currency text DEFAULT 'USD',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_subscription_disputes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT billing_subscription_disputes_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.billing_user_subscriptions(id) ON DELETE SET NULL,
  CONSTRAINT billing_subscription_disputes_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.admin(id)
);

-- ============================================
-- 4. COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL,
  applicable_plans uuid[], -- Array of plan IDs this coupon applies to, null means all plans
  max_uses integer, -- null for unlimited
  uses_count integer NOT NULL DEFAULT 0,
  valid_from timestamp with time zone NOT NULL,
  valid_until timestamp with time zone NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id)
);

-- ============================================
-- 5. COUPON USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_coupon_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid NOT NULL,
  user_id uuid NOT NULL,
  subscription_id uuid,
  discount_amount numeric NOT NULL,
  used_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_coupon_usage_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.billing_coupons(id) ON DELETE CASCADE,
  CONSTRAINT billing_coupon_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT billing_coupon_usage_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.billing_user_subscriptions(id) ON DELETE SET NULL,
  UNIQUE(coupon_id, user_id)
);

-- ============================================
-- 6. REFERRALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referral_code text NOT NULL UNIQUE,
  total_referrals integer NOT NULL DEFAULT 0,
  successful_referrals integer NOT NULL DEFAULT 0,
  total_rewards_earned numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- 7. REFERRAL TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_referral_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid NOT NULL,
  referred_user_id uuid,
  reward_type text NOT NULL CHECK (reward_type IN ('tokens', 'free_days', 'discount', 'cash')),
  reward_value numeric NOT NULL,
  reward_currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'expired', 'revoked')),
  granted_at timestamp with time zone,
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_referral_transactions_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES public.billing_referrals(id) ON DELETE CASCADE,
  CONSTRAINT billing_referral_transactions_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- 8. BILLING ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  total_subscribers integer NOT NULL DEFAULT 0,
  new_subscribers integer NOT NULL DEFAULT 0,
  cancelled_subscribers integer NOT NULL DEFAULT 0,
  churned_subscribers integer NOT NULL DEFAULT 0,
  trial_users integer NOT NULL DEFAULT 0,
  mrr numeric NOT NULL DEFAULT 0, -- Monthly Recurring Revenue
  arr numeric NOT NULL DEFAULT 0, -- Annual Recurring Revenue
  total_revenue numeric NOT NULL DEFAULT 0,
  refunds numeric NOT NULL DEFAULT 0,
  failed_payments integer NOT NULL DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  avg_revenue_per_user numeric DEFAULT 0,
  total_ai_cost numeric DEFAULT 0,
  profit_margin numeric DEFAULT 0,
  active_plans jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. PLAN REVENUE BREAKDOWN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_plan_revenue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analytics_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  subscriber_count integer NOT NULL DEFAULT 0,
  new_subscribers integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_plan_revenue_analytics_id_fkey FOREIGN KEY (analytics_id) REFERENCES public.billing_analytics(id) ON DELETE CASCADE,
  CONSTRAINT billing_plan_revenue_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.billing_plans(id) ON DELETE CASCADE,
  UNIQUE(analytics_id, plan_id)
);

-- ============================================
-- 10. GAMES PREMIUM CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_games_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL,
  premium_required boolean NOT NULL DEFAULT false,
  is_free boolean NOT NULL DEFAULT false,
  required_feature_key text,
  minimum_plan_slug text,
  free_daily_plays integer NOT NULL DEFAULT 1,
  premium_daily_plays integer NOT NULL DEFAULT -1, -- -1 means unlimited
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_games_config_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.chronicles_games(id) ON DELETE CASCADE
);

-- ============================================
-- 11. USER GAME USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_user_game_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  game_id uuid NOT NULL,
  date date NOT NULL,
  plays_count integer NOT NULL DEFAULT 0,
  premium_plays_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT billing_user_game_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT billing_user_game_usage_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.chronicles_games(id) ON DELETE CASCADE,
  UNIQUE(user_id, game_id, date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_billing_settings_id ON public.billing_settings(id);
CREATE INDEX IF NOT EXISTS idx_billing_admin_actions_admin ON public.billing_admin_subscription_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_billing_admin_actions_user ON public.billing_admin_subscription_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_disputes_user ON public.billing_subscription_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_disputes_status ON public.billing_subscription_disputes(status);
CREATE INDEX IF NOT EXISTS idx_billing_coupons_code ON public.billing_coupons(code);
CREATE INDEX IF NOT EXISTS idx_billing_coupons_active ON public.billing_coupons(active);
CREATE INDEX IF NOT EXISTS idx_billing_coupon_usage_coupon ON public.billing_coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_billing_coupon_usage_user ON public.billing_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_referrals_referrer ON public.billing_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_billing_referrals_code ON public.billing_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_billing_referral_transactions_referral ON public.billing_referral_transactions(referral_id);
CREATE INDEX IF NOT EXISTS idx_billing_analytics_date ON public.billing_analytics(date);
CREATE INDEX IF NOT EXISTS idx_billing_plan_revenue_analytics ON public.billing_plan_revenue(analytics_id);
CREATE INDEX IF NOT EXISTS idx_billing_games_config_game ON public.billing_games_config(game_id);
CREATE INDEX IF NOT EXISTS idx_billing_user_game_usage_user_game_date ON public.billing_user_game_usage(user_id, game_id, date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_admin_subscription_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscription_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_referral_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plan_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_games_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_user_game_usage ENABLE ROW LEVEL SECURITY;

-- Service role can manage all admin billing tables
CREATE POLICY "Service role can manage billing settings" ON public.billing_settings
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage admin actions" ON public.billing_admin_subscription_actions
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage disputes" ON public.billing_subscription_disputes
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage coupons" ON public.billing_coupons
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage coupon usage" ON public.billing_coupon_usage
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage referrals" ON public.billing_referrals
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage referral transactions" ON public.billing_referral_transactions
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage analytics" ON public.billing_analytics
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage plan revenue" ON public.billing_plan_revenue
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage games config" ON public.billing_games_config
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage user game usage" ON public.billing_user_game_usage
FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own disputes
CREATE POLICY "Users can read own disputes" ON public.billing_subscription_disputes
FOR SELECT USING (user_id = auth.uid());

-- Users can read active coupons
CREATE POLICY "Users can read active coupons" ON public.billing_coupons
FOR SELECT USING (active = true AND valid_from <= CURRENT_TIMESTAMP AND valid_until >= CURRENT_TIMESTAMP);

-- Users can read their own coupon usage
CREATE POLICY "Users can read own coupon usage" ON public.billing_coupon_usage
FOR SELECT USING (user_id = auth.uid());

-- Users can read their own referrals
CREATE POLICY "Users can read own referrals" ON public.billing_referrals
FOR SELECT USING (referrer_id = auth.uid());

-- Users can read their own referral transactions
CREATE POLICY "Users can read own referral transactions" ON public.billing_referral_transactions
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.billing_referrals r
  WHERE r.id = referral_id AND r.referrer_id = auth.uid()
));

-- Public can read games config
CREATE POLICY "Public can read games config" ON public.billing_games_config
FOR SELECT USING (true);

-- Users can read their own game usage
CREATE POLICY "Users can read own game usage" ON public.billing_user_game_usage
FOR SELECT USING (user_id = auth.uid());
