import { NextRequest, NextResponse } from 'next/server';
import { requireAuthFromRequest } from '@/lib/auth-server';
import { fetchEmailsFromDatabase } from '@/lib/email-sync-service';

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request);
    
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'INBOX';
    const limit = parseInt(searchParams.get('limit') || '20');

    const emails = await fetchEmailsFromDatabase(folder, limit);

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
