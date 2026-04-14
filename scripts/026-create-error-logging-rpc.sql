-- =====================================================================
-- CREATE/UPDATE: upsert_error_log RPC Function
-- Purpose: Store client-side errors in the database
-- Parameters: build_id, message, next_version, session_id, source, 
--             stack, timestamp, url, user_agent, user_id
-- =====================================================================

SELECT 'Starting Error Logging RPC Function Setup...' as status;

-- Step 1: Drop the old function if it exists
DROP FUNCTION IF EXISTS public.upsert_error_log(
  p_build_id text,
  p_message text,
  p_next_version text,
  p_source text,
  p_stack text,
  p_timestamp bigint,
  p_url text,
  p_user_agent text
) CASCADE;

SELECT 'Dropped old function signature ✓' as status;

-- Step 2: Create the new function with correct parameters
CREATE OR REPLACE FUNCTION public.upsert_error_log(
  p_build_id text,
  p_message text,
  p_next_version text,
  p_session_id text DEFAULT NULL,
  p_source text DEFAULT 'unknown',
  p_stack text DEFAULT '',
  p_timestamp bigint DEFAULT NULL,
  p_url text DEFAULT '',
  p_user_agent text DEFAULT '',
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_error_id uuid;
BEGIN
  -- If no timestamp provided, use current time
  IF p_timestamp IS NULL THEN
    p_timestamp := EXTRACT(EPOCH FROM NOW())::bigint * 1000;
  END IF;

  -- Insert new error log
  INSERT INTO public.error_logs (
    build_id,
    message,
    next_version,
    session_id,
    source,
    stack,
    timestamp,
    url,
    user_agent,
    user_id,
    created_at
  )
  VALUES (
    p_build_id,
    p_message,
    p_next_version,
    p_session_id,
    p_source,
    p_stack,
    p_timestamp,
    p_url,
    p_user_agent,
    p_user_id,
    NOW()
  )
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Created new RPC function ✓' as status;

-- Step 3: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_error_log(
  text, text, text, text, text, text, bigint, text, text, uuid
) TO authenticated, anon;

SELECT 'Granted execute permissions ✓' as status;

-- Step 4: Verify the function is created
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'upsert_error_log'
  AND routine_schema = 'public';

SELECT 'Error Logging RPC Function setup completed successfully ✓' as status;

-- =====================================================================
-- What this does:
-- - Creates upsert_error_log RPC function with all required parameters
-- - Stores client-side errors with full context (session, user, stack trace)
-- - Automatically uses current time if timestamp not provided
-- - Allows both authenticated and anonymous users to log errors
-- - Returns the error log ID for tracking
-- =====================================================================
