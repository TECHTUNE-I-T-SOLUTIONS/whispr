-- AI Content Configuration Table
-- Stores authenticity thresholds and settings for content checking

CREATE TABLE IF NOT EXISTS ai_content_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authenticity_threshold INTEGER NOT NULL DEFAULT 70,
  section_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  max_paragraph_length INTEGER NOT NULL DEFAULT 800,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create a unique index to enforce singleton row
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_content_config_singleton 
ON ai_content_config ((id = (SELECT id FROM ai_content_config LIMIT 1)));

-- Insert default row if none exists
INSERT INTO ai_content_config (authenticity_threshold, section_threshold, max_paragraph_length)
SELECT 70, 0.50, 800
WHERE NOT EXISTS (SELECT 1 FROM ai_content_config);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_content_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_content_config_updated_at ON ai_content_config;
CREATE TRIGGER update_ai_content_config_updated_at
  BEFORE UPDATE ON ai_content_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_content_config_updated_at();

-- Enable RLS
ALTER TABLE ai_content_config ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access)
CREATE POLICY "Service role has full access" ON ai_content_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users (read only)
CREATE POLICY "Authenticated users can read" ON ai_content_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant permissions
GRANT ALL ON ai_content_config TO service_role;
GRANT SELECT ON ai_content_config TO authenticated;

-- Comment on table
COMMENT ON TABLE ai_content_config IS 'Stores AI content authenticity configuration thresholds';
COMMENT ON COLUMN ai_content_config.authenticity_threshold IS 'Minimum authenticity score (0-100) required for content to proceed';
COMMENT ON COLUMN ai_content_config.section_threshold IS 'AI confidence threshold (0-1) to flag a section as AI-generated';
COMMENT ON COLUMN ai_content_config.max_paragraph_length IS 'Maximum paragraph length before splitting for analysis';