import { NextRequest, NextResponse } from 'next/server';
import { requireAuthFromRequest } from '@/lib/auth-server';
import { sendEmailReply } from '@/lib/email-imap-service';

export async function POST(request: NextRequest) {
  try {
    await requireAuthFromRequest(request);
    
    const body = await request.json();
    const { to, subject, body: emailBody, inReplyTo } = body;

    await sendEmailReply(to, subject, emailBody, inReplyTo);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email reply:', error);
    return NextResponse.json(
      { error: 'Failed to send email reply' },
      { status: 500 }
    );
  }
}
