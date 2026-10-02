import { NextRequest, NextResponse } from 'next/server';
import { requireAuthFromRequest } from '@/lib/auth-server';
import { fetchFolderCounts } from '@/lib/email-sync-service';

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request);
    
    const folders = await fetchFolderCounts();

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error fetching email folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email folders' },
      { status: 500 }
    );
  }
}
