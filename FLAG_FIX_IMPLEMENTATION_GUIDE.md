# Flag Functionality Fix - Complete Implementation Guide

## 🔍 Problems Identified & Fixed

### 1. **Missing RPC Function** ❌ → ✅ FIXED
- **Issue**: API was calling `flag_post_for_review()` RPC function that didn't exist
- **Impact**: Flag requests returned 200 but nothing was saved to database
- **Fix**: Created new migration `005_create_flag_post_for_review_rpc.sql` with complete RPC function
- **Location**: `/migrations/005_create_flag_post_for_review_rpc.sql`

### 2. **Missing State Variable** ❌ → ✅ FIXED
- **Issue**: `isFlagging` state was used in moderation page but never defined
- **Impact**: Code would crash when trying to flag content
- **Fix**: Added `const [isFlagging, setIsFlagging] = useState(false);` to component state
- **Location**: `/app/admin/chronicles/chains/moderation/page.tsx` (line ~70)

### 3. **Tab Name Mismatch** ❌ → ✅ FIXED
- **Issue**: submitFlag was checking for `activeTab === 'post'` but state is `'posts'`
- **Impact**: Flag requests used wrong tab names, would fail silently
- **Fix**: Updated all tab checks to match actual state values:
  - `'post'` → `'posts'`
  - `'chain'` → `'chains'`
  - `'entries'` → `'entries'` ✓
- **Location**: `/app/admin/chronicles/chains/moderation/page.tsx` (line ~189-203)

### 4. **Incorrect RPC Parameters** ❌ → ✅ FIXED
- **Issue**: `p_post_id: post_id || chain_id || null` lumped chain_id into post_id
- **Impact**: Chain flags would be misidentified as posts
- **Fix**: Pass parameters separately:
  - `p_post_id: post_id || null`
  - `p_chain_id: chain_id || null` (NEW)
  - `p_chain_entry_post_id: chain_entry_post_id || null`
- **Location**: `/app/api/admin/chronicles/flag-post/route.ts` (line ~117-123)

---

## 📋 Implementation Steps

### Step 1: Run the RPC Function Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy entire content from: `/migrations/005_create_flag_post_for_review_rpc.sql`
4. Click **Run**
5. Verify success message appears

**Expected Output**:
```
Query executed successfully with 0 rows affected
```

### Step 2: Verify the Migration

Run this query in Supabase SQL Editor to confirm the function exists:

```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'flag_post_for_review' 
AND routine_schema = 'public';
```

**Expected Result**: 1 row showing `flag_post_for_review` as `FUNCTION` type

### Step 3: Restart Development Server

```bash
# Stop the server if running
# Press Ctrl+C in terminal

# Restart
npm run dev
```

---

## ✅ Testing Checklist

### Test 1: Flag a Post
- [ ] Go to Admin → Chronicles → Moderation
- [ ] Click **Posts** tab
- [ ] Click **Flag** button on any post
- [ ] Select a reason (e.g., "Spam")
- [ ] Click **Flag Content**
- [ ] ✅ Green toast shows "Content flagged for review successfully"
- [ ] ✅ List refreshes automatically
- [ ] ✅ Post status changes to "draft" (visible in detail modal)

### Test 2: Flag a Chain
- [ ] Click **Chains** tab
- [ ] Click **Flag** button on any chain
- [ ] Select a reason
- [ ] Click **Flag Content**
- [ ] ✅ Green toast shows success
- [ ] ✅ List refreshes

### Test 3: Flag a Chain Entry
- [ ] Click **Entries** tab
- [ ] Click **Flag** button on any entry
- [ ] Select a reason with description
- [ ] Click **Flag Content**
- [ ] ✅ Green toast shows success
- [ ] ✅ Entry status changes to "draft"

