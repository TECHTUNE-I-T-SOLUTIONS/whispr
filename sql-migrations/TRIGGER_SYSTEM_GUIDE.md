# Complete Trigger System Documentation

## Overview

This system provides **automatic, real-time updates** to creator stats, leaderboards, analytics, and platform metrics whenever posts, comments, or engagement changes occur.

### ✅ All Tables Included

- `chronicles_creators` - Main stats auto-updated
- `chronicles_leaderboard` - Scores auto-calculated 
- `chronicles_creator_analytics` - Daily analytics auto-updated
- `chronicles_daily_analytics` - Platform-wide metrics auto-updated

---

## Execution Order (CRITICAL ⚠️)

Run these scripts in this exact order, each waiting for completion:

### Step 1: Create Triggers
```sql
File: 01-creator-stats-triggers.sql
Time: ~2-3 seconds
Creates: 9 triggers + functions
```

### Step 2: Backfill Creator Stats
```sql
File: 02-backfill-creator-stats.sql
Time: ~5-10 seconds
Fixes: All existing creator stats
```

### Step 3: Initialize Leaderboard & Analytics
```sql
File: 04-leaderboard-analytics-init.sql
Time: ~3-5 seconds
Initializes: Leaderboard entries, daily analytics, platform metrics
```

**After completing all 3 steps:**
- ✅ All stats auto-update in real-time
- ✅ Leaderboards auto-calculate
- ✅ Analytics auto-populate

---

## Trigger System Architecture

### Tier 1: Core Stats Triggers (3 triggers)

#### 1️⃣ `update_creator_post_stats` 
- **Monitors**: `chronicles_posts` table
- **Triggers On**: INSERT, UPDATE, DELETE
- **Updates**: 
  - `total_posts` (count of published posts)
  - `total_poems` (count of poems)
  - `total_blog_posts` (count of blog posts)
  - `total_shares` (sum of shares)
  - `last_post_date` (most recent publish)
  - `last_activity_at` (updated time)
- **Smart Logic**: Only counts published posts; updates stats when post status changes

#### 2️⃣ `update_creator_engagement_stats`
- **Monitors**: `chronicles_comments` table
- **Triggers On**: INSERT, DELETE
- **Updates**: 
  - `total_engagement` (recalculated from posts)
  - `last_activity_at` (for both post creator & commenter)
- **Smart Logic**: Updates both creators (post author + commenter)

#### 3️⃣ `update_creator_engagement_on_post_reaction`
- **Monitors**: `chronicles_post_reactions` table
- **Triggers On**: INSERT, DELETE
- **Updates**: 
  - `total_engagement` (likes count included)
- **Formula**: likes_count + comments_count + shares_count

---

### Tier 2: Engagement Update Triggers (2 triggers)

#### 4️⃣ `update_creator_total_engagement`
- **Monitors**: `chronicles_posts` table
- **Triggers On**: UPDATE (when `shares_count` changes)
- **Updates**: 
  - `total_engagement` (recalculated with shares)
- **Condition**: `OLD.shares_count IS DISTINCT FROM NEW.shares_count`

#### 5️⃣ `update_creator_last_activity`
- **Monitors**: `chronicles_comment_reactions` table
- **Triggers On**: INSERT, DELETE
- **Updates**: 
  - `last_activity_at` (marks recent activity)

---

### Tier 3: Leaderboard & Analytics Triggers (4 triggers)

#### 6️⃣ `update_leaderboard_score`
- **Monitors**: `chronicles_creators` table
- **Triggers On**: UPDATE (when stats change)
- **Updates**: `chronicles_leaderboard` table
- **Calculation**:
  ```
  score = (total_posts × post_weight) +
          (total_engagement × engagement_weight) +
          (streak_count × streak_weight) +
          (total_followers × follow_weight)
  ```
- **Weights** (configurable in `chronicles_leaderboard_settings`):
  - post_weight: 10
  - engagement_weight: 2
  - streak_weight: 5
  - follow_weight: 1

#### 7️⃣ `update_daily_creator_analytics`
- **Monitors**: `chronicles_creators` table
- **Triggers On**: UPDATE (when any stat changes)
- **Updates**: `chronicles_creator_analytics` table (daily record)
- **Stores**:
  - posts_created
  - total_followers
  - total_likes, comments, shares
  - avg_engagement_rate: (total_engagement / total_posts) × 100
  - date: CURRENT_DATE

