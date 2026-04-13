# Chronicles Notification System & Flagged Reviews - Migration Guide

## Overview

This migration package provides a comprehensive notification system for the Chronicles application with automatic handling of:
- Post flagging for review with automatic status changes
- Creator notifications for all actions
- Admin notifications for moderation activities
- Follower notifications
- Engagement notifications (likes, comments, etc.)

## Files Included

### 1. `001_create_flagged_reviews_table.sql`
**Purpose**: Creates the foundation for the post flagging system

**What it does**:
- Creates `chronicles_flagged_reviews` table to track flagged posts
- Supports flagging both regular posts and chain entry posts
- Includes reason categories: inappropriate_content, spam, copyright violations, etc.
- Implements Row-Level Security (RLS) policies
- Creates indexes for performance optimization

**Key features**:
- Tracks who flagged the post and when
- Tracks resolution status and who resolved it
- Stores flag reason and description
- Automatically maintains created_at and updated_at timestamps

**Table Structure**:
```sql
- id (uuid, primary key)
- post_id (uuid, references chronicles_posts)
- chain_entry_post_id (uuid, references chronicles_chain_entry_posts)
- flagged_by (uuid, references auth.users - the admin)
- reason (text: inappropriate_content, spam, copyright_violation, misinformation, hate_speech, explicit_content, harassment, other)
- description (text: admin's notes)
- status (text: pending, under_review, resolved, dismissed)
- resolution (text: admin's resolution notes)
- resolved_by (uuid: which admin resolved it)
- resolved_at (timestamp)
- created_at, updated_at
```

### 2. `002_create_notification_triggers.sql`
**Purpose**: Creates all the automatic notification triggers and functions

**What it creates**:

#### Trigger 1: `handle_flag_post_for_review()`
- **Fires**: When a post is flagged for review
- **Actions**:
  - Changes post status from published to draft
  - Creates notification for post creator
  - Creates notification for all admins
  - Logs flag reason and details

#### Trigger 2: `handle_chronicle_post_published()`
- **Fires**: When a post is published
- **Actions**:
  - Notifies all followers of the post creator
  - Creator receives notification of their own post publication

#### Trigger 3: `handle_chain_entry_post_created()`
- **Fires**: When an entry is added to a chain
- **Actions**:
  - Notifies post creator that their post was added to a chain
  - Notifies chain creator about new entry

#### Trigger 4: `handle_chain_created()`
- **Fires**: When a new writing chain is created
- **Actions**:
  - Notifies creator that chain was created successfully

#### Trigger 5: `handle_post_liked()`
- **Fires**: When someone likes a post
- **Actions**:
  - Notifies post creator (except for self-likes)
  - Stores who liked it

#### Trigger 6: `handle_post_commented()`
- **Fires**: When someone comments on a post
- **Actions**:
  - Notifies post creator with comment preview
  - Except for self-comments

#### Trigger 7: `handle_creator_followed()`
- **Fires**: When someone follows a creator
- **Actions**:
  - Notifies creator of new follower

#### Trigger 8: `handle_chain_entry_post_liked()`
- **Fires**: When someone likes a chain entry post
- **Actions**:
  - Notifies post creator

#### Trigger 9: `handle_chain_entry_post_commented()`
- **Fires**: When someone comments on a chain entry post
- **Actions**:
  - Notifies post creator with comment preview

**All triggers include**:
- Smart data retrieval (pen_names, titles, etc.)
- Prevention of self-notifications
- Rich notification data in jsonb format
- Proper error handling

### 3. `003_update_admin_notifications.sql`
**Purpose**: Updates the admin notification system and provides helper functions

**What it does**:
- Updates `chronicles_admin_notifications` to support new notification types
- Adds columns for tracking flagged reviews and chain entry posts
- Creates a comprehensive dashboard view
- Provides a helper function for admins to flag posts

**New notification types added**:
- `post_flagged`: When a post is flagged
- `chain_created`: When a chain is created
- `chain_entry_added`: When an entry is added to a chain
- `post_added_to_chain`: When a post is added to a chain
- And all existing types remain

**Helper function**: `flag_post_for_review()`
```sql
SELECT * FROM flag_post_for_review(
  p_post_id := 'post-uuid-here',
  p_chain_entry_post_id := NULL,
  p_admin_id := 'admin-uuid-here',
  p_reason := 'inappropriate_content',
  p_description := 'Contains explicit language'
);
```

**Dashboard view**: `v_flagged_posts_summary`
- Shows all flagged posts with creator info
- Shows flag reason and status
- Shows who flagged and who resolved it
- Perfect for admin dashboards

## How to Run the Migrations

### In Supabase Console:

1. **Go to SQL Editor** in your Supabase dashboard
2. **Run Migration 1** (001_create_flagged_reviews_table.sql):
   - Copy entire file content
   - Paste into SQL editor
   - Click "Run" or press Ctrl+Enter
   - Verify success message

3. **Run Migration 2** (002_create_notification_triggers.sql):
   - Copy entire file content
   - Paste into SQL editor
   - Click "Run"
   - Verify success message

4. **Run Migration 3** (003_update_admin_notifications.sql):
   - Copy entire file content
   - Paste into SQL editor
   - Click "Run"
   - Verify success message

### Error Handling:
- If you get "table already exists" errors, the migrations handle this with `DROP IF EXISTS`
- If you get constraint errors, it means the tables don't exist yet - ensure you run in order
- All migrations are idempotent (safe to run multiple times)

## Notification Types & When They're Created

