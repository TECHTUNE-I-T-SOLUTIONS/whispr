-- Create a trigger to automatically save prompt versions when writing prompts are created or updated

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_save_prompt_version_insert ON chronicles_writing_prompts;
DROP TRIGGER IF EXISTS trigger_save_prompt_version_update ON chronicles_writing_prompts;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS save_prompt_version() CASCADE;

-- Create the function to save prompt versions
CREATE OR REPLACE FUNCTION save_prompt_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version text;
  v_metadata jsonb;
BEGIN
  -- Generate version number (using timestamp for uniqueness)
  v_version := to_char(CURRENT_TIMESTAMP, 'YYYYMMDD-HH24MISS');
  
  -- Build metadata
  v_metadata := jsonb_build_object(
    'prompt_id', NEW.id,
    'title', NEW.title,
    'status', NEW.status,
    'challenge_type', NEW.challenge_type,
    'prompt_type', NEW.prompt_type,
    'is_ai_generated', NEW.is_ai_generated,
    'ai_generation_model', NEW.ai_generation_model,
    'created_by', NEW.created_by,
    'edited_by', NEW.edited_by,
    'updated_at', NEW.updated_at
  );
  
  -- Insert new version
  INSERT INTO prompt_versions (
    prompt_name,
    version,
    content,
    is_active,
    metadata,
    created_at,
    created_by
  ) VALUES (
    NEW.id,  -- Use prompt ID as prompt_name for linking
    v_version,
    NEW.content,
    true,  -- New version is active
    v_metadata,
    CURRENT_TIMESTAMP,
    COALESCE(NEW.edited_by, NEW.created_by)
  );
  
  -- Mark previous versions as inactive
  UPDATE prompt_versions
  SET is_active = false
  WHERE prompt_name = NEW.id
    AND version != v_version;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_save_prompt_version_insert
AFTER INSERT ON chronicles_writing_prompts
FOR EACH ROW
EXECUTE FUNCTION save_prompt_version();

CREATE TRIGGER trigger_save_prompt_version_update
AFTER UPDATE ON chronicles_writing_prompts
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
EXECUTE FUNCTION save_prompt_version();

-- Create a version for the existing prompt
INSERT INTO prompt_versions (
  prompt_name,
  version,
  content,
  is_active,
  metadata,
  created_at,
  created_by
)
SELECT 
  id,
  to_char(updated_at, 'YYYYMMDD-HH24MISS'),
  content,
  true,
  jsonb_build_object(
    'prompt_id', id,
    'title', title,
    'status', status,
    'challenge_type', challenge_type,
    'prompt_type', prompt_type,
    'is_ai_generated', is_ai_generated,
    'ai_generation_model', ai_generation_model,
    'created_by', created_by,
    'edited_by', edited_by,
    'updated_at', updated_at
  ),
  updated_at,
  COALESCE(edited_by, created_by)
FROM chronicles_writing_prompts
WHERE id = 'da708a01-7372-430e-9398-d80930af6f05';

-- Verify the version was created
SELECT 
  id,
  prompt_name,
  version,
  is_active,
  created_at
FROM prompt_versions
WHERE prompt_name = 'da708a01-7372-430e-9398-d80930af6f05'
ORDER BY created_at DESC;