import { NextRequest, NextResponse } from 'next/server';
import { getUserFromBearer } from '@/lib/auth-server';
import {
  countActiveMobileTokens,
  deactivateAllMobileTokensForUser,
  deactivateMobileToken,
  registerMobileToken,
  type MobilePlatform,
} from '@/lib/mobile-push';
import { getMobilePushConfigError, isMobilePushConfigured } from '@/lib/firebase-admin';

/**
 * FCM device-token registration for the Whispr Flutter app.
 *
 * The app calls this on launch, on token refresh, and after sign-in
 * (lib/core/services/push_notification_service.dart). Auth is a Supabase
 * bearer token, not the admin cookie — the app has no cookie jar.
 */

const VALID_PLATFORMS: MobilePlatform[] = ['android', 'ios', 'web', 'unknown'];

function normalisePlatform(value: unknown): MobilePlatform {
  return typeof value === 'string' && VALID_PLATFORMS.includes(value as MobilePlatform)
    ? (value as MobilePlatform)
    : 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const result = await registerMobileToken({
      userId: user.id,
      token,
      platform: normalisePlatform(body.platform),
      appVersion: typeof body.appVersion === 'string' ? body.appVersion : undefined,
      deviceLabel: typeof body.deviceLabel === 'string' ? body.deviceLabel : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to register token', details: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      // Surfaced so the app can log why pushes will not arrive, instead of
      // silently registering a token nothing will ever send to.
      pushConfigured: isMobilePushConfigured(),
      ...(isMobilePushConfigured() ? {} : { warning: getMobilePushConfigError() }),
    });
  } catch (error) {
    console.error('Error in POST /api/push/fcm-token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Unregister. With a `token` in the body only that device is deactivated;
 * without one, every device for the user is (sign-out-everywhere).
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // An empty body is valid here: it means "all my devices".
    }

    const token = typeof body.token === 'string' ? body.token.trim() : '';

    const result = token
      ? await deactivateMobileToken(token)
      : await deactivateAllMobileTokensForUser(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to unregister token', details: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, scope: token ? 'device' : 'all' });
  } catch (error) {
    console.error('Error in DELETE /api/push/fcm-token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Diagnostics: how many devices this user has, and whether FCM can send. */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      devices: await countActiveMobileTokens(user.id),
      pushConfigured: isMobilePushConfigured(),
      ...(isMobilePushConfigured() ? {} : { warning: getMobilePushConfigError() }),
    });
  } catch (error) {
    console.error('Error in GET /api/push/fcm-token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
