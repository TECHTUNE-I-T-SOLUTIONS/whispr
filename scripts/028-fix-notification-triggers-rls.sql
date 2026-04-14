-- Fix notification triggers to work with RLS enabled on chronicles_notifications
-- Problem: Triggers were failing with RLS policy violation when inserting notifications
-- Solution: Use SECURITY DEFINER to run triggers with elevated permissions

-- ===================================================================
-- FIX 1: handle_chain_created trigger
-- ===================================================================

DROP TRIGGER IF EXISTS trigger_chain_created ON public.chronicles_writing_chains CASCADE;
DROP FUNCTION IF EXISTS public.handle_chain_created() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_chain_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification for chain creator
  INSERT INTO public.chronicles_notifications (
    creator_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.created_by::uuid,
    'chain_created'::text,
    'Your writing chain has been created',
    'Your new writing chain "' || NEW.title || '" has been successfully created',
    jsonb_build_object(
      'chain_id', NEW.id,
      'chain_description', NEW.description,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_chain_created
AFTER INSERT ON public.chronicles_writing_chains
FOR EACH ROW
EXECUTE FUNCTION public.handle_chain_created();

-- ===================================================================
-- FIX 2: handle_chain_entry_post_created trigger  
-- ===================================================================

DROP TRIGGER IF EXISTS trigger_chain_entry_post_created ON public.chronicles_chain_entry_posts CASCADE;
DROP FUNCTION IF EXISTS public.handle_chain_entry_post_created() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_chain_entry_post_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chain_title text;
  v_chain_creator_id uuid;
  v_added_by_pen_name text;
BEGIN
  -- Get chain info
  SELECT title, created_by INTO v_chain_title, v_chain_creator_id
  FROM public.chronicles_writing_chains
  WHERE id = NEW.chain_id;

  -- Get who added it
  SELECT pen_name INTO v_added_by_pen_name
  FROM public.chronicles_creators
  WHERE id = NEW.added_by;

  -- Notify creator of entry
  -- Note: related_post_id is NULL because chain entry posts are not in chronicles_posts
  INSERT INTO public.chronicles_notifications (
    creator_id,
    type,
    title,
    message,
    related_post_id,
    data
  ) VALUES (
    NEW.creator_id,
    'post_added_to_chain'::text,
    'Your post added to chain',
    'Your post "' || NEW.title || '" has been added to the chain "' || v_chain_title || '" by @' || COALESCE(v_added_by_pen_name, 'admin'),
    NULL,
    jsonb_build_object(
      'chain_id', NEW.chain_id,
      'chain_title', v_chain_title,
      'entry_post_id', NEW.id,
      'sequence', NEW.sequence
    )
  );

  -- Notify chain creator if different person added it
  IF NEW.added_by != v_chain_creator_id THEN
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_post_id,
      related_creator_id,
      data
    ) VALUES (
      v_chain_creator_id,
      'chain_entry_added'::text,
      'New entry added to your chain',
      'A new entry "' || NEW.title || '" has been added to your chain "' || v_chain_title || '"',
      NULL,
      NEW.creator_id,
      jsonb_build_object(
        'chain_id', NEW.chain_id,
        'entry_post_id', NEW.id,
        'sequence', NEW.sequence
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_chain_entry_post_created
AFTER INSERT ON public.chronicles_chain_entry_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_chain_entry_post_created();

-- ===================================================================
-- Verify triggers exist
-- ===================================================================

SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('trigger_chain_created', 'trigger_chain_entry_post_created');
