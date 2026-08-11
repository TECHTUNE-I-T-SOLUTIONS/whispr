import { NextResponse } from 'next/server';
import { sendEmailSync, EmailType } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json(
        { error: 'Email type and recipient are required' },
        { status: 400 }
      );
    }

    // Validate email type
    if (!Object.values(EmailType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }

    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send email synchronously for testing (we want to wait for the result)
    const result = await sendEmailSync({
      type: type as EmailType,
      to,
      data: data || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in email testing API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