| Notification Type | Created When | Recipient | Example |
|---|---|---|---|
| `new_post_published` | Post published | Followers & creator | "New post from @author" |
| `post_liked` | Someone likes post | Post creator | "@user liked your post" |
| `post_commented` | Someone comments | Post creator | "@user commented: '...'" |
| `post_shared` | Post is shared | Post creator | (future) |
| `follower_joined` | New follower | Creator | "@user started following you" |
| `chain_created` | Chain created | Chain creator | "Your writing chain created" |
| `chain_entry_added` | Entry added to chain | Chain creator & post creator | "Your post added to chain" |
| `post_flagged_for_review` | Post flagged | Creator | "Your post flagged for review" |
| `system` | System events | Varies | System messages |

## How Flagging Works (Step-by-Step)

1. **Admin opens post in details modal**
2. **Admin clicks "Flag for Review" button** (to be added to UI)
3. **System:**
   - Inserts record into `chronicles_flagged_reviews`
   - Trigger fires: `handle_flag_post_for_review()`
   - Post status automatically changes: published → draft
   - Creator receives notification: "Your post flagged for review"
   - Admin receives notification: "Post flagged by [admin name]"
   - Post becomes invisible to public (status = draft)
4. **Creator:**
   - Sees notification in their notification center
   - Can see their post is now in draft status
   - Can edit and re-publish it
5. **Admin:**
   - Can view all flagged posts in dashboard
   - Can mark as reviewed/resolved
   - Can add resolution notes

## Database Changes Summary

### New Tables:
- `chronicles_flagged_reviews` - Flagged post tracking

### New Columns:
- `chronicles_admin_notifications.flagged_review_id`
- `chronicles_admin_notifications.chain_entry_post_id`
- `chronicles_notifications.flagged_for_review`

### New Views:
- `v_flagged_posts_summary` - Admin dashboard view

### New Functions:
- `flag_post_for_review()` - Helper function for admins
- `handle_flag_post_for_review()` - Trigger function
- `handle_chronicle_post_published()` - Trigger function
- `handle_chain_entry_post_created()` - Trigger function
- `handle_chain_created()` - Trigger function
- `handle_post_liked()` - Trigger function
- `handle_post_commented()` - Trigger function
- `handle_creator_followed()` - Trigger function
- `handle_chain_entry_post_liked()` - Trigger function
- `handle_chain_entry_post_commented()` - Trigger function

### New Triggers:
- `trigger_flag_post_for_review`
- `trigger_chronicle_post_published`
- `trigger_chain_entry_post_created`
- `trigger_chain_created`
- `trigger_post_liked`
- `trigger_post_commented`
- `trigger_creator_followed`
- `trigger_chain_entry_post_liked`
- `trigger_chain_entry_post_commented`

## Notification Data Structure

All notifications include rich metadata in JSON format:

**Example notification for flagged post**:
```json
{
  "id": "notif-uuid",
  "creator_id": "creator-uuid",
  "type": "post_flagged_for_review",
  "title": "Your content has been flagged for review",
  "message": "Your post... has been flagged for review",
  "data": {
    "flag_reason": "inappropriate_content",
    "flag_description": "Contains explicit language",
    "chain_entry_post_id": null,
    "flagged_at": "2026-04-13T..."
  }
}
```

**Example notification for post published**:
```json
{
  "id": "notif-uuid",
  "creator_id": "follower-uuid",
  "type": "new_post_published",
  "title": "New post from @author",
  "message": "A new post... has been published",
  "data": {
    "post_excerpt": "First few words...",
    "post_type": "blog",
    "published_at": "2026-04-13T..."
  }
}
```

## Admin API Endpoint (To Be Implemented)

Once this migration is complete, create this API endpoint:

```typescript
// POST /api/admin/chronicles/flag-post
{
  "post_id": "uuid (optional)",
  "chain_entry_post_id": "uuid (optional)",
  "reason": "enum: inappropriate_content, spam, ...",
  "description": "string"
}

// Response
{
  "success": true,
  "flag_id": "uuid",
  "message": "Post successfully flagged for review"
}
```

## Testing the System

### Test 1: Publishing a Post
1. Create and publish a post as a creator
2. Have followers logged in
3. Followers should see notification within seconds

### Test 2: Flagging a Post
1. As admin, execute: `SELECT * FROM flag_post_for_review(...)`
2. Check that:
   - Flag inserted in `chronicles_flagged_reviews`
   - Post status changed to draft
   - Creator received notification
   - Admin received notification

### Test 3: Dashboard View
1. Execute: `SELECT * FROM v_flagged_posts_summary;`
2. Should show all flagged posts with details

## Potential Issues & Solutions

### Issue: Trigger doesn't fire
**Solution**: Check that table writes are coming through the database, not through direct API inserts that bypass triggers

### Issue: Notification not sent to creator
**Solution**: Verify `chronicles_creators` exists and has `auth_user_id` column matching `auth.users.id`

### Issue: "Function does not exist" error
**Solution**: Ensure all three migrations ran successfully in order

### Issue: RLS preventing admin from reading notifications
**Solution**: Check RLS policies - they're designed to allow admins to read flagged reviews

## Next Steps

1. **Implement Admin API Endpoint**: Create `/api/admin/chronicles/flag-post` endpoint
2. **Update UI**: Add "Flag for Review" button to post detail modal
3. **Create Admin Dashboard**: Display `v_flagged_posts_summary` in admin panel
4. **Testing**: Test all notification scenarios
5. **Monitoring**: Check notification logs for errors

## Questions or Issues?

Check:
1. That all three migration files ran without errors
2. Table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'chronicles_flagged_reviews';`
3. Triggers exist: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public';`
4. View exists: `SELECT * FROM v_flagged_posts_summary LIMIT 1;`

---

**Creation Date**: 2026-04-13  
**Migration Version**: 1.0  
**Database**: Supabase PostgreSQL  
**Compatibility**: Next.js 15+, React 18+