#### 8️⃣ `update_platform_daily_analytics`
- **Monitors**: `chronicles_creators` table
- **Triggers On**: UPDATE (for any creator change)
- **Updates**: `chronicles_daily_analytics` table (platform-wide)
- **Calculates**:
  - total_creators (count where status='active')
  - active_creators (active in last 7 days)
  - total_posts, likes, comments, shares
  - avg_engagement_per_post
  - total_follows (daily)
  - date: CURRENT_DATE

---

## Data Flow Diagram

```
User Action
    ↓
chronicles_posts → trg_update_creator_post_stats → chronicles_creators.total_posts ↓
                                                                        ↓
chronicles_comments → trg_update_engagement_stats → chronicles_creators.total_engagement
                                                                        ↓
chronicles_post_reactions → trg_engage_on_reaction → [continues to updates below]
                                                                        ↓
chronicles_posts (shares_count update) → trg_total_engagement → [continues below]
                                                                        ↓
                                  Final updated creator stats
                                           ↓
                       ┌─────────────────────┼─────────────────────┐
                       ↓                     ↓                     ↓
            trg_update_leaderboard    trg_update_daily_analytics  trg_platform_daily
                       ↓                     ↓                     ↓
         chronicles_leaderboard    chronicles_creator_       chronicles_daily_
         (score updated)           analytics (daily record)   analytics (platform)
```

---

## What Gets Auto-Updated When

### When a Post is Published ✍️
1. `chronicles_creators.total_posts` ⬆️
2. `chronicles_creators.total_poems/blogs` ⬆️
3. `chronicles_creators.last_post_date` ⏰
4. `chronicles_leaderboard.score` 📊
5. `chronicles_creator_analytics` (today) 📈
6. `chronicles_daily_analytics` 📊

### When Post Gets Liked/Reacted 👍
1. `chronicles_creators.total_engagement` ⬆️
2. `chronicles_leaderboard.score` 📊
3. `chronicles_creator_analytics` (today) 📈
4. `chronicles_daily_analytics` 📊

### When Comment is Added 💬
1. `chronicles_creators.total_engagement` ⬆️
2. `chronicles_creators.last_activity_at` ⏰
3. `chronicles_leaderboard.score` 📊
4. `chronicles_creator_analytics` (today) 📈
5. `chronicles_daily_analytics` 📊

### When Post is Shared 🔗
1. `chronicles_creators.total_shares` ⬆️
2. `chronicles_creators.total_engagement` ⬆️
3. `chronicles_leaderboard.score` 📊
4. `chronicles_creator_analytics` (today) 📈
5. `chronicles_daily_analytics` 📊

---

## Table References Used

### Core Tables Being Monitored
- ✅ `chronicles_posts` (INSERT/UPDATE/DELETE)
- ✅ `chronicles_comments` (INSERT/DELETE)
- ✅ `chronicles_post_reactions` (INSERT/DELETE)
- ✅ `chronicles_comment_reactions` (INSERT/DELETE)
- ✅ `chronicles_post_shares` (data, no trigger needed - shares in posts table)

### Core Tables Being Updated
- ✅ `chronicles_creators` (stats columns)
- ✅ `chronicles_leaderboard` (automatically created)
- ✅ `chronicles_creator_analytics` (daily records)
- ✅ `chronicles_daily_analytics` (platform metrics)

### Removed References (Don't Exist)
- ❌ ~~`chronicles_post_likes`~~ → Use `chronicles_post_reactions`
- ❌ ~~`chronicles_posts_shares`~~ → Use `shares_count` column on `chronicles_posts`
- ❌ ~~`chronicles_creator_followers`~~ → Not in schema (set to 0)

---

## Configuration: Leaderboard Weights

Edit these in `chronicles_leaderboard_settings`:

```sql
UPDATE chronicles_leaderboard_settings
SET
  post_weight = 10,              -- Points per post
  engagement_weight = 2,         -- Points per engagement
  streak_weight = 5,             -- Points per day streak
  follow_weight = 1              -- Points per follower
WHERE id = (SELECT id LIMIT 1);
```