### Test 4: Validation Errors
- [ ] Try clicking **Flag** without selecting reason
- [ ] ✅ Button is disabled until reason selected
- [ ] Try submitting empty reason manually (shouldn't happen)
- [ ] ✅ Red toast shows error message

### Test 5: Database Verification
Run this in Supabase SQL Editor:

```sql
SELECT 
  id,
  post_id,
  chain_entry_post_id,
  reason,
  status,
  created_at,
  flagged_by
FROM chronicles_flagged_reviews
ORDER BY created_at DESC
LIMIT 10;
```

**Expected**: New flag records should appear immediately after flagging

### Test 6: Notification System
- [ ] After flagging, check `chronicles_admin_notifications` table
- [ ] ✅ New notification created with type 'post_flagged'
- [ ] ✅ Notification includes flag reason in data

---

## 🔧 How It Works Now

### Data Flow:

```
User clicks Flag Button
        ↓
Toast shows "Flagging..." with spinner
        ↓
submitFlag() called
        ↓
POST /api/admin/chronicles/flag-post
        ↓
API validates input & checks admin auth
        ↓
Calls RPC: supabase.rpc('flag_post_for_review', {...})
        ↓
RPC function inserts record into chronicles_flagged_reviews
        ↓
TRIGGER: handle_flag_post_for_review() fires AFTER INSERT
        ↓
Trigger changes content status to 'draft'
        ↓
Trigger creates creator notification ("Your post was flagged")
        ↓
Trigger creates admin notification ("Post flagged for review")
        ↓
RPC function returns: { success: true, flag_id: uuid }
        ↓
API returns 200 with success message
        ↓
Frontend toast shows "Content flagged for review successfully"
        ↓
Frontend refreshes list (shows updated statuses)
        ↓
Detail modal closes automatically
```

---

## 📊 Database Tables Involved

### 1. `chronicles_flagged_reviews` (Main Table)
- Stores flag records
- Foreign keys: post_id, chain_entry_post_id, flagged_by
- Status: pending/under_review/resolved/dismissed
- Trigger fires on INSERT

### 2. `chronicles_posts` (Updated by Trigger)
- Status column changed to 'draft' when flagged

### 3. `chronicles_chain_entry_posts` (Updated by Trigger)
- Status column changed to 'draft' when flagged

### 4. `chronicles_writing_chains` (Updated by Trigger)
- Status column changed to 'draft' when flagged (via trigger logic)

### 5. `chronicles_notifications` (Created by Trigger)
- Notification sent to content creator
- Type: 'post_flagged'
- Includes flag reason in data

### 6. `chronicles_admin_notifications` (Created by Trigger)
- Notification sent to all admins
- Type: 'post_flagged'
- Includes flag details

---

## 🐛 Troubleshooting

### Issue: Toast shows error "Cannot read properties of undefined"
- **Cause**: isFlagging state not initialized
- **Fix**: ✅ Already fixed in moderation page
- **Verify**: Check line ~70 of moderation/page.tsx has `const [isFlagging, setIsFlagging] = useState(false);`

### Issue: Flag button doesn't work, no response
- **Cause**: RPC function doesn't exist
- **Fix**: ✅ Run the migration from Step 1
- **Verify**: Run the verification query from Step 2

### Issue: Toast shows "Cannot flag multiple content types at once"
- **Cause**: API sending wrong parameters
- **Fix**: ✅ Already fixed in API endpoint
- **Verify**: Check API is passing p_post_id, p_chain_id, p_chain_entry_post_id separately

### Issue: Status doesn't change to draft
- **Cause**: Trigger function not executing
- **Fix**: Verify trigger exists and function works
- **Run**: 
  ```sql
  SELECT trigger_name, event_manipulation, event_object_table
  FROM information_schema.triggers
  WHERE trigger_name = 'trigger_flag_post_for_review';
  ```
- **Expected**: 1 row showing trigger on `chronicles_flagged_reviews` table

### Issue: Status changed but notification didn't appear
- **Cause**: Trigger function created notification but issue elsewhere
- **Fix**: Check if notification table has records
- **Run**:
  ```sql
  SELECT COUNT(*) FROM chronicles_notifications WHERE type = 'post_flagged';
  ```

---

## 📝 Code Changes Summary

### File: `/app/admin/chronicles/chains/moderation/page.tsx`
- **Added**: `const [isFlagging, setIsFlagging] = useState(false);` (state)
- **Fixed**: Tab name checks in submitFlag from 'post'/'chain' to 'posts'/'chains'

### File: `/app/api/admin/chronicles/flag-post/route.ts`
- **Fixed**: RPC parameters to pass chain_id separately

### File: `/migrations/005_create_flag_post_for_review_rpc.sql` (NEW)
- **Created**: New RPC function `flag_post_for_review()` with complete implementation
- **Handles**: All content types (posts, chains, entries)
- **Returns**: Success/error with flag_id

---

## 🎯 Next Steps (After Verification)

1. ✅ Run migration in Supabase
2. ✅ Restart Next.js dev server
3. ✅ Test all 6 scenarios in Testing Checklist
4. ✅ Verify database records created
5. ✅ Check notifications appearing in real-time
6. 📝 Document any edge cases found

---

## ✨ Success Indicators

You'll know everything is working when:

✅ Flag button shows spinner while submitting
✅ Toast notification appears with success message
✅ Post status changes from "published" to "draft"
✅ List refreshes automatically showing new status
✅ Database records appear in `chronicles_flagged_reviews` table
✅ Notifications created in `chronicles_admin_notifications` table
✅ No console errors in browser DevTools
✅ No API errors (200 response status)
✅ Detail modal closes after successful flag
✅ All 8 flag reasons appear in dropdown

---

## 📞 Support

If issues persist:

1. Check browser console for JavaScript errors (F12 → Console)
2. Check network tab for API response (F12 → Network → POST flag-post → Response)
3. Check Supabase function logs for RPC errors
4. Verify migration ran successfully with verification queries above
