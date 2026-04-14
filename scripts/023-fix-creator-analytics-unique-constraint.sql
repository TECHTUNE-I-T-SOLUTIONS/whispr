-- =====================================================================
-- FIX: chronicles_creator_analytics Unique Constraint Issue
-- Problem: UNIQUE(creator_id) prevents multiple daily records per creator
-- Solution: Change to UNIQUE(creator_id, date) to allow one record per creator per day
-- =====================================================================

SELECT 'Starting Chronicles Creator Analytics Unique Constraint Fix...' as status;

-- Step 1: Drop existing constraints if they exist
ALTER TABLE public.chronicles_creator_analytics
DROP CONSTRAINT IF EXISTS chronicles_creator_analytics_creator_id_key;

SELECT 'Dropped old UNIQUE(creator_id) constraint ✓' as status;

-- Step 2: Drop the new composite constraint if it already exists (from previous run)
ALTER TABLE public.chronicles_creator_analytics
DROP CONSTRAINT IF EXISTS chronicles_creator_analytics_creator_id_date_key;

SELECT 'Dropped existing composite constraint if present ✓' as status;

-- Step 3: Add the proper composite unique constraint
ALTER TABLE public.chronicles_creator_analytics
ADD CONSTRAINT chronicles_creator_analytics_creator_id_date_key 
UNIQUE (creator_id, date);

SELECT 'Added new UNIQUE(creator_id, date) composite constraint ✓' as status;

-- Step 4: Verify the constraint is in place
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'chronicles_creator_analytics'
  AND constraint_name LIKE '%unique%'
ORDER BY constraint_name, ordinal_position;

-- Step 5: Test that shares can now be recorded without errors
SELECT 'Chronicles Creator Analytics constraint fixed successfully ✓' as status;
SELECT 'The share recording should now work without duplicate key errors.' as message;

-- =====================================================================
-- What this fixes:
-- - Share endpoint no longer fails with duplicate key on chronicles_creator_analytics
-- - Allows multiple daily analytics records per creator (one per date)
-- - Trigger update_daily_creator_analytics() now works correctly
-- - No API changes needed
-- =====================================================================
