# RLS Policy Fix for Chain Notifications Trigger

## Problem

When creating a chain, the system was throwing this error:
```
code: '42501'
message: 'new row violates row-level security policy for table "chronicles_notifications"'
```

## Root Cause

1. The `chronicles_notifications` table has **RLS (Row-Level Security) enabled**
2. When a chain is created, a **trigger** attempts to insert a notification record
3. Triggers execute with **limited permissions** (not as authenticated user)
4. Without proper RLS policies or elevated privileges, the trigger insert gets **blocked**

## Solution

Modified two trigger functions to use **SECURITY DEFINER**:

### What SECURITY DEFINER Does:
- Runs the trigger function with the **schema owner's permissions** (elevated)
- Bypasses RLS restrictions that apply to regular users
- Common pattern for notification/audit triggers in PostgreSQL

### Fixed Triggers:

1. **`handle_chain_created()`**
   - Runs when: Chain is created
   - Original issue: Failed to insert notification record
   - Fixed by: Added `SECURITY DEFINER` clause

2. **`handle_chain_entry_post_created()`**  
   - Runs when: Chain entry post is created
   - Original issue: Failed to insert notification records
   - Fixed by: Added `SECURITY DEFINER` clause

## How to Apply

### Via Supabase Dashboard:
1. Go to **SQL Editor** in Supabase
2. Create a new query
3. Copy content from: `scripts/028-fix-notification-triggers-rls.sql`
4. Run the query
5. Test: Create a new chain - should work without RLS errors

### Via Command Line:
```bash
psql postgresql://[user]:[password]@[host]/[database] < scripts/028-fix-notification-triggers-rls.sql
```

## Verification

After running the migration, test by:
1. Create a new chain - should succeed
2. Check `chronicles_notifications` table - should have a new 'chain_created' notification
3. Share button and comments should also work

## Technical Details

**Before:**
```sql
CREATE OR REPLACE FUNCTION public.handle_chain_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger code - runs with limited permissions
  -- RLS blocks insert into chronicles_notifications
END;
```

**After:**
```sql
CREATE OR REPLACE FUNCTION public.handle_chain_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- ← THIS IS THE FIX
SET search_path = public
AS $$
BEGIN
  -- Trigger code - runs with elevated permissions
  -- RLS doesn't block this anymore
END;
$$;
```

## Security Impact

- ✅ Safe: Specific functions only, not all database operations
- ✅ Controlled: Only affects notification triggers
- ✅ Necessary: Required for automated background operations
- ✅ Standard: Common practice in PostgreSQL systems
