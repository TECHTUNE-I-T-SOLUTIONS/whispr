# Chronicles API Routes - Investigation & Fix Guide

## Current Status

### ✅ Working Endpoints
- `GET /api/chronicles/posts/{id}` - Returns 200 (post data exists)

### ❌ Broken Endpoints (404s)
- `GET /api/chronicles/posts/{id}/comments` - Missing
- `GET /api/chronicles/posts/{id}/reactions` - Missing
- `POST /api/chronicles/posts/{id}/reactions` - Missing

---

## Root Cause: Missing Database Tables

### Database Schema Issues

Your database schema is **incomplete for chronicles reactions**:

```sql
-- EXISTS: Chronicles Comments ✅
CREATE TABLE public.chronicles_comments (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL FOREIGN KEY (chronicles_posts),
  creator_id uuid NOT NULL FOREIGN KEY (chronicles_creators),
  content text NOT NULL,
  status text DEFAULT 'approved',
  created_at timestamp,
  updated_at timestamp
);

-- MISSING: Chronicles Post Reactions ❌
-- There is NO chronicles_post_reactions table!
-- Only exists: chronicles_comment_reactions (for comments only)

-- EXISTS: Generic Reactions Table ✅
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY,
  post_id uuid,
  user_id uuid FOREIGN KEY (auth.users),
  reaction_type text CHECK (reaction_type IN ('like', 'love', 'wow', 'haha', 'sad', 'angry')),
  created_at timestamp
);
```

---

## Fix: Recommended Implementation

### **Option A: Create Chronicles-Specific Reactions Table (RECOMMENDED)**

#### 1. Create Migration

```sql
-- Create chronicles_post_reactions table
CREATE TABLE public.chronicles_post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like'::text 
    CHECK (reaction_type = ANY(ARRAY['like'::text, 'love'::text, 'wow'::text, 'haha'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_post_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_post_reactions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_post_reactions_unique UNIQUE (post_id, creator_id, reaction_type)
);

-- Create index for faster queries
CREATE INDEX idx_chronicles_post_reactions_post_id ON public.chronicles_post_reactions(post_id);
CREATE INDEX idx_chronicles_post_reactions_creator_id ON public.chronicles_post_reactions(creator_id);
```

#### 2. New API Endpoints Required

```typescript
// GET - Fetch post reactions and user's reaction
GET /api/chronicles/posts/{postId}/reactions
Response:
{
  reactions: [
    { type: "like", count: 42 },
    { type: "love", count: 5 }
  ],
  userReaction: "like" // or null if not reacted
}

// POST - Add reaction
POST /api/chronicles/posts/{postId}/reactions
Body: { type: "like" }
Response: { success: true, action: "added" }

// DELETE - Remove reaction
DELETE /api/chronicles/posts/{postId}/reactions/{reactionType}
Response: { success: true, action: "removed" }
```

#### 3. MySQL/PostgreSQL Implementation

```sql
-- Aggregate reactions by type
SELECT 
  reaction_type,
  COUNT(*) as count
FROM public.chronicles_post_reactions
WHERE post_id = $1
GROUP BY reaction_type;

-- Check user reaction
SELECT reaction_type
FROM public.chronicles_post_reactions
WHERE post_id = $1 AND creator_id = $2;
```

---

### **Option B: Use Generic Reactions Table (QUICK FIX)**

If you want a quick fix **without creating new tables**, use the existing `reactions` table:

#### Updated API Routes (Flutter App Already Using These)

```
GET /api/reactions?post_id={postId}
POST /api/reactions { post_id: "...", reaction_type: "like" }
DELETE /api/reactions?post_id={postId}&reaction_type=like
```

#### Notes:
- ✅ Works immediately with existing table
- ❌ Mixes admin posts and chronicle posts in same table
- ❌ No separation of concerns
- ❌ Harder to scale/manage different post types

---

## Implementation Checklist

### For Options A (Chronicles-Specific - RECOMMENDED):

- [ ] Create `chronicles_post_reactions` table via migration
- [ ] Create API endpoint: `GET /api/chronicles/posts/{id}/reactions`
- [ ] Create API endpoint: `POST /api/chronicles/posts/{id}/reactions`
- [ ] Create API endpoint: `DELETE /api/chronicles/posts/{id}/reactions/{type}`
- [ ] Update `chronicles_posts.likes_count` on reaction changes
- [ ] Test endpoints with Flutter app
- [ ] Verify auth/permissions

### For Option B (Generic - Quick Fix):

- [ ] Verify `POST /api/reactions` endpoint exists and works
- [ ] Verify `GET /api/reactions` endpoint exists and works
- [ ] Verify `DELETE /api/reactions` endpoint exists and works
- [ ] Update Flutter app to use correct parameter names
- [ ] Test with Flask/Express server

---

## Flutter App Changes Made

Your Flutter app has been updated to use:

```dart
// Comments - using generic endpoint
await apiService.get('/comments?post_id={postId}');
await apiService.post('/comments', data: { post_id, content, ... });

// Reactions - using generic endpoint
await apiService.get('/reactions?post_id={postId}');
await apiService.post('/reactions', data: { post_id, reaction_type: 'like' });
await apiService.delete('/reactions?post_id={postId}&reaction_type=like');
```

---

## Next Steps

1. **Determine**: Which option (A or B) you want to implement
2. **Backend**: Implement missing API endpoints
3. **Testing**: Use cURL or Postman to test endpoints
4. **Flutter**: The app is already prepared for both approaches

### Test Commands

```bash
# Test get reactions
curl http://localhost:3000/api/reactions?post_id=f8966533-7fa4-4b45-9f46-b49af86c21f6

# Test add reaction
curl -X POST http://localhost:3000/api/reactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"post_id":"f8966533-7fa4-4b45-9f46-b49af86c21f6","reaction_type":"like"}'

# Test delete reaction
curl -X DELETE http://localhost:3000/api/reactions?post_id=f8966533-7fa4-4b45-9f46-b49af86c21f6&reaction_type=like \
  -H "Authorization: Bearer YOUR_TOKEN"
```
