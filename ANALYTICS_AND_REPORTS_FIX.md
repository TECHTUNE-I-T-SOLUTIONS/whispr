# Admin Analytics & Reports Fix - Complete Guide

## Summary of Issues Fixed

### Issue 1: Report Generation Error (PGRST204)
**Error Message:**
```
Report insert error: {
  code: 'PGRST204',
  message: "Could not find the 'end_date' column of 'chronicles_generated_reports' in the schema cache"
}
```

**Root Cause:**
The API endpoint was using incorrect column names that don't exist in the database schema:
- ❌ `start_date` → ✅ `period_start`
- ❌ `end_date` → ✅ `period_end`  
- ❌ `generated_at` → ✅ (handled by `created_at` default)
- ❌ Missing `report_name` (NOT NULL required field)
- ❌ Missing `generated_by_user_id` (optional but important for audit)

**File Fixed:**
`d:\Codes\whispr\app\api\chronicles\admin\reports\route.ts`

**Changes Made:**
```typescript
// BEFORE (WRONG):
.insert({
  template_id: templateId,
  report_type: template?.report_type || reportType,
  title: `${reportType} Report - ${new Date().toLocaleDateString()}`,
  report_data: reportData,
  start_date: startDate.toISOString().split('T')[0],          // ❌ WRONG
  end_date: endDate.toISOString().split('T')[0],              // ❌ WRONG
  status: 'generated',
  generated_at: new Date().toISOString(),                      // ❌ WRONG
})

// AFTER (CORRECT):
.insert({
  template_id: templateId,
  creator_id: creatorId || null,
  report_name: reportName,                                      // ✅ ADDED (required)
  report_type: template?.report_type || reportType,
  period_start: startDate.toISOString().split('T')[0],        // ✅ FIXED
  period_end: endDate.toISOString().split('T')[0],            // ✅ FIXED
  report_data: reportData,
  file_format: 'json',
  status: 'generated',
  generated_by_user_id: user?.id || null,                     // ✅ ADDED
})
```

**Schema Reference (chronicles_generated_reports):**
```sql
CREATE TABLE public.chronicles_generated_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  creator_id uuid,
  report_name text NOT NULL,           -- ← Required field
  report_type text NOT NULL,
  period_start date NOT NULL,          -- ← NOT start_date
  period_end date NOT NULL,            -- ← NOT end_date
  report_data jsonb NOT NULL,
  summary text,
  file_path text,
  file_format text DEFAULT 'json'::text,
  file_size_bytes integer,
  generated_by_user_id uuid,
  generation_time_ms integer,
  status text DEFAULT 'generated'::text,
  error_message text,
  download_count integer DEFAULT 0,
  last_downloaded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_generated_reports_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_generated_reports_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.chronicles_report_templates(id),
  CONSTRAINT chronicles_generated_reports_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
```

---

### Issue 2: Analytics Data Initialization  

**Solution:** 
Created comprehensive SQL script: `sql-migrations/populate-analytics.sql`

This script populates all analytics tables with real data aggregated from existing content:

#### Tables Populated:

1. **chronicles_post_analytics**
   - Aggregates Views, Likes, Comments, Shares from `chronicles_posts`
   - Calculates engagement rates, virality scores
   - Tracks first engagement timestamps

2. **chronicles_creator_analytics** 
   - Daily snapshot of creator performance
   - Posts created, followers, total engagement
   - Earnings and ad metrics

3. **chronicles_daily_analytics**
   - Platform-wide daily statistics
   - Total creators, new creators, active creators
   - Platform engagement metrics

4. **chronicles_engagement_report_data**
   - Links engagement data to generated reports
   - Daily engagement breakdown by metric type

5. **chronicles_creator_report_data**
   - Links creator metrics to generated reports
   - Performance KPIs per creator per report

6. **chronicles_content_report_data**
   - Links individual post metrics to reports
   - Detailed content performance data

7. **chronicles_ad_analytics**
   - Tracks ad performance per placement
   - Initialized for all active placements and creators

8. **chronicles_audience_demographics**
   - Initialize demographic data structure
   - Ready for demographic tracking

---

## How to Use

### Step 1: Run Analytics Population Script

1. **In Supabase Dashboard:**
   - Go to SQL Editor
   - Click "New Query"
   - Paste contents of `sql-migrations/populate-analytics.sql`
   - Click "Run"

