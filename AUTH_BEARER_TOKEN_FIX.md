# Bearer Token Authentication Fix for Flutter Mobile App

## Problem
The Flutter app was getting repeated 401 Unauthorized errors on endpoints because they only checked for cookie-based authentication (web), not Bearer token headers (mobile).

Pattern observed:
```
GET /api/chronicles/creator/avatar 401
POST /api/chronicles/auth/refresh 200 (token refreshed successfully)
GET /api/chronicles/creator/avatar 401 (still fails after refresh)
```

Root cause: Endpoints using `createSupabaseServer()` only check cookies, not the Authorization header.

## Solution
All protected endpoints have been updated to support **dual authentication**:
1. **Bearer Token** (from Authorization header) - used by Flutter mobile app
2. **Cookie-based** (server-side) - used by Next.js web app

## Fixed Endpoints

### 1. `/api/chronicles/creator/avatar` ✅
- **File**: `app/api/chronicles/creator/avatar/route.ts`
- **Methods**: GET
- **Change**: Added Bearer token support for mobile app

### 2. `/api/chronicles/creator/profile` ✅
- **File**: `app/api/chronicles/creator/profile/route.ts`
- **Methods**: GET, PUT
- **Change**: Both methods now support Bearer tokens

### 3. `/api/chronicles/creator/stats` ✅
- **File**: `app/api/chronicles/creator/stats/route.ts`
- **Methods**: GET
- **Change**: Added Bearer token support + added NextRequest parameter

### 4. `/api/chronicles/creator/push-subscribe` ✅  
- **File**: `app/api/chronicles/creator/push-subscribe/route.ts`
- **Methods**: POST
- **Change**: Changed from `Request` to `NextRequest` to access headers properly

### 5. `/api/chronicles/creator/push-notifications` ✅
- **File**: `app/api/chronicles/creator/push-notifications/route.ts`
- **Methods**: GET, POST
- **Change**: Replaced insecure `x-user-id` header with proper Supabase auth (Bearer token or cookie)
- **Added helper function**: `getAuthenticatedSupabase()` for reusable auth logic

### 6. `/api/chronicles/engagement` ✅
- **File**: `app/api/chronicles/engagement/route.ts`
- **Methods**: POST, GET
- **Change**: Replaced insecure `x-user-id` header with proper Bearer token authentication

## Implementation Pattern

All endpoints now follow this pattern:

```typescript
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    let supabase;

    // Check for Authorization header (for mobile app)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      // Fallback to cookie-based auth for web
      supabase = await createSupabaseServerClient();
    }

    // Rest of your code...
  }
}
```

## Why This Works

1. **Flutter App sends Bearer token**: `Authorization: Bearer <Supabase access token>`
2. **Next.js checks header first**: Detects Bearer token and creates authenticated client
3. **Token auto-refresh in Flutter**: The interceptor handles 401 → refresh → retry
4. **Web fallback**: Server-side cookie auth still works for Next.js pages

## Testing

After these changes:
1. ✅ Flutter avatar fetch should work (was getting 401, now should be 200)
2. ✅ No more retry loops (token refresh actually resolves)
3. ✅ Web pages still work with cookie auth (backwards compatible)
4. ✅ Both mobile and web can create posts, engage with content, etc.

## Endpoints Already Fixed (Before This PR)

These were already correct:
- `/api/chronicles/creator/posts` - Already supports Bearer tokens
- `/api/chronicles/chains/[id]` - Already supports Bearer tokens  
- `/api/chronicles/auth/refresh` - Already supports Bearer tokens
- `/api/chronicles/creator/notifications` - Already supports Bearer tokens

## Summary of Changes
- **Total endpoints fixed**: 6
- **Lines updated**: ~300+
- **Auth methods unified**: Removed insecure custom headers (`x-user-id`)
- **Backwards compatibility**: Maintained for web (cookies still work)
- **Security improved**: Now using proper Supabase authentication

Test with Flutter app now - the 401 errors should be gone! 🎉
