# Migration Execution Checklist

## Pre-Migration Checklist
- [ ] Backup your Supabase database
- [ ] Ensure you have admin access to Supabase
- [ ] Have all three SQL files ready
- [ ] Check that you're in the correct Supabase project (not production if testing)

## Migration Execution

### Step 1: Run Migration 001
```
File: 001_create_flagged_reviews_table.sql
```
- [ ] Copy entire file content
- [ ] Go to Supabase → SQL Editor
- [ ] Paste content into editor
- [ ] Review for errors
- [ ] Click "Run" or Ctrl+Enter
- [ ] Verify success: "CREATE TABLE public.chronicles_flagged_reviews"

**Expected Result**: Table created with all indexes and RLS policies

---

### Step 2: Run Migration 002
```
File: 002_create_notification_triggers.sql
```
- [ ] Copy entire file content
- [ ] Go to Supabase → SQL Editor
- [ ] Paste content into editor
- [ ] Review for errors (will see several DROP IF EXISTS - this is normal)
- [ ] Click "Run"
- [ ] Verify success: "All triggers and functions have been created successfully"

**Expected Result**: 
- 9 trigger functions created
- 9 triggers created
- CHECK constraint added to chronicles_notifications

---

### Step 3: Run Migration 003
```
File: 003_update_admin_notifications.sql
```
- [ ] Copy entire file content
- [ ] Go to Supabase → SQL Editor
- [ ] Paste content into editor
- [ ] Review for errors
- [ ] Click "Run"
- [ ] Verify success: "All updates completed successfully"

**Expected Result**:
- Admin notifications constraint updated
- New columns added
- View created: v_flagged_posts_summary
- Helper function created: flag_post_for_review

---

## Post-Migration Verification

### Verify Tables
```sql
-- Run this in SQL Editor to verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chronicles_flagged_reviews', 'chronicles_notifications', 'chronicles_admin_notifications')
ORDER BY table_name;
```
- [ ] Should return 3 rows: chronicles_admin_notifications, chronicles_flagged_reviews, chronicles_notifications

### Verify Triggers
```sql
-- Run this to verify all triggers were created
SELECT trigger_name, trigger_schema 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'trigger_%'
ORDER BY trigger_name;
```
- [ ] Should return 9 rows (all trigger_* functions)

### Verify Functions
```sql
-- Run this to verify all functions were created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'handle_%'
ORDER BY routine_name;
```
- [ ] Should return 9 rows (all handle_* functions)

### Verify View
```sql
-- Run this to verify view was created
SELECT * FROM v_flagged_posts_summary LIMIT 1;
```
- [ ] Should execute without errors (may return 0 rows if no flagged posts yet)

### Verify Columns
```sql
-- Run this to verify new columns were added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'chronicles_notifications' 
AND column_name IN ('flagged_for_review', 'related_post_id')
ORDER BY column_name;
```
- [ ] Should return at least 2 rows

---

## Common Issues & Solutions

### Issue: "ERROR: table "chronicles_flagged_reviews" already exists"
**Solution**: This is okay! It means you're re-running the migration
- [ ] Run migration anyway (the DROP TABLE IF EXISTS will handle it)
- [ ] All data will be preserved with CASCADE

### Issue: "ERROR: column already exists"
**Solution**: This means the column was already added previously
- [ ] This is handled by the "ADD COLUMN IF NOT EXISTS" clauses
- [ ] Safe to run again

### Issue: "ERROR: constraint already exists"
**Solution**: The constraint is already in place
- [ ] This is normal if re-running
- [ ] The queries use DROP ... IF EXISTS to handle this

### Issue: "ERROR: trigger already exists"
**Solution**: Triggers are recreated safely
- [ ] All DROP TRIGGER IF EXISTS clauses ensure clean recreation
- [ ] Safe to run multiple times

### Issue: "ERROR: permission denied"
**Solution**: You need proper Supabase permissions
- [ ] Ensure you're logged in as project admin
- [ ] Check your role has CREATE FUNCTION, CREATE TRIGGER permissions
- [ ] Contact Supabase support if needed

