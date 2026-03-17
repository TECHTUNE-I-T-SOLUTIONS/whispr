# Fix RLS Policy for chronicles_posts

## Problem
You're getting error `42501: 'new row violates row-level security policy for table "chronicles_posts"'`

This is because the RLS policy is incorrectly checking if `creator_id = auth.uid()`, but:
- `creator_id` is a UUID pointing to `chronicles_creators.id` 
- `auth.uid()` is a UUID pointing to `auth.users.id`
- They are NOT the same - the creator_id should reference the user's creator profile

## Solution: Run this SQL in Supabase SQL Editor

### Step 1: Disable existing problematic policies
```sql
-- Disable all existing policies on chronicles_posts
DROP POLICY IF EXISTS "Users can insert their own posts" ON chronicles_posts;
DROP POLICY IF EXISTS "Users can view published posts" ON chronicles_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON chronicles_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON chronicles_posts;
```

### Step 2: Enable RLS on chronicles_posts (if not already enabled)
```sql
ALTER TABLE chronicles_posts ENABLE ROW LEVEL SECURITY;
```

### Step 3: Create correct policies
```sql
-- Policy: Users can INSERT posts where they are the creator
CREATE POLICY "Users can insert their own posts" ON chronicles_posts
  FOR INSERT
  WITH CHECK (
    creator_id = (
      SELECT id FROM chronicles_creators 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Anyone can SELECT published posts
CREATE POLICY "Anyone can view published posts" ON chronicles_posts
  FOR SELECT
  USING (status = 'published' OR creator_id = (
    SELECT id FROM chronicles_creators 
    WHERE user_id = auth.uid()
  ));

-- Policy: Users can UPDATE their own posts
CREATE POLICY "Users can update their own posts" ON chronicles_posts
  FOR UPDATE
  USING (
    creator_id = (
      SELECT id FROM chronicles_creators 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can DELETE their own posts
CREATE POLICY "Users can delete their own posts" ON chronicles_posts
  FOR DELETE
  USING (
    creator_id = (
      SELECT id FROM chronicles_creators 
      WHERE user_id = auth.uid()
    )
  );
```

### Step 4: Check chronicles_creators table has RLS
```sql
-- Enable RLS on chronicles_creators if needed
ALTER TABLE chronicles_creators ENABLE ROW LEVEL SECURITY;

-- Users can view any creator profile (for display purposes)
CREATE POLICY IF NOT EXISTS "Anyone can view creator profiles" ON chronicles_creators
  FOR SELECT
  USING (true);

-- Users can only update their own creator profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON chronicles_creators
  FOR UPDATE
  USING (user_id = auth.uid());
```

### Step 5: Verify the user has a creator profile
Before creating posts, ensure the logged-in user (email: `aladeprosper09022@gmail.com`, user_id: `559e6613-25de-4fff-9e36-54bd160c7114`) has an entry in `chronicles_creators`.

You can check with this query:
```sql
SELECT id, user_id, pen_name FROM chronicles_creators 
WHERE user_id = '559e6613-25de-4fff-9e36-54bd160c7114';
```

If no result, create one:
```sql
INSERT INTO chronicles_creators (
  user_id, 
  pen_name, 
  email, 
  profile_visibility
) VALUES (
  '559e6613-25de-4fff-9e36-54bd160c7114',
  'alade_prosper',  -- Change this to desired pen name
  'aladeprosper09022@gmail.com',
  'public'
);
```

## After applying these fixes:

1. The RLS policy will correctly allow authenticated users to insert posts
2. The check `creator_id = (SELECT id FROM chronicles_creators WHERE user_id = auth.uid())` ensures:
   - The authenticated user exists in the system
   - The creator_id being inserted matches their creator profile
3. Your API code will work without modification

## Test it:

```bash
# In Flutter app, try creating a post again
# You should get a 201 Created response instead of 500 error
```
