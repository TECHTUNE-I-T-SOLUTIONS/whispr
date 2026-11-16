import { NextResponse } from 'next/server';

/**
 * Android App Links verification.
 *
 * Serves `/.well-known/assetlinks.json` so Android can verify that
 * com.whisprwords.app is allowed to open https://www.whisprwords.com links
 * directly instead of the browser.
 *
 * The signing certificate changes with the key used to build the APK, so the
 * fingerprints are configuration, not code: set ANDROID_APP_LINK_SHA256 to a
 * comma-separated list of SHA-256 fingerprints (upload key and, once the app
 * is on Play, the Play App Signing key — Android checks every listed value).
 */
const PACKAGE_NAME = 'com.whisprwords.app';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function GET() {
  const fingerprints = (process.env.ANDROID_APP_LINK_SHA256 || '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  if (fingerprints.length === 0) {
    return NextResponse.json([], {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
