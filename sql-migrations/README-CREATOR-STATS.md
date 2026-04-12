# Creator Stats Fix - SQL Migration Guide

## Overview

This guide explains the two SQL migration files that fix the creator statistics in the Chronicles platform. The issue is that creator stats (total posts, engagement, followers, etc.) were not automatically updating when creators posted content, received comments, or gained followers.

## Problem Statement

The `chronicles_creators` table has columns for tracking creator statistics:
- `total_posts` - Number of published posts
- `total_poems` - Number of published poems
- `total_blog_posts` - Number of published blog posts
- `total_engagement` - Sum of engagement (likes + comments + shares)
- `total_shares` - Number of shares
- `total_followers` - Number of followers
- `last_post_date` - Date of most recent published post
- `last_activity_at` - Timestamp of last activity

However, these stats were manually populated during user signup and never updated automatically, resulting in creators showing 0 posts even though they may have created many posts/comments/reactions.

## Solution

Two SQL files work together to fix this:

### 1. **01-creator-stats-triggers.sql** - Automatic Updates Going Forward

This file creates **PostgreSQL triggers and functions** that automatically update creator stats whenever:

#### Triggers Created:
1. **trg_update_creator_post_stats** (chronicles_posts)
   - Fires when: Post is created, updated, or deleted
   - Updates: `total_posts`, `total_poems`, `total_blog_posts`, `total_shares`, `last_post_date`

2. **trg_update_creator_engagement_stats** (chronicles_comments)
   - Fires when: Comment is added or removed
   - Updates: `total_engagement`, `last_activity_at`

3. **trg_update_engagement_on_post_reaction** (chronicles_post_likes)
   - Fires when: Post receives a like/reaction
   - Updates: `total_engagement`

4. **trg_update_shares_on_post_share** (chronicles_posts_shares)
   - Fires when: Post is shared
   - Updates: `total_shares`, `total_engagement`

5. **trg_update_last_activity_comment_reaction** (chronicles_comment_reactions)
   - Fires when: Comment reaction occurs
   - Updates: `last_activity_at`

6. **trg_update_followers_count** (chronicles_creator_followers)
   - Fires when: Someone follows/unfollows a creator
   - Updates: `total_followers`

**How to Use:**
```sql
-- Run this ONCE to create all triggers
psql -h your_supabase_host -U postgres -d postgres -f 01-creator-stats-triggers.sql
```

Or in Supabase:
1. Go to SQL Editor
2. Copy the entire contents of `01-creator-stats-triggers.sql`
3. Click "Run"
4. Verify: No errors should appear

### 2. **02-backfill-creator-stats.sql** - Fix Historical Data

This file runs a **one-time migration** to recalculate and update all existing creator stats based on actual data in the database.

**What it does:**
1. ✅ Counts all published posts for each creator
2. ✅ Counts poems vs blog posts by post_type
3. ✅ Calculates total engagement (sum of likes + comments + shares)
4. ✅ Finds the date of the most recent published post
5. ✅ Determines the most recent activity timestamp
6. ✅ Counts followers for each creator
7. ✅ Provides verification queries to check the results

**Expected Output:**
```
QUERY PLAN
UPDATE 1

 total_creators_updated | total_published_posts | total_poems | ...
-----------|-----------|-----------|
 123       | 456       | 78        | ...
```

**How to Use:**
```sql
-- Run this ONCE to backfill all historical creator stats
psql -h your_supabase_host -U postgres -d postgres -f 02-backfill-creator-stats.sql
```

Or in Supabase:
1. Go to SQL Editor
2. Copy the entire contents of `02-backfill-creator-stats.sql`
3. Click "Run"
4. Wait for completion (may take a few minutes for large datasets)
5. Review the verification output

## Implementation Steps

### Step 1: Create Triggers (First)
```sql
-- Copy and run: 01-creator-stats-triggers.sql
-- This must be done first because backfill script depends on updated_at being current
```

### Step 2: Backfill Historical Data (Second)
```sql
-- Copy and run: 02-backfill-creator-stats.sql
-- This immediately recalculates stats for all existing creators
```

