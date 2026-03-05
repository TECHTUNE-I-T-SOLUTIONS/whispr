import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: { pen_name: string } }) {
  // legacy root-level profile route, redirect to new the portfolio location
  const { pen_name } = params;
  return NextResponse.redirect(`/chronicles/portfolio/${encodeURIComponent(pen_name)}`, 307);
}
