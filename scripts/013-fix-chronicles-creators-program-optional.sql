-- Fix chronicles_creators to make program_id optional
-- This allows creators to be created without being assigned to a program

-- Step 1: Drop the NOT NULL constraint on program_id
ALTER TABLE chronicles_creators
ALTER COLUMN program_id DROP NOT NULL;

-- Step 2: Drop the foreign key constraint and re-add it
ALTER TABLE chronicles_creators
DROP CONSTRAINT IF EXISTS chronicles_creators_program_id_fkey;

ALTER TABLE chronicles_creators
ADD CONSTRAINT chronicles_creators_program_id_fkey 
FOREIGN KEY (program_id) 
REFERENCES chronicles_programs(id) 
ON DELETE CASCADE;

-- Step 3: Disable RLS on chronicles_programs table to allow service role to create records
ALTER TABLE chronicles_programs DISABLE ROW LEVEL SECURITY;

-- Step 3b: Disable RLS on chronicles_creators table to allow service role to create records
ALTER TABLE chronicles_creators DISABLE ROW LEVEL SECURITY;

-- Step 4: Or create permissive policies if you want to keep RLS enabled
-- Uncomment these lines if you prefer to use policies instead of disabling RLS:
-- CREATE POLICY "Allow service role full access"
--   ON chronicles_programs
--   FOR ALL
--   USING (auth.role() = 'service_role')
--   WITH CHECK (auth.role() = 'service_role');
-- 
-- CREATE POLICY "Allow authenticated users to view programs"
--   ON chronicles_programs
--   FOR SELECT
--   USING (auth.role() = 'authenticated');
-- 
-- CREATE POLICY "Allow creators to insert their own programs"
--   ON chronicles_programs
--   FOR INSERT
--   WITH CHECK (created_by = auth.uid() OR auth.role() = 'service_role');

-- Step 5: Verify the storage bucket allows uploads
-- This is usually configured in Supabase dashboard, but ensure:
-- - Storage RLS is disabled or has proper policies
-- - The bucket "chronicles-profiles" exists
-- - Policies allow authenticated users to upload