### Step 3: Verification
After running the backfill script, the output will show:
- Total creators updated
- Verification queries showing top 10 creators by engagement
- Edge case detection for creators with posts but zero counts

## Example: What Gets Updated for a Creator

**Before Migration:**
```
pen_name: Prince
total_posts: 0
total_poems: 0
total_blog_posts: 0
total_engagement: 0
total_shares: 0
total_followers: 0
last_post_date: NULL
```

**After Running Scripts:**
```
pen_name: Prince
total_posts: 5 (counting actual published posts)
total_poems: 2 (posts where post_type = 'poem')
total_blog_posts: 3 (posts where post_type = 'blog')
total_engagement: 48 (likes: 30 + comments: 12 + shares: 6)
total_shares: 6
total_followers: 15 (from chronicles_creator_followers table)
last_post_date: 2025-12-15 14:30:00 (most recent published_at)
last_activity_at: 2025-12-18 09:45:00 (most recent activity)
```

## Important Notes

⚠️ **Before Running:**
1. ✅ Backup your database before running these migrations
2. ✅ Run in development/staging first to verify
3. ✅ Schedule during low-traffic periods
4. ✅ The backfill script uses `BEGIN; ... COMMIT;` for transaction safety

🔄 **After Running:**
1. ✅ New posts will automatically update stats going forward
2. ✅ No manual intervention needed
3. ✅ Stats will always stay in sync with actual data
4. ✅ If data gets out of sync again, you can re-run the backfill script

🐛 **Troubleshooting:**

**Issue: "Table does not exist" error**
- Check table names match your schema
- Verify `chronicles_post_likes` and `chronicles_posts_shares` tables exist
- If using different table names, update the SQL accordingly

**Issue: Duplicate object errors**
- This happens if you run the same migration twice
- Solution: Drop existing triggers first or update them:
```sql
DROP TRIGGER IF EXISTS trigger_name ON table_name;
```

**Issue: Stats still not updating**
- Verify triggers were created: `SELECT * FROM information_schema.triggers WHERE trigger_name LIKE 'trg_%';`
- Check if hooks/middleware are bypassing the database layer
- Verify new post inserts go through the `chronicles_posts` table

## Stats Calculation Details

### total_engagement
```
total_engagement = SUM(likes_count) + SUM(comments_count) + SUM(shares_count)
                   from all posts by creator
```

### last_activity_at
```
last_activity_at = Most recent of:
  - chronicles_posts.updated_at
  - chronicles_comments.created_at (by this creator)
  - chronicles_comment_reactions.created_at (by this creator)
  - chronicles_post_likes.created_at (by this creator)
```

### total_followers
```
total_followers = COUNT(*) from chronicles_creator_followers
                  WHERE creator_id = target_creator
```

## Testing the Triggers

After running the migrations, test that triggers work:

```sql
-- Test 1: Create a new post
INSERT INTO chronicles_posts (creator_id, title, slug, content, post_type, status, published_at)
VALUES ('7c6c58dc-de3c-4faf-afe3-517749efa5cc', 'Test Post', 'test-post', 'Content here', 'blog', 'published', NOW());

-- Query creator stats - total_posts should increment
SELECT pen_name, total_posts, total_blog_posts, last_post_date FROM chronicles_creators 
WHERE id = '7c6c58dc-de3c-4faf-afe3-517749efa5cc';

-- Test 2: Add a comment
INSERT INTO chronicles_comments (post_id, creator_id, content, status)
VALUES (post_uuid_here, '7c6c58dc-de3c-4faf-afe3-517749efa5cc', 'Great post!', 'approved');

-- Query creator stats - total_engagement should increase
SELECT pen_name, total_engagement, last_activity_at FROM chronicles_creators 
WHERE id = '7c6c58dc-de3c-4faf-afe3-517749efa5cc';
```

## Support

For issues or questions:
1. Check the "Troubleshooting" section above
2. Review the error message in the SQL output
3. Verify table and column names match the actual schema
4. Run diagnostic query in the optional section of 02-backfill-creator-stats.sql