### Issue: Notification not appearing
**Action items**:
- [ ] Verify triggers exist: `SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';`
- [ ] Check that table writes are happening (insert a test record)
- [ ] Verify RLS policies allow access
- [ ] Check application logs for errors

---

## Next Steps After Migration

### 1. Add Flag Post API Endpoint
Create file: `app/api/admin/chronicles/flag-post/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, chain_entry_post_id, reason, description } = body;
    
    const supabase = createClient();
    
    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    const { data: admin } = await supabase
      .from('admin')
      .select('id')
      .eq('id', user?.id)
      .single();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Call the database function
    const { data, error } = await supabase
      .rpc('flag_post_for_review', {
        p_post_id: post_id,
        p_chain_entry_post_id: chain_entry_post_id,
        p_admin_id: admin.id,
        p_reason: reason,
        p_description: description
      });
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### 2. Update Modal UI
Add button to post detail modal in your admin page:

```tsx
<Button
  variant="outline"
  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
  onClick={() => handleFlagPost(selectedEntry.id)}
>
  <Flag className="w-4 h-4 mr-2" />
  Flag for Review
</Button>
```

### 3. Test the Complete Flow
- [ ] Create a test post as creator
- [ ] Flag it as admin
- [ ] Verify post status changed to draft
- [ ] Verify creator received notification
- [ ] Verify admin received notification

### 4. Monitor Notifications
- [ ] Check `chronicles_notifications` table for new entries
- [ ] Check `chronicles_admin_notifications` table
- [ ] Verify notification data is correct

---

## Rollback Instructions

If something goes wrong and you need to rollback:

```sql
-- Drop all new objects (in reverse order of creation)
DROP VIEW IF EXISTS v_flagged_posts_summary CASCADE;
DROP FUNCTION IF EXISTS flag_post_for_review(uuid, uuid, uuid, text, text) CASCADE;
DROP TRIGGER IF EXISTS trigger_chain_entry_post_commented ON chronicles_chain_entry_post_comments CASCADE;
DROP TRIGGER IF EXISTS trigger_chain_entry_post_liked ON chronicles_chain_entry_post_likes CASCADE;
DROP TRIGGER IF EXISTS trigger_creator_followed ON chronicles_followers CASCADE;
DROP TRIGGER IF EXISTS trigger_post_commented ON chronicles_comments CASCADE;
DROP TRIGGER IF EXISTS trigger_post_liked ON chronicles_post_reactions CASCADE;
DROP TRIGGER IF EXISTS trigger_chain_created ON chronicles_writing_chains CASCADE;
DROP TRIGGER IF EXISTS trigger_chain_entry_post_created ON chronicles_chain_entry_posts CASCADE;
DROP TRIGGER IF EXISTS trigger_chronicle_post_published ON chronicles_posts CASCADE;
DROP TRIGGER IF EXISTS trigger_flag_post_for_review ON chronicles_flagged_reviews CASCADE;
DROP FUNCTION IF EXISTS handle_chain_entry_post_commented() CASCADE;
DROP FUNCTION IF EXISTS handle_chain_entry_post_liked() CASCADE;
DROP FUNCTION IF EXISTS handle_creator_followed() CASCADE;
DROP FUNCTION IF EXISTS handle_post_commented() CASCADE;
DROP FUNCTION IF EXISTS handle_post_liked() CASCADE;
DROP FUNCTION IF EXISTS handle_chain_created() CASCADE;
DROP FUNCTION IF EXISTS handle_chain_entry_post_created() CASCADE;
DROP FUNCTION IF EXISTS handle_chronicle_post_published() CASCADE;
DROP FUNCTION IF EXISTS handle_flag_post_for_review() CASCADE;
DROP TABLE IF EXISTS chronicles_flagged_reviews CASCADE;
```

**Warning**: This will delete all flagged reviews data. Make sure you have a backup!

---

## Support & Documentation

- Migration Guide: See `MIGRATION_GUIDE.md`
- Schema Changes: Check database_schema.sql
- API Integration: See API examples in next steps
- Notification Types: See MIGRATION_GUIDE.md for full list

---

**Date**: 2026-04-13  
**Status**: Ready for Production  
**Last Updated**: 2026-04-13
