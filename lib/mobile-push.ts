import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getFirebaseMessaging, getMobilePushConfigError } from '@/lib/firebase-admin';

/**
 * Mobile (FCM) push service for the Whispr Flutter app.
 *
 * Kept separate from lib/push-notifications.ts, which is Web Push (VAPID +
 * a browser PushSubscription). The two transports share a payload shape but
 * not a delivery mechanism, and mixing them in one function made it hard to
 * tell which one had failed.
 *
 * Everything here is best-effort: a mobile delivery failure must never break
 * the web push path or the request that triggered it.
 */

const TABLE = 'mobile_push_tokens';

/** FCM's hard limit for sendEachForMulticast is 500 recipients per call. */
const FCM_BATCH_SIZE = 500;

export type MobilePlatform = 'android' | 'ios' | 'web' | 'unknown';

export interface MobilePushPayload {
  title: string;
  body: string;
  /** `whispr://` URI. The app's NotificationRouter only accepts this scheme. */
  link?: string;
  /** Mirrors the web payload's `type`, for analytics/filtering. */
  type?: string;
  image?: string;
  /** Extra string→string pairs merged into the FCM data block. */
  data?: Record<string, string>;
}

export interface MobilePushResult {
  success: boolean;
  /** Tokens FCM accepted. */
  sent: number;
  /** Tokens FCM rejected. */
  failed: number;
  /** Tokens deactivated because FCM said they are dead. */
  pruned: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Supabase access
// ---------------------------------------------------------------------------

/**
 * The service-role client is stateless, and a new one per call re-creates the
 * fetch/auth plumbing every time. Memoise it so the hot delivery path does one
 * client construction per process rather than one per notification.
 */
let cachedClient: SupabaseClient | null = null;
let cachedClientSignature = '';

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Bail out if either changed (dev server reload with new env).
  const signature = `${url ?? ''}|${key ? key.slice(-8) : ''}`;
  if (cachedClient && cachedClientSignature === signature) return cachedClient;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  cachedClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  cachedClientSignature = signature;
  return cachedClient!;
}

// ---------------------------------------------------------------------------
// Token registration
// ---------------------------------------------------------------------------

export interface RegisterTokenInput {
  userId: string;
  token: string;
  platform?: MobilePlatform;
  appVersion?: string;
  deviceLabel?: string;
}

/**
 * Upsert a device token.
 *
 * `token` is the conflict target, not (user_id, token): FCM can hand the same
 * token to a reinstalled app, and if a different account signs in on that
 * device the row must move to the new user rather than leaving a duplicate
 * that would deliver the new user's notifications to the old one.
 */
export async function registerMobileToken(input: RegisterTokenInput) {
  const token = input.token?.trim();
  if (!token) {
    return { success: false as const, error: 'token is required' };
  }
  if (!input.userId) {
    return { success: false as const, error: 'userId is required' };
  }

  const platform: MobilePlatform = input.platform ?? 'unknown';

  try {
    const supabase = getClient();
    const now = new Date().toISOString();

    const { error } = await supabase.from(TABLE).upsert(
      {
        user_id: input.userId,
        token,
        platform,
        app_version: input.appVersion ?? null,
        device_label: input.deviceLabel ?? null,
        is_active: true,
        last_seen_at: now,
        updated_at: now,
      },
      { onConflict: 'token' },
    );

    if (error) {
      console.error('[mobile-push] register failed:', error);
      return { success: false as const, error: error.message };
    }

    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mobile-push] register threw:', message);
    return { success: false as const, error: message };
  }
}

/** Deactivate one device (sign-out, or FCM says the token is dead). */
export async function deactivateMobileToken(token: string) {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from(TABLE)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('token', token.trim());

    if (error) {
      console.error('[mobile-push] deactivate failed:', error);
      return { success: false as const, error: error.message };
    }
    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false as const, error: message };
  }
}

/** Deactivate every device for a user (sign-out-everywhere, password change). */
export async function deactivateAllMobileTokensForUser(userId: string) {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from(TABLE)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('[mobile-push] deactivate-all failed:', error);
      return { success: false as const, error: error.message };
    }
    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false as const, error: message };
  }
}

/** Count of live devices for a user. Used by the settings screen. */
export async function countActiveMobileTokens(userId: string): Promise<number> {
  try {
    const supabase = getClient();
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

function buildMessage(
  token: string,
  payload: MobilePushPayload,
): {
  token: string;
  notification: { title: string; body: string; imageUrl?: string };
  data: Record<string, string>;
  android: {
    priority: 'high';
    notification: {
      channelId: string;
      color: string;
      defaultSound: boolean;
      tag?: string;
    };
  };
  apns: {
    payload: { aps: { sound: string; badge?: number; 'mutable-content'?: number } };
    fcmOptions?: { imageUrl?: string };
  };
} {
  // FCM data values must all be strings; a non-string silently fails the send.
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload.data ?? {})) {
    if (value !== undefined && value !== null) data[key] = String(value);
  }
  if (payload.link) {
    data.link = payload.link;
    // The Flutter app falls back to `payload` if `link` is absent; send both
    // so older builds still route correctly.
    data.payload = payload.link;
  }
  if (payload.type) data.type = payload.type;
  if (payload.image) {
    data.image = payload.image;
    data.imageUrl = payload.image;
  }

  return {
    token,
    notification: {
      title: payload.title,
      body: payload.body,
      ...(payload.image ? { imageUrl: payload.image } : {}),
    },
    data,
    android: {
      priority: 'high',
      notification: {
        // Must match the channel the Flutter app creates
        // (AndroidNotificationDetails('whispr_channel', ...)). A channelId
        // that does not exist yet falls back to a default channel, which is
        // why the app creates this one at startup.
        channelId: 'whispr_channel',
        color: '#C00000',
        defaultSound: true,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          'mutable-content': 1,
        },
      },
      ...(payload.image ? { fcmOptions: { imageUrl: payload.image } } : {}),
    },
  };
}