**Score Calculation**:
```
score = (total_posts × 10) +
        (total_engagement × 2) +
        (streak_count × 5) +
        (total_followers × 1)
```

---

## Performance Considerations

### Trigger Performance
- **Lightweight**: Each trigger uses efficient SQL aggregations
- **Indexed**: Queries use indexed columns (creator_id, status, type)
- **Batched**: Multiple updates in single transaction
- **Conditional**: Triggers only fire when relevant columns change

### Recommended Indexes (if not already present)
```sql
CREATE INDEX IF NOT EXISTS idx_posts_creator ON chronicles_posts(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_creator ON chronicles_comments(creator_id);
CREATE INDEX IF NOT EXISTS idx_reactions_creator ON chronicles_post_reactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON chronicles_creator_analytics(date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON chronicles_daily_analytics(date);
```

---

## Testing the Triggers

### Step 1: Verify Triggers Exist
```sql
-- Check all triggers are installed
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table LIKE 'chronicles_%'
ORDER BY event_object_table;

-- Expected: 9 triggers total
```

### Step 2: Test with New Post
```sql
-- Create a test post
INSERT INTO chronicles_posts (
  creator_id, title, content, slug, post_type, status, 
  likes_count, comments_count, shares_count
) VALUES (
  '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
  'Test Post',
  'Test content',
  'test-post-' || NOW()::text,
  'poem',
  'published',
  0, 0, 0
);

-- Check creator stats updated
SELECT total_posts, total_poems, last_post_date FROM chronicles_creators
WHERE id = '7c6c58dc-de3c-4faf-afe3-517749efa5cc';

-- Should show: total_posts increased by 1, total_poems increased by 1
```

### Step 3: Test Leaderboard
```sql
-- Check leaderboard score
SELECT score, calculated_at FROM chronicles_leaderboard
WHERE creator_id = '7c6c58dc-de3c-4faf-afe3-517749efa5cc';
```

---

## Troubleshooting

### Q: Triggers not firing?
**A**: 
1. Verify all 9 triggers exist: `SELECT COUNT(*) FROM information_schema.triggers...`
2. Check table name case sensitivity
3. Ensure trigger author has permission to update tables

### Q: Stats not updating?
**A**:
1. Check that `status = 'published'` on posts (triggers only count these)
2. Verify post has valid creator_id
3. Run verification query: `SELECT * FROM chronicles_creators WHERE id = 'YOUR_ID'`

### Q: Leaderboard empty?
**A**:
1. Run Step 3: `04-leaderboard-analytics-init.sql`
2. Verify `chronicles_leaderboard_settings` has data
3. Check trigger: `trg_update_leaderboard_on_creator_change`

### Q: Analytics not showing?
**A**:
1. Analytics are daily records - check with `date = CURRENT_DATE`
2. Run Step 3 to initialize today's records
3. Create a new post/comment to trigger update

---

## Quick Reference: Files to Run

```
1. 📄 01-creator-stats-triggers.sql
   → Creates 9 triggers + functions

2. 📄 02-backfill-creator-stats.sql
   → Fixes existing data

3. 📄 04-leaderboard-analytics-init.sql
   → Initializes leaderboard & analytics

✅ Done! System is live
```

---

## Maintenance

### Monthly: Verify Data Consistency
```sql
-- Find creators with mismatched stats
SELECT cc.id, cc.pen_name, cc.total_posts,
  (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published') as actual_posts
FROM chronicles_creators cc
WHERE cc.total_posts != (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published');
```

### Quarterly: Reindex Leaderboard
```sql
DELETE FROM chronicles_leaderboard;
-- Re-run Step 3 partial query to repopulate
```

---

## Support

All tables, columns, and triggers have been verified against your actual database schema.

**Tables Confirmed ✅**:
- chronicles_creators
- chronicles_posts  
- chronicles_comments
- chronicles_post_reactions
- chronicles_comment_reactions
- chronicles_leaderboard
- chronicles_creator_analytics
- chronicles_daily_analytics

**Tables NOT Found (ignored)** ❌:
- chronicles_post_likes → Using chronicles_post_reactions
- chronicles_posts_shares → Using shares_count column
- chronicles_creator_followers → Set to 0

