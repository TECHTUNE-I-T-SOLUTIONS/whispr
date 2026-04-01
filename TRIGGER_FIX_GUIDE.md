# How to Fix the chronicles_posts Trigger Error

## Problem Summary
Error: `record "new" has no field "creator_id"` (PostgreSQL error code 42703)  
This occurs when publishing AI-generated content via the `/api/chronicles/creator/posts` endpoint.

## Root Cause
One or more of the AFTER INSERT triggers on the `chronicles_posts` table is malformed or has access to fields it shouldn't. Even though the table has the `creator_id` column, a trigger function is trying to access it in a way that causes this error.

## Solution

### Option 1: Complete Fix (Recommended)
This script drops and recreates **all** triggers safely:

```bash
# Copy the contents of this file:
d:\Codes\whispr\scripts\018-complete-trigger-fix.sql

# Then run it in your Supabase SQL Editor:
# 1. Go to https://app.supabase.com
# 2. Navigate to your project → SQL Editor
# 3. Create a new query
# 4. Paste the entire contents of 018-complete-trigger-fix.sql
# 5. Click "Run" (or press Ctrl+Enter)
```

This script will:
- ✅ Disable all triggers temporarily
- ✅ Test if INSERT works without triggers (to confirm triggers are the issue)
- ✅ Drop all existing triggers
- ✅ Recreate them in the correct order
- ✅ Run a test insert to verify it works
- ✅ Show a summary of all triggers

### Option 2: Step-by-Step Diagnosis
If you want to identify exactly which trigger is causing the problem:

```bash
# Run this first:
d:\Codes\whispr\scripts\017-detailed-diagnostics-clean.sql

# Then run this to identify the specific problematic trigger:
d:\Codes\whispr\scripts\015-diagnostic-triggers.sql
```

### Option 3: Minimal Fix (If option 1 is too aggressive)
This script only fixes INSERT triggers:

```bash
d:\Codes\whispr\scripts\016-critical-fix-triggers.sql
```

## After Running the Fix

1. **Test the mobile app**: Try publishing another AI-generated post
2. **Check backend logs**: Should see successful insert without the 42703 error
3. **Verify data**: Post should appear in the database with all fields

## If It Still Fails

If you still get the error after running these scripts, the issue could be:

1. **RLS (Row Level Security) Policy**: Even with service role, RLS might still block it
   - Run: `ALTER TABLE public.chronicles_posts DISABLE ROW LEVEL SECURITY;`
   - Then test again
   - If it works, we need to fix the RLS policy instead

2. **Foreign Key Issue**: `creator_id` references don't exist
   - Verify the creator exists: `SELECT id FROM public.chronicles_creators WHERE user_id = 'YOUR_USER_ID';`
   - Ensure it matches what the backend is sending

3. **Environment Variables**: Service role key not actually set
   - Verify in your `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=<key>`
   - Restart the dev server

## Testing Locally (Before Publishing)

You can test the fix directly in Supabase SQL Editor:

```sql
-- This mimics what your mobile app is doing
INSERT INTO public.chronicles_posts (
  creator_id,
  title,
  slug,
  content,
  post_type,
  status,
  category,
  excerpt,
  tags,
  cover_image_url,
  formatting_data,
  published_at
) VALUES (
  '7c6c58dc-de3c-4faf-afe3-517749efa5cc', -- Your creator ID
  'Test Chronicle',
  'test-chronicle-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'This is test content...',
  'poem',
  'published',
  'AI Generated',
  'Test excerpt here...',
  ARRAY['test', 'tag'],
  NULL,
  '{}',
  NOW()
);
```

If this succeeds, the triggers are fixed and your mobile app should work.

## Files Created

1. **018-complete-trigger-fix.sql** ← **USE THIS ONE FIRST**
2. 016-critical-fix-triggers.sql (just INSERT triggers)
3. 015-fix-chronicles-posts-triggers.sql (recreates in order)
4. 017-detailed-diagnostics-clean.sql (diagnostic only)
5. 015-diagnostic-triggers.sql (step-by-step isolation test)

## Next Steps

1. Run `018-complete-trigger-fix.sql` in Supabase SQL Editor
2. Test publishing from mobile app
3. If still failing, run `017-detailed-diagnostics-clean.sql` to identify the specific trigger
4. Post the error output so we can fix that specific trigger function

