-- Check what entry_id is stored in chronicles_challenge_winners
SELECT 
    id,
    prompt_id,
    entry_id,
    creator_id,
    rank,
    announced_at
FROM chronicles_challenge_winners
WHERE prompt_id = 'da708a01-7372-430e-9398-d80930af6f05';

-- Check the actual prompt entries
SELECT 
    id,
    prompt_id,
    creator_id,
    post_id,
    entry_type,
    status
FROM chronicles_prompt_entries
WHERE prompt_id = 'da708a01-7372-430e-9398-d80930af6f05';

-- If the entry_id in winners doesn't match, update it
-- (Run this only if the IDs don't match)
-- UPDATE chronicles_challenge_winners
-- SET entry_id = 'bcee3289-63ca-4fc0-b9a7-7c6a4628663e'
-- WHERE prompt_id = 'da708a01-7372-430e-9398-d80930af6f05'
-- AND entry_id != 'bcee3289-63ca-4fc0-b9a7-7c6a4628663e';