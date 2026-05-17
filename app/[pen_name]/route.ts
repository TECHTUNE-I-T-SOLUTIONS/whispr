import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ pen_name: string }> }) {
  // legacy root-level profile route, redirect to new the portfolio location
  const { pen_name } = await params;
  return NextResponse.redirect(new URL(`/chronicles/portfolio/${encodeURIComponent(pen_name)}`, request.url), 307);
}
