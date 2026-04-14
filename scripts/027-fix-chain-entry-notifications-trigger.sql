-- Fix handle_chain_entry_post_created trigger to not reference chronicles_posts
-- Chain entry posts are separate from regular posts, so related_post_id should be NULL

CREATE OR REPLACE FUNCTION public.handle_chain_entry_post_created()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;
