import { NextRequest, NextResponse } from 'next/server';

/**
 * Mobile link resolver.
 *
 * Share links from the app point at the web (`https://www.whisprwords.com/...`).
 * On a phone that should open the app when it is installed and the web page
 * otherwise. Android's verified App Links already cover the canonical web
 * paths; this route handles the short `/r/<type>/<id>` form and any path the
 * intent filters miss, by delegating to `/api/deeplink`, which knows how to
 * build the `whispr://app/...` URL and render a fallback page.
 */
const ALLOWED_TYPES = new Set([
  'chronicles',
  'post',
  'stories',
  'story',
  'creator',
  'portfolio',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;

  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const target = new URL('/api/deeplink', request.url);
  target.searchParams.set('type', type);
  target.searchParams.set('id', id);

  return NextResponse.redirect(target);
}
