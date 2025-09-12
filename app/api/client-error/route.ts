import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    console.error('Client-side error reported:', JSON.stringify(body))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Failed to record client error', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
