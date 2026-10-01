-- Update the post to mark it as a challenge entry and link it to the prompt entry
UPDATE chronicles_posts
SET 
  is_challenge_entry = true,
  prompt_entry_id = (
    SELECT id FROM chronicles_prompt_entries 
    WHERE post_id = 'e6fddb33-e476-439d-8c1a-270962a38b82' 
    LIMIT 1
  )
WHERE id = 'e6fddb33-e476-439d-8c1a-270962a38b82';

-- Verify the update
SELECT 
  id,
  title,
  is_challenge_entry,
  prompt_entry_id
FROM chronicles_posts
WHERE id = 'e6fddb33-e476-439d-8c1a-270962a38b82';