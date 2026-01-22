# Fix for Chronicles Signup RLS and Program ID Issues

## Problem Summary
The signup endpoint was failing with two RLS (Row Level Security) errors:
1. `chronicles_programs` table had RLS enabled but no policies defined
2. `chronicles_creators` table required `program_id` but we're not creating programs during signup
3. Storage bucket for profile images also had RLS preventing uploads

## Solution

### Step 1: Update Database Schema (CRITICAL)
Run this SQL in Supabase SQL Editor:

```sql
-- Make program_id optional in chronicles_creators
ALTER TABLE chronicles_creators
ALTER COLUMN program_id DROP NOT NULL;

-- Drop and re-add foreign key constraint to allow NULL values
ALTER TABLE chronicles_creators
DROP CONSTRAINT IF EXISTS chronicles_creators_program_id_fkey;

ALTER TABLE chronicles_creators
ADD CONSTRAINT chronicles_creators_program_id_fkey 
FOREIGN KEY (program_id) 
REFERENCES chronicles_programs(id) 
ON DELETE CASCADE;

-- Disable RLS on chronicles_programs to allow service role access
ALTER TABLE chronicles_programs DISABLE ROW LEVEL SECURITY;
```

### Step 2: Verify Storage Configuration
In Supabase Dashboard:
1. Go to Storage → Buckets
2. Find "chronicles-profiles" bucket
3. Ensure RLS is DISABLED or has proper policies
4. Policies should allow:
   - Authenticated users to upload
   - Service role to upload

### Step 3: Code Changes Already Applied ✅
- ✅ Signup endpoint updated to NOT require program_id
- ✅ Profile image upload error handling improved
- ✅ Program creation removed from signup flow
- ✅ Storage errors are handled gracefully (continue without image)

## Testing

After running the SQL migration:

1. **Test Signup:**
   ```
   POST /api/chronicles/auth/signup
   {
     "email": "test@example.com",
     "password": "password123",
     "penName": "TestWriter",
     "displayName": "Test Writer",
     ...
   }
   ```

2. **Expected Response:**
   - ✅ 200 Success (not 500)
   - ✅ Creator profile created
   - ✅ Auth user created
   - ✅ Optional: Profile image uploaded

3. **Verify in Database:**
   ```sql
   SELECT id, email, pen_name, program_id FROM chronicles_creators 
   WHERE pen_name = 'TestWriter';
   ```
   - Should show: program_id is NULL (that's OK!)

## Files Modified

1. `/app/api/chronicles/auth/signup/route.ts` - Removed program creation logic
2. `/scripts/013-fix-chronicles-creators-program-optional.sql` - Migration script

## Next Steps

If you still get RLS errors after running the SQL:

1. **Check Storage RLS:**
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'chronicles-profiles';
   ```

2. **Check Table RLS:**
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' AND tablename LIKE 'chronicles%';
   ```

3. **Disable all RLS temporarily (for development):**
   ```sql
   ALTER TABLE chronicles_creators DISABLE ROW LEVEL SECURITY;
   ALTER TABLE chronicles_programs DISABLE ROW LEVEL SECURITY;
   -- Add other tables as needed
   ```

## Production Considerations

For production, instead of disabling RLS completely, implement proper policies:

```sql
-- Allow service role to do everything
CREATE POLICY "Service role unrestricted"
  ON chronicles_creators
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow creators to view/update their own profile
CREATE POLICY "Creators can view own profile"
  ON chronicles_creators
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Creators can update own profile"
  ON chronicles_creators
  FOR UPDATE
  USING (user_id = auth.uid());
```

## Quick Fix Summary

**Run this SQL NOW to fix the immediate issue:**

```sql
ALTER TABLE chronicles_creators ALTER COLUMN program_id DROP NOT NULL;
ALTER TABLE chronicles_creators DROP CONSTRAINT IF EXISTS chronicles_creators_program_id_fkey;
ALTER TABLE chronicles_creators ADD CONSTRAINT chronicles_creators_program_id_fkey FOREIGN KEY (program_id) REFERENCES chronicles_programs(id) ON DELETE CASCADE;
ALTER TABLE chronicles_programs DISABLE ROW LEVEL SECURITY;
```

Then test the signup flow again!
