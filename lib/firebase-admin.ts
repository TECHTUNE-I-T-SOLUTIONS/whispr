import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

/**
 * Firebase Admin SDK bootstrap for sending FCM pushes to the Whispr Flutter app.
 *
 * The credential is a service-account JSON, supplied base64-encoded in
 * FIREBASE_SERVICE_ACCOUNT_BASE64 so the private key's newlines survive as a
 * single env line. A raw JSON string in FIREBASE_SERVICE_ACCOUNT_JSON is also
 * accepted for environments that can hold multi-line values.
 *
 * Everything is lazy and memoised: importing this module must never throw, or
 * every route that transitively imports it would fail at build time on a
 * machine without credentials (CI, preview deploys, local dev).
 */

let cachedApp: App | null = null;
let cachedMessaging: Messaging | null = null;
let initError: string | null = null;

function readServiceAccount(): Record<string, unknown> | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (b64) {
    try {
      const json = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(json);
    } catch (error) {
      initError = `FIREBASE_SERVICE_ACCOUNT_BASE64 is not valid base64 JSON: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return null;
    }
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      initError = `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return null;
    }
  }

  initError =
    'No Firebase service account configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64 (preferred) or FIREBASE_SERVICE_ACCOUNT_JSON.';
  return null;
}

/**
 * Returns the Admin app, or null when credentials are absent/invalid.
 * Callers should treat null as "mobile push unavailable" and carry on — web
 * push must keep working even if FCM is not configured.
 */
export function getFirebaseApp(): App | null {
  if (cachedApp) return cachedApp;

  // Next.js dev server re-evaluates modules on hot reload; reuse any app the
  // SDK already registered so we do not throw "app already exists".
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const serviceAccount = readServiceAccount();
  if (!serviceAccount) return null;

  try {
    cachedApp = initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      projectId:
        (serviceAccount.project_id as string | undefined) ||
        process.env.FIREBASE_PROJECT_ID ||
        undefined,
    });
    return cachedApp;
  } catch (error) {
    initError = `Failed to initialise Firebase Admin: ${
      error instanceof Error ? error.message : String(error)
    }`;
    return null;
  }
}

/** Returns the Messaging client, or null when FCM is not configured. */
export function getFirebaseMessaging(): Messaging | null {
  if (cachedMessaging) return cachedMessaging;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    cachedMessaging = getMessaging(app);
    return cachedMessaging;
  } catch (error) {
    initError = `Failed to get Firebase Messaging: ${
      error instanceof Error ? error.message : String(error)
    }`;
    return null;
  }
}

/** True when FCM can actually send. Cheap to call; no network. */
export function isMobilePushConfigured(): boolean {
  return getFirebaseMessaging() !== null;
}

/** Human-readable reason FCM is unavailable, for logs and health checks. */
export function getMobilePushConfigError(): string | null {
  if (isMobilePushConfigured()) return null;
  return initError;
}
