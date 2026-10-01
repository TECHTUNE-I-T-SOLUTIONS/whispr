-- Add entries_count column to chronicles_writing_prompts table
ALTER TABLE chronicles_writing_prompts
ADD COLUMN IF NOT EXISTS entries_count INTEGER DEFAULT 0;

-- Create a trigger to automatically update entries_count on chronicles_writing_prompts
-- when entries are added or removed

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_entries_count_insert ON chronicles_prompt_entries;
DROP TRIGGER IF EXISTS trigger_update_entries_count_delete ON chronicles_prompt_entries;
DROP TRIGGER IF EXISTS trigger_update_entries_count_update ON chronicles_prompt_entries;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS update_prompt_entries_count() CASCADE;

-- Create the function to update entries count
CREATE OR REPLACE FUNCTION update_prompt_entries_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment entries count when a new entry is submitted
    UPDATE chronicles_writing_prompts
    SET entries_count = entries_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.prompt_id;
    RETURN NEW;
  
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement entries count when an entry is deleted
    UPDATE chronicles_writing_prompts
    SET entries_count = GREATEST(entries_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.prompt_id;
    RETURN OLD;
  
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update count when status changes (optional - only count submitted/approved)
    IF OLD.status != NEW.status THEN
      IF NEW.status IN ('submitted', 'approved') AND OLD.status NOT IN ('submitted', 'approved') THEN
        -- Status changed to countable
        UPDATE chronicles_writing_prompts
        SET entries_count = entries_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.prompt_id;
      ELSIF OLD.status IN ('submitted', 'approved') AND NEW.status NOT IN ('submitted', 'approved') THEN
        -- Status changed from countable
        UPDATE chronicles_writing_prompts
        SET entries_count = GREATEST(entries_count - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.prompt_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_entries_count_insert
AFTER INSERT ON chronicles_prompt_entries
FOR EACH ROW
EXECUTE FUNCTION update_prompt_entries_count();

CREATE TRIGGER trigger_update_entries_count_delete
AFTER DELETE ON chronicles_prompt_entries
FOR EACH ROW
EXECUTE FUNCTION update_prompt_entries_count();

CREATE TRIGGER trigger_update_entries_count_update
AFTER UPDATE ON chronicles_prompt_entries
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_prompt_entries_count();

-- Update existing entries count for the current prompt
UPDATE chronicles_writing_prompts
SET entries_count = (
  SELECT COUNT(*)
  FROM chronicles_prompt_entries
  WHERE prompt_id = 'da708a01-7372-430e-9398-d80930af6f05'
    AND status IN ('submitted', 'approved')
)
WHERE id = 'da708a01-7372-430e-9398-d80930af6f05';

-- Verify the update
SELECT id, title, entries_count
FROM chronicles_writing_prompts
WHERE id = 'da708a01-7372-430e-9398-d80930af6f05';