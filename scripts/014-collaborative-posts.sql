-- 14. Collaborative posting support

-- ensure report_templates has an active flag used by admin logic
ALTER TABLE IF EXISTS chronicles_report_templates
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Table to track collaborators on a post
CREATE TABLE IF NOT EXISTS chronicles_post_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES chronicles_posts(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('author','editor','viewer')) DEFAULT 'author',
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, creator_id)
);

-- Notification when a collaborator is added
CREATE OR REPLACE FUNCTION fn_notify_collaborator_added() RETURNS trigger AS $$
BEGIN
  INSERT INTO chronicles_notifications (
    creator_id,
    type,
    title,
    message,
    related_post_id,
    data
  ) VALUES (
    NEW.creator_id,
    'system',
    'Added to collaborative post',
    'You have been added as a collaborator to a post.',
    NEW.post_id,
    json_build_object('role', NEW.role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_collaborator_added ON chronicles_post_collaborators;
CREATE TRIGGER trg_collaborator_added
  AFTER INSERT ON chronicles_post_collaborators
  FOR EACH ROW EXECUTE FUNCTION fn_notify_collaborator_added();

-- Notification when a collaborator is removed
CREATE OR REPLACE FUNCTION fn_notify_collaborator_removed() RETURNS trigger AS $$
BEGIN
  INSERT INTO chronicles_notifications (
    creator_id,
    type,
    title,
    message,
    related_post_id,
    data
  ) VALUES (
    OLD.creator_id,
    'system',
    'Removed from collaborative post',
    'You have been removed from the collaborators list of a post.',
    OLD.post_id,
    json_build_object('role', OLD.role)
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_collaborator_removed ON chronicles_post_collaborators;
CREATE TRIGGER trg_collaborator_removed
  AFTER DELETE ON chronicles_post_collaborators
  FOR EACH ROW EXECUTE FUNCTION fn_notify_collaborator_removed();

-- Optional view to easily fetch collaborators per post
CREATE OR REPLACE VIEW vw_post_collaborators AS
SELECT
  pc.post_id,
  pc.creator_id,
  pc.role,
  c.pen_name,
  c.profile_image_url
FROM chronicles_post_collaborators pc
JOIN chronicles_creators c ON c.id = pc.creator_id;

-- Tables for chain storytelling (multiple creators add sequential posts)
CREATE TABLE IF NOT EXISTS chronicles_writing_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES chronicles_creators(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chronicles_chain_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES chronicles_writing_chains(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES chronicles_posts(id) ON DELETE CASCADE,
  sequence INT NOT NULL,
  added_by UUID REFERENCES chronicles_creators(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chain_id, sequence),
  UNIQUE(chain_id, post_id)
);

-- trigger to increment sequence automatically
CREATE OR REPLACE FUNCTION fn_chain_entry_sequence() RETURNS trigger AS $$
BEGIN
  IF NEW.sequence IS NULL THEN
    SELECT COALESCE(MAX(sequence),0) + 1 INTO NEW.sequence
    FROM chronicles_chain_entries
    WHERE chain_id = NEW.chain_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chain_entry_sequence ON chronicles_chain_entries;
CREATE TRIGGER trg_chain_entry_sequence
  BEFORE INSERT ON chronicles_chain_entries
  FOR EACH ROW EXECUTE FUNCTION fn_chain_entry_sequence();
