-- Create shares table
CREATE TABLE IF NOT EXISTS public.shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  url text NOT NULL,
  source varchar(50) NOT NULL,
  utm boolean DEFAULT true,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT shares_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_shares_created_at ON public.shares USING btree (created_at DESC) TABLESPACE pg_default;

-- Trigger to insert a notification when a new share is recorded
CREATE OR REPLACE FUNCTION public.fn_notify_on_share()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Insert a notification for admins; you may scope this to a specific admin later
  INSERT INTO public.notifications (admin_id, type, title, message, read, created_at)
  VALUES (NULL, 'share', 'New share recorded', 'A user shared the site: ' || NEW.url, false, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_share ON public.shares;
CREATE TRIGGER trg_notify_on_share
AFTER INSERT ON public.shares
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_on_share();
