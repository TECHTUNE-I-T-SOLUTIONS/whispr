import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server-client';

// Protected routes that require authentication
const protectedRoutes = [
  '/chronicles/dashboard',
  '/chronicles/write',
  '/chronicles/analytics',
  '/chronicles/settings',
  '/chronicles/posts',
  '/chronicles/chains',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    path.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Create Supabase client to check session
    const supabase = await createSupabaseServerClient();
    
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();

    // If no session or error, redirect to login
    if (error || !session) {
      console.log(`[Auth] No session for ${path}, redirecting to login`);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Session exists, allow request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Auth check error:', error);
    // On error, redirect to login for safety
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    // Protected Chronicles routes
    '/chronicles/dashboard',
    '/chronicles/write',
    '/chronicles/analytics',
    '/chronicles/settings',
    '/chronicles/posts',
    '/chronicles/chains',
    // Include all sub-routes
    '/chronicles/dashboard/:path*',
    '/chronicles/write/:path*',
    '/chronicles/analytics/:path*',
    '/chronicles/settings/:path*',
    '/chronicles/posts/:path*',
    '/chronicles/chains/:path*',
  ],
};