/**
 * Codes FCM returns for tokens that will never work again. Marking these
 * inactive immediately keeps the delivery table from growing forever.
 */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

async function sendToTokens(
  tokens: string[],
  payload: MobilePushPayload,
): Promise<MobilePushResult> {
  if (tokens.length === 0) {
    return { success: true, sent: 0, failed: 0, pruned: 0 };
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return {
      success: false,
      sent: 0,
      failed: tokens.length,
      pruned: 0,
      error: getMobilePushConfigError() ?? 'Firebase Admin is not configured',
    };
  }

  let sent = 0;
  let failed = 0;
  const dead: string[] = [];

  for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
    const batch = tokens.slice(i, i + FCM_BATCH_SIZE);
    try {
      const response = await messaging.sendEach(
        batch.map((token) => buildMessage(token, payload)),
      );

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((result, index) => {
        if (result.success) return;
        const code = result.error?.code ?? '';
        if (DEAD_TOKEN_CODES.has(code)) dead.push(batch[index]);
      });
    } catch (error) {
      // A throw here is transport-level (bad credentials, project mismatch),
      // not per-token, so count the whole batch as failed and stop retrying.
      console.error('[mobile-push] FCM batch threw:', error);
      failed += batch.length;
      break;
    }
  }

  let pruned = 0;
  if (dead.length > 0) {
    try {
      const supabase = getClient();
      const { error } = await supabase
        .from(TABLE)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('token', dead);
      if (!error) pruned = dead.length;
    } catch (error) {
      console.error('[mobile-push] prune failed:', error);
    }
  }

  return { success: failed === 0, sent, failed, pruned };
}

/** Deliver to a single user's devices. */
export async function sendMobilePushToUser(
  userId: string,
  payload: MobilePushPayload,
): Promise<MobilePushResult> {
  return sendMobilePushToUsers([userId], payload);
}

/**
 * Deliver to several users in one Supabase round-trip. Prefer this over a
 * loop of sendMobilePushToUser — one query beats N.
 */
export async function sendMobilePushToUsers(
  userIds: string[],
  payload: MobilePushPayload,
): Promise<MobilePushResult> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { success: true, sent: 0, failed: 0, pruned: 0 };
  }

  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select('token')
      .in('user_id', uniqueIds)
      .eq('is_active', true);

    if (error) {
      console.error('[mobile-push] token lookup failed:', error);
      return {
        success: false,
        sent: 0,
        failed: 0,
        pruned: 0,
        error: error.message,
      };
    }

    const tokens = [...new Set((data ?? []).map((row) => row.token as string))];
    return sendToTokens(tokens, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mobile-push] send to users threw:', message);
    return { success: false, sent: 0, failed: 0, pruned: 0, error: message };
  }
}

/** Deliver to every active device. For broadcast announcements only. */
export async function sendMobilePushToAll(
  payload: MobilePushPayload,
): Promise<MobilePushResult> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select('token')
      .eq('is_active', true);

    if (error) {
      console.error('[mobile-push] broadcast lookup failed:', error);
      return {
        success: false,
        sent: 0,
        failed: 0,
        pruned: 0,
        error: error.message,
      };
    }

    const tokens = [...new Set((data ?? []).map((row) => row.token as string))];
    return sendToTokens(tokens, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mobile-push] broadcast threw:', message);
    return { success: false, sent: 0, failed: 0, pruned: 0, error: message };
  }
}

/**
 * Fan a web-push payload out to mobile as well. Called from the existing web
 * push helpers so a single call reaches browsers and phones.
 */
export async function sendMobilePushMirroringWeb(
  notificationData: {
    title: string;
    body: string;
    url?: string;
    image?: string;
    type?: string;
  },
): Promise<MobilePushResult> {
  const link = toWhisprDeepLink(notificationData.url);
  return sendMobilePushToAll({
    title: notificationData.title,
    body: notificationData.body,
    image: notificationData.image,
    type: notificationData.type,
    link,
  });
}

/**
 * Web urls are absolute or app-relative paths like `/chronicles/x`. The
 * Flutter NotificationRouter only understands `whispr://`, so translate.
 */
export function toWhisprDeepLink(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('whispr://')) return url;

  let path = url;
  try {
    if (/^https?:\/\//i.test(url)) path = new URL(url).pathname;
  } catch {
    // Leave as-is; the router will ignore it rather than crash.
  }

  const clean = path.replace(/^\/+/, '');
  return clean ? `whispr://${clean}` : 'whispr://home';
}
