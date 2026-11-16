-- Mobile push tokens (FCM) for the Flutter app.
--
-- The existing public.push_subscriptions table is Web Push only: its
-- endpoint / p256dh / auth columns are NOT NULL and describe a browser
-- PushSubscription. An FCM registration token is a single opaque string with
-- no key material, so it cannot live in that table without faking columns.
-- This table is the mobile counterpart.
--
-- One row per device. A token is globally unique: FCM can reissue the same
-- token to a reinstalled app, and a token must never be delivered to two
-- different users, so `token` is the conflict target for upserts.

CREATE TABLE IF NOT EXISTS public.mobile_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'unknown'
    CHECK (platform IN ('android', 'ios', 'web', 'unknown')),
  app_version text,
  device_label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT mobile_push_tokens_token_key UNIQUE (token)
);

-- Delivery queries always filter on is_active and group by user, so a partial
-- index keeps the hot path small even as stale tokens accumulate.
CREATE INDEX IF NOT EXISTS mobile_push_tokens_active_user_idx
  ON public.mobile_push_tokens (user_id)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS mobile_push_tokens_active_idx
  ON public.mobile_push_tokens (is_active)
  WHERE is_active;

COMMENT ON TABLE public.mobile_push_tokens IS
  'FCM registration tokens for the Whispr Flutter app. One row per device; token is unique and is the upsert conflict target.';
COMMENT ON COLUMN public.mobile_push_tokens.token IS
  'FCM registration token from FirebaseMessaging.instance.getToken(). Rotates; the app re-registers on refresh.';
COMMENT ON COLUMN public.mobile_push_tokens.is_active IS
  'Set false when FCM reports the token as unregistered/invalid, or when the user signs out.';

-- RLS: the API writes with the service role (which bypasses RLS), but a user
-- should still only ever be able to read or delete their own devices if the
-- anon key is ever used directly.
ALTER TABLE public.mobile_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own push tokens"
  ON public.mobile_push_tokens;
CREATE POLICY "Users can view their own push tokens"
  ON public.mobile_push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own push tokens"
  ON public.mobile_push_tokens;
CREATE POLICY "Users can delete their own push tokens"
  ON public.mobile_push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);
