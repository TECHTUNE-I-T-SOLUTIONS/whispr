import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase-server-client';

/**
 * A Supabase client that authenticates the *caller of this request*.
 *
 * The web app signs in with cookies, but the mobile app signs in through
 * `/api/chronicles/auth/login` and sends the resulting JWT as
 * `Authorization: Bearer <token>`. Routes that only called
 * `createSupabaseServerClient()` therefore saw no user at all from the app and
 * answered 401 — which is why the creator studio reported "no stories" for a
 * creator who had stories.
 *
 * Always use this in a route handler instead of `createSupabaseServerClient()`
 * so the same endpoint serves both clients.
 */
export async function createSupabaseRequestClient(
  request: NextRequest,
): Promise<SupabaseClient> {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        },
      );
    }
  }

  return createSupabaseServerClient();
}
