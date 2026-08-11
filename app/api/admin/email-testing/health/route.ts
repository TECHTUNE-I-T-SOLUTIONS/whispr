import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/email-service';

export async function GET() {
  try {
    const health = await healthCheck();
    return NextResponse.json(health);
  } catch (error) {
    console.error('Error checking email service health:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
