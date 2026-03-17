# RLS Policy for chronicles_chain_entries

## Expected behavior
- Users can INSERT chain entries only if they're a valid creator
- Users can READ chain entries for any chain
- Users can UPDATE/DELETE only their own entries

## Run this SQL in Supabase

```sql
-- Enable RLS on chronicles_chain_entries
ALTER TABLE chronicles_chain_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can INSERT chain entries (any authenticated creator)
CREATE POLICY IF NOT EXISTS "Creators can add chain entries" ON chronicles_chain_entries
  FOR INSERT
  WITH CHECK (
    added_by = (
      SELECT id FROM chronicles_creators 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Anyone can READ chain entries
CREATE POLICY IF NOT EXISTS "Anyone can view chain entries" ON chronicles_chain_entries
  FOR SELECT
  USING (true);

-- Policy: Users can UPDATE their own entries
CREATE POLICY IF NOT EXISTS "Users can update own chain entries" ON chronicles_chain_entries
  FOR UPDATE
  USING (
    added_by = (
      SELECT id FROM chronicles_creators 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can DELETE their own entries
CREATE POLICY IF NOT EXISTS "Users can delete own chain entries" ON chronicles_chain_entries
  FOR DELETE
  USING (
    added_by = (
      SELECT id FROM chronicles_creators 
      WHERE user_id = auth.uid()
    )
  );
```

## RLS Policy for chronicles_writing_chains

```sql
-- Enable RLS if needed
ALTER TABLE chronicles_writing_chains ENABLE ROW LEVEL SECURITY;

-- Anyone can view chains
CREATE POLICY IF NOT EXISTS "Anyone can view chains" ON chronicles_writing_chains
  FOR SELECT
  USING (true);

-- Users can INSERT chains (as creator)
CREATE POLICY IF NOT EXISTS "Creators can create chains" ON chronicles_writing_chains
  FOR INSERT
  WITH CHECK (
    created_by = (
      SELECT id FROM chronicles_creators 
      WHERE user_id = auth.uid()
    )
  );

-- Users can UPDATE their own chains
CREATE POLICY IF NOT EXISTS "Users can update own chains" ON chronicles_writing_chains
  FOR UPDATE
  USING (
    created_by = (
      SELECT id FROM chronicles_creators 
      WHERE user_id = auth.uid()
    )
  );

-- Users can DELETE their own chains
CREATE POLICY IF NOT EXISTS "Users can delete own chains" ON chronicles_writing_chains
  FOR DELETE
  USING (
    created_by = (
      SELECT id FROM chronicles_creators 
      WHERE user_id = auth.uid()
    )
  );
```

## Pattern to remember

For ALL Chronicle tables that reference `chronicles_creators`:
- Always use: `creator_id = (SELECT id FROM chronicles_creators WHERE user_id = auth.uid())`
- NOT: `creator_id = auth.uid()` ← This will ALWAYS fail!

The `auth.uid()` returns the `auth.users.id`, but `creator_id` points to `chronicles_creators.id` which is a DIFFERENT table.
