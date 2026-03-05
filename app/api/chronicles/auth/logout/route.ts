import { NextResponse, NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server-client';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client to sign out
    const supabase = await createSupabaseServerClient();

    // Sign out - this invalidates the session on Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json({ error: 'Failed to logout' }, { status: 400 });
    }

    // Create response
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Explicitly clear Supabase session cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    // Also clear any other auth-related cookies
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');

    // Set cache-control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    console.log('User logged out successfully');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
