# Writing Chain Entries UI & Database Update Summary

## Overview
Updated the Writing Chain Entries feature to display all entry details inline without navigating to a separate details screen, and created dedicated tables for tracking likes and comments on chain entry posts.

---

## 1. Database Schema Changes

### New Tables Created via SQL Migration

**File:** `d:\Codes\whispr\database_migrations\migration_chain_entry_comments_likes.sql`

#### 1.1 `chronicles_chain_entry_post_likes` Table
- Tracks individual user likes on chain entry posts
- Fields:
  - `id` (uuid, primary key)
  - `chain_entry_post_id` (uuid, FK to chronicles_chain_entry_posts)
  - `creator_id` (uuid, FK to chronicles_creators)
  - `reaction_type` (text: 'like', 'love', 'wow', 'haha', 'sad', 'angry')
  - `created_at` (timestamp)
- Unique constraint on (chain_entry_post_id, creator_id) to prevent duplicate likes
- Includes indexes for performance

#### 1.2 `chronicles_chain_entry_post_comments` Table
- Stores comments on chain entry posts
- Fields:
  - `id` (uuid, primary key)
  - `chain_entry_post_id` (uuid, FK to chronicles_chain_entry_posts)
  - `creator_id` (uuid, FK to chronicles_creators)
  - `content` (text)
  - `parent_comment_id` (uuid, FK - self-referencing for comment threads)
  - `likes_count` (integer, default 0)
  - `replies_count` (integer, default 0)
  - `status` (text: 'approved', 'pending', 'rejected', 'hidden')
  - `created_at`, `updated_at` (timestamps)
- Supports nested comment threads through parent_comment_id

#### 1.3 `chronicles_chain_entry_post_comment_reactions` Table
- Tracks reactions on comments (like, helpful, love, funny)
- Fields:
  - `id` (uuid, primary key)
  - `comment_id` (uuid, FK to chronicles_chain_entry_post_comments)
  - `creator_id` (uuid, FK to chronicles_creators)
  - `reaction_type` (text)
  - `created_at` (timestamp)
- Unique constraint on (comment_id, creator_id)

### Automatic Count Updates via Triggers

Three PostgreSQL triggers automatically maintain count fields:
1. **trigger_update_chain_entry_post_likes_count** - Updates `likes_count` in chain_entry_posts
2. **trigger_update_chain_entry_post_comments_count** - Updates `comments_count` in chain_entry_posts
3. **trigger_update_chain_entry_post_reply_count** - Updates `replies_count` in comments

---

## 2. Flutter Frontend Changes

### Modified Files

#### 2.1 `chain_entries_screen.dart`

**Removed:**
- Navigation to separate details screen (`context.go('/post/${entry.post!.id}')`)
- Limited entry card display

**Added:**
- `_buildEntryCard()` method: Renders full entry details inline
- `_ExpandableContent` widget: Expandable "See more" / "See less" functionality
- Cover image display with image loading states
- Category and tags display as chips
- Creator name and profile integration
- Full content display with smart truncation

**Updated Fields in Data Models:**
- **PostSummary class**: Now includes
  - `content` (String) - Full entry content
  - `coverImageUrl` (String?) - Cover image URL
  - `category` (String?) - Post category
  - `tags` (List<String>) - Post tags
  - `creatorName` (String?) - Creator's pen name
  - `creatorId` (String?) - Creator ID

**API Data Mapping:**
- Updated `_fetchChainDetails()` to extract and map full content data from API response
- Includes creator information from nested response

---

## 3. Next.js Backend API Updates

### Modified Files

#### 3.1 `app/api/chronicles/chains/[chainId]/route.ts`

**GET Endpoint Changes:**
- Added `category` and `tags` fields to response transformation
- Now returns complete data structure with:
  - Full `content` field
  - `cover_image_url`
  - `category` and `tags`
  - Creator information (`pen_name`, `profile_image_url`)

**POST Endpoint Changes:**
- Updated POST response selection to include creator information
- Returns complete entry data with nested creator details

#### 3.2 `app/api/chronicles/chains/entries/reactions/route.ts`

**Complete Rewrite - Now Uses Dedicated Likes Table:**
- **Old Behavior:** Simply incremented a counter
- **New Behavior:**
  - Checks if user already liked the post
  - Toggle like/unlike action
  - Inserts/deletes from `chronicles_chain_entry_post_likes` table
  - Returns individual like status
  - Still updates `likes_count` for quick access

**Response Includes:**
```json
{
  "success": true,
  "action": "liked" | "unliked",
  "likes_count": 42,
  "message": "Successfully liked the post"
}
```

#### 3.3 `app/api/chronicles/chains/entries/comments/route.ts`

**Complete Rewrite - Now Uses Dedicated Comments Table:**

**GET Endpoint:**
- Fetches comments from `chronicles_chain_entry_post_comments` table
- Returns parent comments only (replies handled separately)
- Includes creator data with each comment
- Ordered by creation time (newest first)

**POST Endpoint:**
- Creates comment in dedicated `chronicles_chain_entry_post_comments` table
- Verifies user authentication via creator profile
- Returns full comment data with creator information
- Sets status to 'approved' by default (can be modified for moderation)

---

## 4. User Interface Enhancements

### Chain Entry Card Display

