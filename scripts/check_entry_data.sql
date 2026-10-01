-- Check the actual data in chronicles_prompt_entries
SELECT 
  id,
  prompt_id,
  creator_id,
  post_id,
  entry_type,
  status,
  submitted_at
FROM chronicles_prompt_entries
WHERE id = 'bcee3289-63ca-4fc0-b9a7-7c6a4628663e';

-- Check the creator data
SELECT 
  id,
  user_id,
  pen_name,
  display_name,
  profile_image_url,
  avatar_url,
  bio
FROM chronicles_creators
WHERE id = '7c6c58dc-de3c-4faf-afe3-517749efa5cc';

-- Check the post data
SELECT 
  id,
  title,
  slug,
  excerpt,
  post_type,
  category,
  tags,
  status,
  published_at,
  cover_image_url
FROM chronicles_posts
WHERE id = 'e6fddb33-e476-439d-8c1a-270962a38b82';