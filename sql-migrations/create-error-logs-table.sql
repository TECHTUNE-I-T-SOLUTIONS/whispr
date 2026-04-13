-- Create error_logs table to store client-side runtime errors
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  source VARCHAR(50),
  timestamp BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  error_hash VARCHAR(100),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  notes TEXT,
  next_version VARCHAR(50),
  build_id VARCHAR(100),
  environment VARCHAR(50) DEFAULT 'production',
  session_id VARCHAR(100),
  user_id UUID,
  occurrence_count INTEGER DEFAULT 1,
  last_occurrence_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON public.error_logs(source);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_hash ON public.error_logs(error_hash);

-- Function to create notification when error is logged
CREATE OR REPLACE FUNCTION notify_admin_on_error()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Use the hardcoded admin ID for production
  admin_user_id := '8ac41ab5-c544-4068-a628-426593a2d4e2'::UUID;

  -- If no admin ID, skip notification
  IF admin_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only create notification for first occurrence of new errors
  IF NEW.occurrence_count = 1 THEN
    INSERT INTO notifications (
      admin_id,
      type,
      title,
      message,
      read
    ) VALUES (
      admin_user_id,
      'error_alert',
      'Production Error Detected',
      COALESCE(LEFT(NEW.message, 200), 'An error occurred') || ' - ' || NEW.source,
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for error notifications
DROP TRIGGER IF EXISTS trigger_notify_admin_on_error ON error_logs;
CREATE TRIGGER trigger_notify_admin_on_error
  AFTER INSERT ON public.error_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_error();

-- Function to deduplicate similar errors (optional but useful)
CREATE OR REPLACE FUNCTION generate_error_hash(p_message TEXT, p_stack TEXT)
RETURNS VARCHAR(100) AS $$
BEGIN
  -- Create a hash from the first line of message and first line of stack
  -- This helps identify recurring errors
  RETURN encode(
    digest(
      COALESCE(LEFT(p_message, 200), '') || '|' || COALESCE(LEFT(SPLIT_PART(p_stack, E'\n', 1), 200), ''),
      'sha256'
    ),
    'hex'
  )::VARCHAR(100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update or insert error logs with deduplication
CREATE OR REPLACE FUNCTION upsert_error_log(
  p_message TEXT,
  p_stack TEXT,
  p_url TEXT,
  p_user_agent TEXT,
  p_source VARCHAR(50),
  p_timestamp BIGINT,
  p_next_version VARCHAR(50),
  p_build_id VARCHAR(100),
  p_session_id VARCHAR(100),
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_error_hash VARCHAR(100);
  v_error_id UUID;
  v_existing_error_id UUID;
BEGIN
  v_error_hash := generate_error_hash(p_message, p_stack);

  SELECT id INTO v_existing_error_id
  FROM public.error_logs
  WHERE error_hash = v_error_hash
    AND created_at > NOW() - INTERVAL '24 hours'
    AND resolved = FALSE
  LIMIT 1;

  IF v_existing_error_id IS NOT NULL THEN
    UPDATE public.error_logs
    SET 
      occurrence_count = occurrence_count + 1,
      last_occurrence_at = CURRENT_TIMESTAMP
    WHERE id = v_existing_error_id;
    RETURN v_existing_error_id;
  ELSE
    INSERT INTO public.error_logs (
      message, stack, url, user_agent, source, timestamp, error_hash,
      next_version, build_id, session_id, user_id, environment
    ) VALUES (
      p_message, p_stack, p_url, p_user_agent, p_source, p_timestamp, v_error_hash,
      p_next_version, p_build_id, p_session_id, p_user_id, 'production'
    )
    RETURNING id INTO v_error_id;
    RETURN v_error_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for error statistics
CREATE OR REPLACE VIEW public.error_stats AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  source,
  COUNT(*) as error_count,
  COUNT(DISTINCT error_hash) as unique_errors,
  MAX(created_at) as last_error
FROM public.error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at), source
ORDER BY hour DESC;

-- Create view for recent unresolved errors
CREATE OR REPLACE VIEW public.recent_unresolved_errors AS
SELECT
  id, message, url, source, created_at, occurrence_count, last_occurrence_at, user_id
FROM public.error_logs
WHERE resolved = FALSE
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY last_occurrence_at DESC
LIMIT 50;