Each entry now shows:
1. **Header Section**
   - Entry number (#1, #2, etc.)
   - Entry title
   - Edit/Delete menu (three-dots)

2. **Visual Content**
   - Cover image (with error handling and loading state)
   - Category badge
   - Tag chips

3. **Metadata**
   - Creator name ("By [Pen Name]")
   - Posted date/time

4. **Main Content**
   - Excerpt (if available)
   - **Full content with expandable "See more" button**
     - Shows first ~10 lines or 500 characters
     - Click "See more" to expand full content
     - Click "See less" to collapse

5. **Engagement Section**
   - Like button with count (❤️)
   - Comment button with count (💬)
   - Share button with count (↗️)

### Expandable Content Widget

The `_ExpandableContent` widget:
- Smart expansion logic based on character count and line count
- Only shows "See more" button if content exceeds thresholds
- Smooth state transitions
- Primary color link styling for expand/collapse text

---

## 5. API Endpoint Summary

### Base Endpoints
- **GET** `/chronicles/chains/{chainId}` - Fetch chain with all entries (full details)
- **POST** `/chronicles/chains/{chainId}` - Create new entry

### Entry Operations
- **GET** `/chronicles/chains/entries/{entryId}` - Fetch single entry
- **PUT** `/chronicles/chains/entries/{entryId}` - Update entry
- **DELETE** `/chronicles/chains/entries/{entryId}` - Delete entry (with ownership verification)

### Engagement
- **GET** `/chronicles/chains/entries/reactions?entry_post_id={id}` - Get reactions count
- **POST** `/chronicles/chains/entries/reactions` - Like/unlike entry
- **GET** `/chronicles/chains/entries/comments?entry_post_id={id}` - Get comments
- **POST** `/chronicles/chains/entries/comments` - Post comment

---

## 6. Data Flow

### Entry Display Flow
1. User opens writing chain
2. App calls `GET /chronicles/chains/{chainId}`
3. API returns chain with all entries including:
   - Full content
   - Cover image URL
   - Category & tags
   - Creator info (pen_name, profile_image_url)
   - Like/comment/share counts
4. Flutter displays entry card with all details inline
5. Content auto-truncates with expandable "See more"

### Like Flow
1. User clicks like button
2. Frontend posts to `POST /chronicles/chains/entries/reactions`
3. Backend checks if user already liked (in `chronicles_chain_entry_post_likes`)
4. If yes, delete the like; if no, insert new like
5. Trigger updates `likes_count` in chain_entry_posts
6. Response returns updated count and action (liked/unliked)

### Comment Flow
1. User opens comment dialog and submits
2. Frontend posts to `POST /chronicles/chains/entries/comments`
3. Backend creates comment in `chronicles_chain_entry_post_comments`
4. Comment includes creator info, content, status
5. Trigger updates `comments_count` in chain_entry_posts
6. Frontend refreshes to show new comment

---

## 7. Database Migration Instructions

### Prerequisites
- Access to Supabase PostgreSQL database
- Tables: `chronicles_creators`, `chronicles_writing_chains`, `chronicles_chain_entries`, `chronicles_chain_entry_posts`

### Steps
1. Run the SQL file: `database_migrations/migration_chain_entry_comments_likes.sql`
2. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'chronicles_chain_entry%'
   ORDER BY table_name;
   ```
3. Verify indexes were created:
   ```sql
   SELECT * FROM pg_indexes 
   WHERE tablename LIKE 'chronicles_chain_entry%';
   ```

---

## 8. Testing Checklist

- [ ] Create a new writing chain entry
- [ ] Verify entry displays with all fields (cover image, title, content, etc.)
- [ ] Test "See more" button on long content
- [ ] Like an entry and verify count increases
- [ ] Unlike and verify count decreases
- [ ] Post a comment
- [ ] Verify comment appears immediately
- [ ] Edit entry and verify changes update UI
- [ ] Delete entry and verify it's removed from list
- [ ] Test with multiple users to verify individual like tracking
- [ ] Verify cover image loads correctly
- [ ] Test category and tag display

---

## 9. Future Enhancements

- [ ] Display comment thread with replies
- [ ] Add comment reactions (like helpful, funny, etc.)
- [ ] Show real-time updates when others like/comment
- [ ] Add edit/delete functionality for comments
- [ ] Implement content moderation workflow
- [ ] Add rich text editor for better formatting
- [ ] Support for markdown formatting
- [ ] Image uploads within content
- [ ] Mention notifications (@mentions)

---

## 10. Important Notes

1. **Backward Compatibility:** Old entries without cover_image_url will display without the image section (graceful degradation)

2. **Performance:** Triggers automatically maintain count fields, so frontend always gets accurate counts

3. **Authentication:** All endpoints verify user ownership/authentication via JWT token or cookies

4. **Soft Deletes:** Currently using hard deletes; consider implementing soft deletes in future

5. **Content Moderation:** Comment status can be 'pending', 'approved', 'rejected', or 'hidden' - can add moderation later

---

## File Changes Summary

| File | Type | Changes |
|------|------|---------|
| chain_entries_screen.dart | Flutter | Complete UI refactor for inline display, added expandable content |
| route.ts (chains/[chainId]) | Next.js | Enhanced GET/POST to return full data with categories, tags, creator info |
| route.ts (reactions) | Next.js | Rewrote to use dedicated likes table instead of just counting |
| route.ts (comments) | Next.js | Rewrote to use dedicated comments table |
| migration_chain_entry_comments_likes.sql | SQL | 3 new tables + 3 triggers for automatic count updates |

---

**Last Updated:** 2026-03-19
**Status:** Ready for database migration and deployment
