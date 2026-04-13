-- Migration: Create flag_post_for_review RPC Function
-- File: 005_create_flag_post_for_review_rpc.sql
-- Purpose: Create the flag_post_for_review() RPC function that the API calls
-- The function inserts a flag record, triggering handle_flag_post_for_review()
-- Created: 2026-04-13

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.flag_post_for_review(uuid, uuid, uuid, uuid, text, text) CASCADE;

-- Create the RPC function that handles all flag types
CREATE OR REPLACE FUNCTION public.flag_post_for_review(
  p_admin_id uuid,
  p_reason text,
  p_post_id uuid DEFAULT NULL,
  p_chain_entry_post_id uuid DEFAULT NULL,
  p_chain_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS TABLE (success boolean, message text, flag_id uuid) AS $$
DECLARE
  v_flag_id uuid;
  v_content_type text;
  v_error_msg text;
BEGIN
  -- Validate that exactly one content ID is provided
  IF (p_post_id IS NOT NULL AND p_chain_entry_post_id IS NOT NULL) OR
     (p_post_id IS NOT NULL AND p_chain_id IS NOT NULL) OR
     (p_chain_entry_post_id IS NOT NULL AND p_chain_id IS NOT NULL) THEN
    RETURN QUERY SELECT FALSE, 'Cannot flag multiple content types at once'::text, NULL::uuid;
    RETURN;
  END IF;

  IF p_post_id IS NULL AND p_chain_entry_post_id IS NULL AND p_chain_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Must provide either post_id, chain_entry_post_id, or chain_id'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Determine content type
  IF p_chain_entry_post_id IS NOT NULL THEN
    v_content_type := 'chain_entry_post';
  ELSIF p_chain_id IS NOT NULL THEN
    v_content_type := 'chain';
    -- For chains, we store chain_id in post_id field (will handle in trigger)
    p_post_id := p_chain_id;
  ELSE
    v_content_type := 'post';
  END IF;

  -- Insert into chronicles_flagged_reviews
  -- The trigger handle_flag_post_for_review() will fire and handle status updates and notifications
  INSERT INTO public.chronicles_flagged_reviews (
    post_id,
    chain_entry_post_id,
    flagged_by,
    reason,
    description,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_post_id,
    p_chain_entry_post_id,
    p_admin_id,
    p_reason,
    p_description,
    'pending',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_flag_id;

  -- Return success with flag ID
  RETURN QUERY SELECT 
    TRUE::boolean,
    format('Content flagged successfully (type: %s)', v_content_type)::text,
    v_flag_id::uuid;

EXCEPTION WHEN OTHERS THEN
  -- Handle any database errors
  v_error_msg := SQLERRM;
  RETURN QUERY SELECT 
    FALSE::boolean,
    format('Error flagging content: %s', v_error_msg)::text,
    NULL::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins only, enforced via RLS)
GRANT EXECUTE ON FUNCTION public.flag_post_for_review(uuid, text, uuid, uuid, uuid, text) TO authenticated;

-- ===================================================================
-- MIGRATION NOTES
-- ===================================================================
-- This function:
-- 1. Validates input (exactly one content ID)
-- 2. Determines content type
-- 3. Inserts flag record into chronicles_flagged_reviews table
-- 4. The trigger handle_flag_post_for_review() automatically fires AFTER INSERT
-- 5. Trigger updates content status to 'draft'
-- 6. Trigger creates notifications for creator and admins
-- 7. Returns success/failure with flag_id
--
-- The function is called by: POST /api/admin/chronicles/flag-post via supabase.rpc()
