-- RSS Feed Health Table Migration
-- Tracks health status of RSS feeds for monitoring and automatic disabling

CREATE TABLE IF NOT EXISTS public.rss_feed_health (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id character varying NOT NULL UNIQUE,
  source_name character varying NOT NULL,
  healthy boolean DEFAULT true,
  last_success timestamp with time zone,
  last_failure timestamp with time zone,
  consecutive_failures integer DEFAULT 0,
  total_fetches integer DEFAULT 0,
  success_rate numeric DEFAULT 1.0,
  average_response_time numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rss_feed_health_pkey PRIMARY KEY (id)
);

-- Create index on source_id for faster lookups
CREATE INDEX IF NOT EXISTS rss_feed_health_source_id_idx ON public.rss_feed_health(source_id);

-- Create index on healthy status for filtering
CREATE INDEX IF NOT EXISTS rss_feed_health_healthy_idx ON public.rss_feed_health(healthy);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_rss_feed_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rss_feed_health_updated_at_trigger
  BEFORE UPDATE ON public.rss_feed_health
  FOR EACH ROW
  EXECUTE FUNCTION update_rss_feed_health_updated_at();