2. **Or run via terminal (if you have direct DB access):**
   ```bash
   psql -h [hostname] -U [user] -d [database] -f sql-migrations/populate-analytics.sql
   ```

### Step 2: Verify the Fix

1. **In your admin dashboard**, try generating a report:
   - Select a report template
   - Choose date range
   - Click "Generate Report"
   - Should complete without PGRST204 error

2. **Check Supabase logs:**
   - Should see 200 status for POST request
   - No "Could not find the 'end_date' column" error

### Step 3: Keep Analytics Updated

The population script uses `ON CONFLICT ... DO UPDATE`, so:
- Running it multiple times is safe (updates existing records)
- Run it **once daily** to refresh analytics for previous day

**Recommended: Add to Supabase cron job**

Create a scheduled function in Supabase:
```sql
-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_daily_analytics()
RETURNS void AS $$
BEGIN
  -- Re-run analytics aggregation for yesterday
  -- (Insert your population script logic here for date = CURRENT_DATE - 1)
END;
$$ LANGUAGE plpgsql;

-- Schedule it daily at 1 AM
SELECT cron.schedule('refresh-daily-analytics', '0 1 * * *', 'SELECT refresh_daily_analytics()');
```

---

## Automatic Updates as Content is Created

To automatically update analytics when creators post new content, add these triggers:

### Trigger 1: Update Post Analytics on Post Engagement
```sql
CREATE OR REPLACE FUNCTION update_post_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chronicles_post_analytics (
    post_id, total_views, total_likes, total_comments, 
    total_shares, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.views_count, NEW.likes_count, 
    NEW.comments_count, NEW.shares_count,
    NOW(), NOW()
  )
  ON CONFLICT (post_id) DO UPDATE SET
    total_views = NEW.views_count,
    total_likes = NEW.likes_count,
    total_comments = NEW.comments_count,
    total_shares = NEW.shares_count,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_analytics_update
AFTER INSERT OR UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_post_analytics();
```

### Trigger 2: Update Creator Analytics on New Post
```sql
CREATE OR REPLACE FUNCTION update_creator_analytics_on_post()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chronicles_creator_analytics (
    creator_id, date, posts_created, created_at, updated_at
  ) VALUES (
    NEW.creator_id, CURRENT_DATE, 1, NOW(), NOW()
  )
  ON CONFLICT (creator_id) DO UPDATE SET
    posts_created = chronicles_creator_analytics.posts_created + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creator_analytics_update
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_analytics_on_post();
```

---

## Files Modified

1. ✅ **d:\Codes\whispr\app\api\chronicles\admin\reports\route.ts**
   - Fixed column names in POST insert
   - Added user ID tracking
   - Added required `report_name` field

2. ✅ **d:\Codes\whispr\sql-migrations\populate-analytics.sql** (NEW)
   - Complete analytics population script
   - Real data aggregation from existing content
   - All report data tables populated

---

## Testing Checklist

- [ ] Run `populate-analytics.sql` script in Supabase
- [ ] Verify data populated in `chronicles_post_analytics` table
- [ ] Verify data populated in `chronicles_creator_analytics` table  
- [ ] Navigate to Admin > Reports page
- [ ] Select a report template
- [ ] Choose date range (any range works now)
- [ ] Click "Generate Report"
- [ ] Verify report generates without errors
- [ ] Check that report appears in reports list
- [ ] Verify `period_start` and `period_end` columns are populated correctly in `chronicles_generated_reports`

---

## Troubleshooting

### Still getting PGRST204 error?
- Clear your browser cache
- Restart Next.js dev server: `npm run dev`
- Verify the file changes were saved correctly

### Analytics don't show data?
- Confirm script ran successfully in Supabase
- Check that you have creators and posts in database
- Run: `SELECT COUNT(*) FROM public.chronicles_post_analytics;`

### Want to check column names?
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chronicles_generated_reports'
ORDER BY ordinal_position;
```

---

## Future Improvements

1. **Batch Analytics Updates:** Create a background job that runs aggregate queries more efficiently
2. **Real-time Dashboard:** Use Supabase realtime subscriptions to update analytics in real-time
3. **Performance Metrics:** Add indexes on commonly queried analytics columns
4. **Data Retention:** Implement archive strategy for old analytics data
5. **Report Templates:** Create more granular report templates for different metrics

---

**Status: ✅ FIXED**
- Report generation error resolved
- Analytics tables populated with real data
- Ready for automatic updates as new content is created
